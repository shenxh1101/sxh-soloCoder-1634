/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E8F1FF',
          100: '#C6DCFF',
          200: '#94B8FF',
          300: '#5A8AFF',
          400: '#2E68FF',
          500: '#165DFF',
          600: '#0E47D9',
          700: '#0A37AD',
          800: '#082A82',
          900: '#061F5C',
        },
        success: {
          50: '#E8FFEB',
          100: '#B7F5C1',
          200: '#8BEB9D',
          300: '#5FDD78',
          400: '#2FCA4A',
          500: '#00B42A',
          600: '#009925',
          700: '#007D1F',
          800: '#005C17',
          900: '#003D0F',
        },
        warning: {
          50: '#FFF4E5',
          100: '#FFE0B8',
          200: '#FFC98A',
          300: '#FFAF57',
          400: '#FF9730',
          500: '#FF7D00',
          600: '#D96A00',
          700: '#AD5400',
          800: '#824000',
          900: '#5C2D00',
        },
        danger: {
          50: '#FFECE8',
          100: '#FFCCC4',
          200: '#FFA498',
          300: '#FF7A69',
          400: '#F75542',
          500: '#F53F3F',
          600: '#D92F2F',
          700: '#AD2424',
          800: '#821A1A',
          900: '#5C1111',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
