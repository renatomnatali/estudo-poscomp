// Limpar variáveis de banco ANTES de qualquer outro import — repos
// avaliam process.env.DATABASE_URL no caminho síncrono inicial; se
// estiverem setadas (ex.: vindas de .env carregado pelo Vitest plugin),
// caem no caminho Prisma e tentam hit no Neon. Testes precisam ser
// in-memory determinísticos.
process.env.DATABASE_URL = '';
process.env.DATABASE_URL_UNPOOLED = '';
process.env.POSTGRES_URL = '';
process.env.POSTGRES_URL_NON_POOLING = '';
process.env.POSTGRES_PRISMA_URL = '';
process.env.POSTGRES_URL_NO_SSL = '';

import '@testing-library/jest-dom/vitest';
