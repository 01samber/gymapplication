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
          DEFAULT: '#8B7355', // Sepia - flipbook accent
          dark: '#6B5D4F',
          light: '#A08060',
        },
        secondary: {
          DEFAULT: '#7D6E5D',
          dark: '#5D5145',
          light: '#9D8B75',
        },
        paper: {
          DEFAULT: '#F5F0E6',
          dark: '#E8E0D0',
          light: '#FAF7F0',
        },
        ink: {
          DEFAULT: '#3D3529',
          muted: '#6B5D4F',
        },
        accent: {
          orange: '#D4A574',
          red: '#B85C38',
          blue: '#5B7A9E',
          purple: '#8B7355',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
