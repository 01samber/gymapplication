import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00a651',
          light: '#00c853',
          dark: '#008c45',
        },
        accent: {
          red: '#c1272d',
          'red-light': '#e63946',
        },
        surface: {
          dark: '#0a0a0a',
          DEFAULT: '#0f0f0f',
          light: '#141414',
          card: '#1a1a1a',
        },
        paper: '#1a1a1a',
        'paper-light': '#0f0f0f',
        ink: '#e2e8f0',
        'ink-muted': '#94a3b8',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cinzel)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 166, 81, 0.2)',
        'glow-red': '0 0 20px rgba(193, 39, 45, 0.2)',
      },
    },
  },
  plugins: [],
}

export default config
