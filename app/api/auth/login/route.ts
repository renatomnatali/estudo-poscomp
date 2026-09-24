import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { signToken } from "@/lib/auth";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { securityLog } from "@/lib/security-logger";
import { normalizeEmail } from "@/lib/email";
import { requireSameOrigin } from "@/lib/csrf";
import { verifyTurnstile } from "@/lib/turnstile";
import { withDbRetry, isTransientConnectionError } from "@/lib/db-retry";

// Espelho do sem-cilada (src/app/api/auth/login/route.ts), sem adaptações de
// comportamento. Apenas os comentários que justificavam o sameSite=lax pelo
// retorno do Mercado Pago foram reescritos para a razão equivalente daqui
// (navegação top-level vinda dos e-mails transacionais).

// failClosed: bloqueia login se Redis cair. Trade-off aceito — preferimos
// negar serviço temporário a permitir credential stuffing irrestrito (MS4).
const loginLimiter = createRateLimiter(10, 60 * 1000, {
  failClosed: true,
  name: "login",
});

export async function POST(request: NextRequest) {
  // CSRF defense-in-depth: bloqueia POST cross-site iniciado por <form>
  // de outro domínio. sameSite=lax do cookie já permite a navegação
  // top-level chegar com sessão, mas POSTs forjados são detectáveis via
  // Sec-Fetch-Site.
  const csrfBlock = requireSameOrigin(request);
  if (csrfBlock) return csrfBlock;

  const ip = getClientIp(request.headers);

  if (await loginLimiter.isLimited(ip)) {
    securityLog({ event: "LOGIN_RATE_LIMITED", ip });
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento." },
      { status: 429 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido" },
      { status: 400 },
    );
  }
  const { email: rawEmail, password, turnstileToken } = body;

  // Exigir ambos os campos ANTES de qualquer lookup (evita enumeration)
  if (!rawEmail || !password || typeof rawEmail !== "string") {
    return NextResponse.json(
      { error: "E-mail e senha são obrigatórios" },
      { status: 400 },
    );
  }

  // Turnstile defense-in-depth: bloqueia credential-stuffing automatizado
  // ANTES de gastar CPU em bcrypt.compare (~100ms por tentativa). Sem
  // isso, atacante com lista de creds vazadas consegue ~10 req/min via
  // proxies rotativos sem nunca bater no rate-limit por IP.
  // Em dev/preview sem TURNSTILE_SECRET_KEY, verifyTurnstile retorna true (bypass).
  // Não cortocircuitar com !turnstileToken — token pode vir vazio quando
  // NEXT_PUBLIC_TURNSTILE_SITE_KEY não está setada (TurnstileWidget renderiza null).
  if (!(await verifyTurnstile(turnstileToken ?? "", ip))) {
    securityLog({ event: "TURNSTILE_FAILED", ip, detail: "login" });
    return NextResponse.json(
      { error: "Verificação de segurança falhou. Recarregue a página." },
      { status: 403 },
    );
  }

  // Normaliza para coincidir com como o email foi armazenado em register.
  // Sem isso, login com "Foo@Bar.com" falha mesmo quando a conta foi
  // criada com "foo@bar.com".
  const email = normalizeEmail(rawEmail);

  // Em serverless sobre Neon/PgBouncer, a conexão do pool pode estar *stale*
  // entre invocações: a primeira query lança erro de conexão. withDbRetry
  // reexecuta uma vez (pega conexão nova). Se ainda assim falhar, devolvemos
  // 503 com corpo JSON — sem isto, o erro escaparia como 500 sem corpo e o
  // cliente cairia no fallback genérico "Erro na requisição". Ver db-retry.ts.
  let user;
  try {
    user = await withDbRetry(() =>
      db.user.findUnique({ where: { email } }),
    );
  } catch (err) {
    if (isTransientConnectionError(err)) {
      securityLog({ event: "LOGIN_DB_ERROR", ip, email, detail: "db connection" });
      return NextResponse.json(
        {
          error:
            "Instabilidade temporária no servidor. Tente novamente em instantes.",
        },
        { status: 503 },
      );
    }
    throw err;
  }

  // password não-string (ex.: number no JSON) faria bcrypt.compare lançar
  // (500). Coagir para string vazia mantém o caminho genérico do 401.
  const passwordStr = typeof password === "string" ? password : "";

  // Resposta genérica para: user não existe, senha errada ou conta excluída
  // (soft-delete). Isso previne account enumeration — conta deletada não pode
  // se distinguir de inexistente.
  // Dummy compare para manter timing constante (evita timing side-channel)
  if (!user || !user.passwordHash || user.deletedAt) {
    await compare(passwordStr, "$2a$10$1ZxEuoem9p0E52gYee/MF.RIMFdbS5VJMgodyYOTZ/DUZ6Z/nQNFS");
    if (user && user.deletedAt) {
      securityLog({
        event: "LOGIN_FAILED",
        ip,
        email,
        userId: user.id,
        detail: "deleted",
      });
    } else if (user && !user.passwordHash) {
      securityLog({
        event: "LOGIN_FAILED",
        ip,
        email,
        userId: user.id,
        detail: "no password",
      });
    } else {
      securityLog({ event: "LOGIN_FAILED", ip, email, detail: "user not found" });
    }
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 },
    );
  }

  const ok = await compare(passwordStr, user.passwordHash);
  if (!ok) {
    securityLog({
      event: "LOGIN_FAILED",
      ip,
      email,
      userId: user.id,
      detail: "wrong password",
    });
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 },
    );
  }

  if (!user.emailVerified) {
    securityLog({
      event: "LOGIN_FAILED",
      ip,
      email,
      userId: user.id,
      detail: "email not verified",
    });
    return NextResponse.json(
      {
        error:
          "Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada (e spam) ou reenvie o link de verificação.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 },
    );
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    emailVerified: !!user.emailVerified,
    role: user.role,
  });

  securityLog({ event: "LOGIN_SUCCESS", ip, email, userId: user.id });

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      // Login retorna o user COMPLETO para que a UI de conta não precise de
      // um segundo fetch (/me) nem pisque com dados incompletos.
      role: user.role,
    },
  });

  // sameSite=lax (não strict): strict bloqueia o cookie na primeira request
  // após navegação cross-site — ex.: link dos e-mails transacionais (verificação,
  // redefinição) aberto no webmail conta como navegação cross-site na 1ª visita.
  // CSRF é mitigado nos endpoints state-changing via requireSameOrigin
  // (header Sec-Fetch-Site). Ver lib/csrf.ts.
  response.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
