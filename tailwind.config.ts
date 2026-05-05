import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sap: {
          DEFAULT: 'var(--sap)',
          d: 'var(--sap-d)',
          l: 'var(--sap-l)',
          bg: 'var(--sap-bg)',
          'bg-2': 'var(--sap-bg-2)',
        },
        em: {
          DEFAULT: 'var(--em)',
          d: 'var(--em-d)',
          bg: 'var(--em-bg)',
        },
        amb: {
          DEFAULT: 'var(--amb)',
          bg: 'var(--amb-bg)',
        },
        coral: {
          DEFAULT: 'var(--coral)',
          bg: 'var(--coral-bg)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          900: '#0f172a',
          700: '#334155',
          500: '#64748b',
        },
        n: {
          50: 'var(--n-50)',
          100: 'var(--n-100)',
          200: 'var(--n-200)',
          300: 'var(--n-300)',
          400: 'var(--n-400)',
          500: 'var(--n-500)',
          600: 'var(--n-600)',
          700: 'var(--n-700)',
        },
      },
      fontFamily: {
        display: ['var(--fd)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--fb)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--fm)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        cta: 'var(--sh-cta)',
        'cta-hover': 'var(--sh-cta-hover)',
        hero: 'var(--sh-hero)',
      },
      backgroundImage: {
        'grad-progress': 'var(--grad-progress)',
        'grad-logo': 'var(--grad-logo)',
        'grad-hero': 'var(--grad-hero-radial)',
      },
    },
  },
  plugins: [],
};

export default config;
