import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        circus: {
          red: '#E63946',
          dark: '#0d0408',
          gold: '#FFD700',
        },
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
      },
      keyframes: {
        pulse_red: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        pulse_red: 'pulse_red 1.5s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
