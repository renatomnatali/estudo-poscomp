import { PrismaClient } from '@prisma/client';

type Command = 'grant' | 'revoke' | 'list';

type ArgMap = Record<string, string | boolean>;

function parseArgs(argv: string[]) {
  const [, , rawCommand, ...rest] = argv;
  const command = (rawCommand || '').trim() as Command;

  const args: ArgMap = {};
  for (let index = 0; index < rest.length; index += 1) {
    const entry = rest[index] || '';
    if (!entry.startsWith('--')) continue;

    const key = entry.slice(2);
    const next = rest[index + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      index += 1;
      continue;
    }

    args[key] = true;
  }

  return { command, args };
}

function asString(value: string | boolean | undefined) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data inválida: ${value}`);
  }
  return date;
}

function parseGrantType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'vip' || normalized === 'promo' || normalized === 'manual') {
    return normalized;
  }
  throw new Error(`Tipo de grant inválido: ${value}. Use vip, promo ou manual.`);
}

function usage() {
  return [
    'Uso:',
    '  npm run access:grant -- grant --email usuario@dominio.com --type vip --granted-by admin@dominio.com --reason "Suporte"',
    '  npm run access:grant -- revoke --id <grant-id>',
    '  npm run access:grant -- revoke --email usuario@dominio.com',
    '  npm run access:grant -- list --email usuario@dominio.com',
  ].join('\n');
}

async function grant(prisma: PrismaClient, args: ArgMap) {
  const rawEmail = asString(args.email);
  const emailNormalized = rawEmail ? normalizeEmail(rawEmail) : '';
  const userId = asString(args['user-id']);

  if (!emailNormalized && !userId) {
    throw new Error('Informe --email ou --user-id para conceder acesso.');
  }

  const type = parseGrantType(asString(args.type) || 'vip');
  const startsAt = asString(args['starts-at']) ? parseDate(asString(args['starts-at'])) : new Date();

  let endsAt: Date | null = null;
  if (asString(args['ends-at'])) {
    endsAt = parseDate(asString(args['ends-at']));
  } else if (asString(args.days)) {
    const days = Number(asString(args.days));
    if (!Number.isInteger(days) || days <= 0) {
      throw new Error('O valor de --days deve ser inteiro positivo.');
    }

    endsAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000);
  }

  const created = await prisma.userAccessGrant.create({
    data: {
      userId: userId || null,
      emailNormalized: emailNormalized || null,
      scope: 'premium_access',
      grantType: type,
      startsAt,
      endsAt,
      reason: asString(args.reason) || null,
      grantedBy: asString(args['granted-by']) || null,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Grant criado: ${created.id}`);
}

async function revoke(prisma: PrismaClient, args: ArgMap) {
  const id = asString(args.id);
  const rawEmail = asString(args.email);
  const emailNormalized = rawEmail ? normalizeEmail(rawEmail) : '';
  const userId = asString(args['user-id']);

  if (id) {
    const updated = await prisma.userAccessGrant.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    // eslint-disable-next-line no-console
    console.log(`Grant revogado: ${updated.id}`);
    return;
  }

  if (!emailNormalized && !userId) {
    throw new Error('Informe --id, --email ou --user-id para revogar acesso.');
  }

  const result = await prisma.userAccessGrant.updateMany({
    where: {
      scope: 'premium_access',
      revokedAt: null,
      OR: [
        ...(emailNormalized ? [{ emailNormalized }] : []),
        ...(userId ? [{ userId }] : []),
      ],
    },
    data: { revokedAt: new Date() },
  });

  // eslint-disable-next-line no-console
  console.log(`Grants revogados: ${result.count}`);
}

async function list(prisma: PrismaClient, args: ArgMap) {
  const rawEmail = asString(args.email);
  const emailNormalized = rawEmail ? normalizeEmail(rawEmail) : '';
  const userId = asString(args['user-id']);

  const where = {
    scope: 'premium_access',
    OR: [
      ...(emailNormalized ? [{ emailNormalized }] : []),
      ...(userId ? [{ userId }] : []),
    ],
  };

  const rows = await prisma.userAccessGrant.findMany({
    where: where.OR.length > 0 ? where : { scope: 'premium_access' },
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
  });

  if (rows.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Nenhum grant encontrado.');
    return;
  }

  rows.forEach((row) => {
    // eslint-disable-next-line no-console
    console.log(
      [
        row.id,
        `type=${row.grantType}`,
        `email=${row.emailNormalized || '-'}`,
        `userId=${row.userId || '-'}`,
        `startsAt=${row.startsAt.toISOString()}`,
        `endsAt=${row.endsAt ? row.endsAt.toISOString() : '-'}`,
        `revokedAt=${row.revokedAt ? row.revokedAt.toISOString() : '-'}`,
      ].join(' | ')
    );
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada.');
  }

  const { command, args } = parseArgs(process.argv);
  if (command !== 'grant' && command !== 'revoke' && command !== 'list') {
    throw new Error(`Comando inválido: ${command || '(vazio)'}\n\n${usage()}`);
  }

  const prisma = new PrismaClient();
  try {
    if (command === 'grant') {
      await grant(prisma, args);
      return;
    }

    if (command === 'revoke') {
      await revoke(prisma, args);
      return;
    }

    await list(prisma, args);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Erro inesperado ao executar access-grants.';
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
});
