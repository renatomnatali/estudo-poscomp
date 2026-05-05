export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';

// Feature flag: liga/desliga autenticação Clerk no app inteiro.
// Desligada por padrão; para habilitar defina NEXT_PUBLIC_AUTH_ENABLED=true.
export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

export function isClerkEnabledServer() {
  return AUTH_ENABLED && CLERK_PUBLISHABLE_KEY.length > 0 && CLERK_SECRET_KEY.length > 0;
}

export function isClerkEnabledClient() {
  return AUTH_ENABLED && CLERK_PUBLISHABLE_KEY.length > 0;
}

// Enquanto não há tabela de assinaturas, todos os usuários da app entram como pagantes.
export const IS_PREMIUM_USER = true;
