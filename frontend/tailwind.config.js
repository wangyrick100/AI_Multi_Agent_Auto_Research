/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#07070f',
          surface: '#0f0f1a',
          elevated: '#16162b',
          border: '#1f1f38',
        },
        accent: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          glow: 'rgba(99,102,241,0.15)',
        },
        agent: {
          planner: '#a78bfa',
          explorer: '#60a5fa',
          extractor: '#34d399',
          critic: '#f87171',
          synthesizer: '#c084fc',
          orchestrator: '#94a3b8',
        },
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(99,102,241,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(99,102,241,0.6)' },
        },
      },
    },
  },
  plugins: [],
}
