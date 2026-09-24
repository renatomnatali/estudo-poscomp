import { describe, expect, it } from 'vitest';

import {
  isValidPassword,
  PASSWORD_REGEX,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from '@/lib/password';

describe('isValidPassword', () => {
  it('aceita senha com 8 chars, maiúscula, minúscula e número', () => {
    expect(isValidPassword('SenhaForte1')).toBe(true);
  });

  it('aceita senha com exatos 8 chars (limite inferior inclusive)', () => {
    expect(isValidPassword('Abc12345')).toBe(true);
  });

  it('rejeita senha com 7 chars (um a menos que o mínimo)', () => {
    expect(isValidPassword('Abc1234')).toBe(false);
  });

  it('aceita senha com exatos 128 chars (limite superior inclusive)', () => {
    const senha = `Aa1${'x'.repeat(125)}`;
    expect(senha.length).toBe(128);
    expect(isValidPassword(senha)).toBe(true);
  });

  it('rejeita senha com 129 chars (um a mais que o máximo)', () => {
    const senha = `Aa1${'x'.repeat(126)}`;
    expect(senha.length).toBe(129);
    expect(isValidPassword(senha)).toBe(false);
  });

  it('rejeita senha sem maiúscula', () => {
    expect(isValidPassword('senhafraca1')).toBe(false);
  });

  it('rejeita senha sem minúscula', () => {
    expect(isValidPassword('SENHAFRACA1')).toBe(false);
  });

  it('rejeita senha sem número', () => {
    expect(isValidPassword('SenhaForteX')).toBe(false);
  });

  it('rejeita valor não-string sem lançar', () => {
    expect(isValidPassword(null)).toBe(false);
    expect(isValidPassword(undefined)).toBe(false);
    expect(isValidPassword(12345678)).toBe(false);
    expect(isValidPassword({})).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('rejeita string gigante (1MB) quase instantaneamente — comprimento é checado antes do regex', () => {
    // Mitigação de DoS em bcrypt: a checagem de comprimento vem ANTES do
    // regex. A única diferença observável entre as duas ordens é o custo;
    // este teste é um smoke de tempo (espelho do sem-cilada), enquanto os
    // limites 128/129 acima fixam o contrato comportamental do cap.
    const senha = `A1a${'x'.repeat(1_000_000)}`;

    const inicio = Date.now();
    expect(isValidPassword(senha)).toBe(false);
    expect(Date.now() - inicio).toBeLessThan(200);
  });
});

describe('contrato da política de senha', () => {
  it('regex exige a faixa completa 8–128 (cap superior não pode sumir num refactor)', () => {
    // O cap {8,128} no regex é a segunda barreira (defense in depth) do
    // limite de 128 — perder o `,128` aqui enfraqueceria a mitigação de DoS
    // mesmo com o guard de comprimento intacto.
    expect(PASSWORD_REGEX.source).toContain('{8,128}');
  });

  it('mensagem de requisitos informa TODOS os requisitos em português', () => {
    // A mensagem é o contrato exibido ao usuário quando a senha é recusada:
    // precisa citar a faixa de comprimento e os 3 tipos de caractere.
    expect(PASSWORD_REQUIREMENTS_MESSAGE).toMatch(/entre 8 e 128/);
    expect(PASSWORD_REQUIREMENTS_MESSAGE).toMatch(/maiúscula/);
    expect(PASSWORD_REQUIREMENTS_MESSAGE).toMatch(/minúscula/);
    expect(PASSWORD_REQUIREMENTS_MESSAGE).toMatch(/número/);
  });
});
