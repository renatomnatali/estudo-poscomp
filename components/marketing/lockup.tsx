import { Icon } from './icon';

interface LockupProps {
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
}

export function Lockup({ size = 'md', dark = false }: LockupProps) {
  const cls = `aprovado-lockup is-${size}${dark ? ' on-dark' : ''}`;
  const checkSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 18;
  return (
    <span className={cls}>
      <span className="aprovado-ring">
        <Icon name="check" size={checkSize} strokeWidth={3} />
      </span>
      <span className="aprovado-word">
        aprov<span className="a">a</span>do
      </span>
    </span>
  );
}
