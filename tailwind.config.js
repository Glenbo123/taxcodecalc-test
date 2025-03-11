/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'govuk-blue': '#008476',
        'govuk-green': '#00703c',
        'govuk-red': '#d4351c',
        'govuk-yellow': '#ffdd00',
        'govuk-grey': '#f3f2f1',
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#008476',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        }
      },
      fontSize: {
        'govuk-xl': ['48px', { lineHeight: '50px', letterSpacing: '0' }],
        'govuk-l': ['32px', { lineHeight: '35px', letterSpacing: '0' }],
        'govuk-m': ['24px', { lineHeight: '30px', letterSpacing: '0' }],
        'govuk-s': ['19px', { lineHeight: '25px', letterSpacing: '0' }],
        'govuk-body': ['19px', { lineHeight: '25px', letterSpacing: '0' }],
        'govuk-body-s': ['16px', { lineHeight: '20px', letterSpacing: '0' }],
        'govuk-xl-mobile': ['32px', { lineHeight: '35px', letterSpacing: '0' }],
        'govuk-l-mobile': ['24px', { lineHeight: '30px', letterSpacing: '0' }],
        'govuk-m-mobile': ['21px', { lineHeight: '25px', letterSpacing: '0' }],
      },
      spacing: {
        'govuk-gutter': '30px',
        'govuk-gutter-half': '15px',
        'govuk-spacing-1': '5px',
        'govuk-spacing-2': '10px',
        'govuk-spacing-3': '15px',
        'govuk-spacing-4': '20px',
        'govuk-spacing-5': '25px',
        'govuk-spacing-6': '30px',
        'govuk-spacing-8': '40px',
        'govuk-spacing-9': '45px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      screens: {
        'govuk-mobile': '640px',
        'govuk-tablet': '768px',
        'govuk-desktop': '1024px',
      },
      animation: {
        slideUpAndFade: 'slideUpAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideRightAndFade: 'slideRightAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideDownAndFade: 'slideDownAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        slideLeftAndFade: 'slideLeftAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        slideUpAndFade: {
          '0%': { opacity: 0, transform: 'translateY(2px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideRightAndFade: {
          '0%': { opacity: 0, transform: 'translateX(-2px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        slideDownAndFade: {
          '0%': { opacity: 0, transform: 'translateY(-2px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideLeftAndFade: {
          '0%': { opacity: 0, transform: 'translateX(2px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};