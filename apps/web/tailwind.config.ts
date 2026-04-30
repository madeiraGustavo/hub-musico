import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     '#0a0a0f',
          surface:  '#111118',
          elevated: '#1a1a24',
          card:     '#16161f',
        },
        accent: {
          DEFAULT: '#6c63ff',
          pink:    '#e040fb',
          dim:     'rgba(108,99,255,0.15)',
        },
        text: {
          primary:   '#f0f0f8',
          secondary: '#9090a8',
          muted:     '#55556a',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          glow:    'rgba(108,99,255,0.35)',
        },
      },
      fontFamily: {
        main: ['Inter', 'sans-serif'],
        head: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '32px',
      },
      backgroundImage: {
        'grad-main': 'linear-gradient(135deg, #6c63ff, #e040fb)',
        'grad-glow': 'linear-gradient(135deg, rgba(108,99,255,0.4), rgba(224,64,251,0.4))',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108,99,255,0.3)' },
          '50%':       { boxShadow: '0 0 40px rgba(108,99,255,0.6), 0 0 80px rgba(224,64,251,0.2)' },
        },
      },
      animation: {
        'fade-in':   'fadeIn 0.9s ease both',
        'spin-slow': 'spin 12s linear infinite',
        'pulse-glow': 'pulseGlow 3s infinite',
      },
    },
  },
  plugins: [],
}

export default config
