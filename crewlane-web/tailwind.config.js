/** @type {import('tailwindcss').Config} */
const clayCard =
  '16px 16px 32px rgba(160, 150, 180, 0.2), -10px -10px 24px rgba(255, 255, 255, 0.9), inset 6px 6px 12px rgba(139, 92, 246, 0.03), inset -6px -6px 12px rgba(255, 255, 255, 1)';
const clayCardHover =
  '20px 24px 44px rgba(160, 150, 180, 0.28), -10px -10px 24px rgba(255, 255, 255, 0.9), inset 6px 6px 12px rgba(139, 92, 246, 0.03), inset -6px -6px 12px rgba(255, 255, 255, 1)';
const clayButton =
  '12px 12px 24px rgba(139, 92, 246, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.4), inset 4px 4px 8px rgba(255, 255, 255, 0.4), inset -4px -4px 8px rgba(0, 0, 0, 0.1)';
const clayPressed = 'inset 10px 10px 20px #D9D4E3, inset -10px -10px 20px #FFFFFF';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F4F1FA',
        ink: '#332F3A',
        muted: '#635F69',
        teal: '#10B981',
        coral: '#DB2777',
        mustard: '#F59E0B',
        violet: '#7C3AED',
        sky: '#0EA5E9',
        clay: {
          canvas: '#F4F1FA',
          foreground: '#332F3A',
          muted: '#635F69',
          accent: '#7C3AED',
          accentAlt: '#DB2777',
          tertiary: '#0EA5E9',
          success: '#10B981',
          warning: '#F59E0B',
          input: '#EFEBF5',
        },
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        btn: '20px',
        card: '32px',
        chip: '24px',
        icon: '16px',
        shell: '48px',
      },
      boxShadow: {
        clayCard,
        clayCardHover,
        clayButton,
        clayPressed,
        hard: clayCard,
        'hard-sm': clayCard,
        'hard-pressed': clayPressed,
        'hard-sm-pressed': clayPressed,
      },
      keyframes: {
        'clay-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-48px) rotate(5deg)' },
        },
      },
      animation: {
        'clay-float': 'clay-float 10s ease-in-out infinite',
        'clay-float-delayed': 'clay-float 12s ease-in-out 3s infinite',
        'clay-float-late': 'clay-float 9s ease-in-out 6s infinite',
      },
    },
  },
  plugins: [],
};
