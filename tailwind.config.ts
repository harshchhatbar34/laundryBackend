import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/admin/**/*.{js,ts,jsx,tsx,mdx}',
    './app/(admin)/**/*.{js,ts,jsx,tsx,mdx}',
    './components/admin/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Qwasho navy — the primary shell
        navy: {
          950: '#050C1A',
          900: '#0A1628',
          800: '#0F2040',
          700: '#142952',
          600: '#1A3468',
          500: '#1E3D7A',
        },
        // Cyan — active states, accents, data highlights
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          glow: 'rgba(34,211,238,0.15)',
        },
        // Neutral surface system
        surface: {
          DEFAULT: '#FFFFFF',
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          border: '#E2E8F0',
        },
        // Dark mode surface system
        dark: {
          DEFAULT: '#0A1628',
          50:  '#0F1E35',
          100: '#142540',
          200: '#1A2D4D',
          300: '#20375C',
          border: '#1A2D4D',
        },
        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
        info:    '#3B82F6',
      },
      backgroundImage: {
        'qwasho-gradient': 'linear-gradient(135deg, #050C1A 0%, #0A1E3D 50%, #0E2756 100%)',
        'cyan-glow': 'radial-gradient(ellipse at center, rgba(34,211,238,0.08) 0%, transparent 70%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)',
      },
      boxShadow: {
        'cyan-sm':  '0 0 0 1px rgba(34,211,238,0.3)',
        'cyan-md':  '0 0 16px rgba(34,211,238,0.2), 0 0 0 1px rgba(34,211,238,0.3)',
        'card':     '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
        'nav-active': 'inset 3px 0 0 #22D3EE',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in-left': 'slideInLeft 0.25s ease forwards',
        'count-up': 'countUp 0.6s ease forwards',
        'pulse-cyan': 'pulseCyan 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseCyan: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34,211,238,0.3)' },
          '50%':      { boxShadow: '0 0 24px rgba(34,211,238,0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
