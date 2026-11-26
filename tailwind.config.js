/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        paper: 'var(--paper)',
        field: 'var(--field)',
        rule: 'var(--rule)',
        mark: 'var(--mark)',
        'on-mark': 'var(--on-mark)',
        line: 'var(--line)',
      },
      fontFamily: {
        sans: ['"Archivo Variable"', 'Archivo', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sheet: '2px' },
    },
  },
  plugins: [],
};
