/**
 * Ícones das telas de conta — paths literais dos mockups
 * (Spec/mockup/auth/*.html), mantidos inline para preservar a régua
 * visual (stroke, viewBox e proporções exatas do desenho do dono).
 */

interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function base(size: number, strokeWidth: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

/** Alerta de erro (círculo com X) — alerts coral e ícones 16px dos forms. */
export function IconXCircle({ size = 16, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m12 8-4 4 4 4" />
      <path d="m16 8-4 4 4 4" />
    </svg>
  );
}

/** Aviso (círculo com "i") — alert âmbar 429 e card de resultado amb 26px. */
export function IconAlertCircle({ size = 16, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/** Envelope — e-mail não verificado, link enviado etc. */
export function IconMail({ size = 16, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

/** Check — status de sucesso, chips de senha e estado resolvido do desafio. */
export function IconCheck({ size = 16, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Olho — mostrar/ocultar senha. */
export function IconEye({ size = 16, strokeWidth = 1.75, className }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
