import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0f172a',
          700: '#334155',
          500: '#64748b'
        }
      }
    }
  },
  plugins: [],
};

export default config;
