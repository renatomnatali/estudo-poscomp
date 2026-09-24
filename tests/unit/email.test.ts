import { describe, expect, it } from 'vitest';

import { normalizeEmail } from '@/lib/email';

describe('normalizeEmail', () => {
  it('normaliza e-mail com espaços e maiúsculas para a chave única do banco', () => {
    // Cenário do Gherkin: sem normalização, "Fulano@Exemplo.COM" e
    // "fulano@exemplo.com" virariam contas distintas.
    expect(normalizeEmail('  Fulano@Exemplo.COM  ')).toBe('fulano@exemplo.com');
  });

  it('preserva o sufixo +tag da local-part (decisão: não manipular local-part)', () => {
    expect(normalizeEmail('Fulano+Tag@Exemplo.com')).toBe('fulano+tag@exemplo.com');
  });

  it('aceita string vazia/whitespace sem lançar (validação de formato é do caller)', () => {
    expect(normalizeEmail('')).toBe('');
    expect(normalizeEmail('   ')).toBe('');
  });
});
