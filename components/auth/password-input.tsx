'use client';

import { useState, type ReactNode } from 'react';

import { IconEye } from './icons';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Elemento à direita do label (ex.: link "Esqueci minha senha"). */
  labelTrailing?: ReactNode;
  autoComplete?: 'current-password' | 'new-password';
  minLength?: number;
  describedBy?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Conteúdo abaixo do input, dentro do campo (ex.: chips de requisitos). */
  children?: ReactNode;
}

/**
 * Campo de senha com botão mostrar/ocultar — adições literais dos mockups
 * de conta (o sem-cilada não tem). O botão alterna type password/text e
 * espelha o estado em aria-pressed/aria-label.
 */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  labelTrailing,
  autoComplete,
  minLength,
  describedBy,
  autoFocus,
  disabled,
  children,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const labelElement = <label htmlFor={id}>{label}</label>;

  return (
    <div className="auth-field">
      {labelTrailing ? (
        <div className="auth-field-head">
          {labelElement}
          {labelTrailing}
        </div>
      ) : (
        labelElement
      )}
      <div className="auth-input-wrap">
        <input
          className="auth-input"
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          aria-describedby={describedBy}
          autoFocus={autoFocus}
          disabled={disabled}
          required
        />
        <button
          type="button"
          className="pwd-toggle"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <IconEye size={16} />
        </button>
      </div>
      {children}
    </div>
  );
}
