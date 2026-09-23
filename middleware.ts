import { NextResponse, type NextRequest } from 'next/server';

/**
 * Autenticação desabilitada por decisão do dono (2026-09-23: "desabilita a
 * autenticação, deixa sem clerk"); autenticação própria chega pela estória
 * APR-03.
 *
 * Este middleware costumava envolver clerkMiddleware(), que — sem as chaves
 * CLERK_* configuradas em produção — lançava em runtime e derrubava TODAS as
 * rotas com 500 MIDDLEWARE_INVOCATION_FAILED (incidente 2026-09-23, logo
 * após os deploys dos PRs #27–#29 exporem o problema).
 *
 * Sem autenticação não há quem proteja o painel: /admin e /api/admin ficam
 * fechados até a APR-03. Todo o resto passa direto (o resto do app já é
 * condicional ao Clerk via lib/auth-config e funciona anônimo).
 */
export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === '/admin' || path.startsWith('/admin/') || path === '/api/admin' || path.startsWith('/api/admin/')) {
    return new NextResponse('Painel administrativo temporariamente indisponível.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
