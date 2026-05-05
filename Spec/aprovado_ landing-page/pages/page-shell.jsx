/* global React */
/**
 * Shared chrome for inner pages (Sobre, Contato, Termos, Privacidade, Cookies).
 * Reuses Lockup + Icon from landing-app.jsx if present, otherwise inline minimal copies.
 */

const PAGE_LINKS = [
  { href: 'sobre.html',       label: 'Sobre' },
  { href: 'contato.html',     label: 'Contato' },
  { href: 'termos.html',      label: 'Termos' },
  { href: 'privacidade.html', label: 'Privacidade' },
  { href: 'cookies.html',     label: 'Cookies' },
];

/* Inline mini-icon set so pages don't depend on landing-app.jsx loading first */
function PIcon({ name, size = 20 }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.75,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'mail':  return <svg {...p}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
    case 'github': return <svg {...p}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>;
    case 'arrow-left': return <svg {...p}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
    case 'arrow-right': return <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
    case 'check': return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'sparkles': return <svg {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>;
    default: return null;
  }
}

function PLockup({ dark = false }) {
  return (
    <span className={`aprovado-lockup is-sm ${dark ? 'on-dark' : ''}`}>
      <span className="aprovado-ring">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </span>
      <span className="aprovado-word">aprov<span className="a">a</span>do</span>
    </span>
  );
}

function PageNav() {
  return (
    <nav className="page-nav">
      <div className="page-nav-inner">
        <a href="../Landing.html" style={{textDecoration: 'none'}}>
          <PLockup />
        </a>
        <a href="../Landing.html" className="back">
          <PIcon name="arrow-left" size={14} /> voltar para a landing
        </a>
      </div>
    </nav>
  );
}

function PageFoot() {
  return (
    <footer className="page-foot">
      <span>© 2026 aprovado.xyz · independente · não afiliado à SBC</span>
      <div>
        {PAGE_LINKS.filter(l => !location.pathname.endsWith(l.href)).map(l => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
      </div>
    </footer>
  );
}

/* ── Mount helpers ── */
function mountNav(elId = 'page-nav') {
  const el = document.getElementById(elId);
  if (el) ReactDOM.createRoot(el).render(<PageNav />);
}
function mountFoot(elId = 'page-foot') {
  const el = document.getElementById(elId);
  if (el) ReactDOM.createRoot(el).render(<PageFoot />);
}

Object.assign(window, { PIcon, PLockup, PageNav, PageFoot, mountNav, mountFoot, PAGE_LINKS });
