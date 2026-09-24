'use client';

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@/lib/password';

import { IconCheck } from './icons';

interface PasswordRulesProps {
  password: string;
  /** id da lista — o input recebe via aria-describedby. */
  id: string;
}

/** Regras individuais da política visível — limites importados de
 * `@/lib/password` (fonte única; trocar a política muda os chips junto). */
function ruleStatus(password: string) {
  return {
    len: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
  };
}

const RULE_LABELS: { rule: keyof ReturnType<typeof ruleStatus>; label: string }[] = [
  { rule: 'len', label: `${PASSWORD_MIN_LENGTH} a ${PASSWORD_MAX_LENGTH} caracteres` },
  { rule: 'upper', label: '1 maiúscula' },
  { rule: 'lower', label: '1 minúscula' },
  { rule: 'digit', label: '1 número' },
];

/**
 * Checklist vivo de requisitos da senha (mockups /cadastro e
 * /redefinir-senha): chips pill mono que acendem emerald conforme a senha
 * digitada satisfaz cada regra.
 */
export function PasswordRules({ password, id }: PasswordRulesProps) {
  const status = ruleStatus(password);

  return (
    <ul className="pwd-rules" id={id} aria-label="Requisitos da senha">
      {RULE_LABELS.map(({ rule, label }) => (
        <li key={rule} className={`pwd-chip${status[rule] ? ' ok' : ''}`}>
          <IconCheck size={11} strokeWidth={2.5} />
          {label}
        </li>
      ))}
    </ul>
  );
}
