/** @type {import('tailwindcss').Config} */

export default {

  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {

    extend: {

      /* =====================================================
         COLORS
      ===================================================== */

      colors: {

        /* Dark technical surfaces */
        surface: {
          50: '#EEEEEE',
          100: '#E2E2E2',
          200: '#CCCCCC',
          300: '#AAAAAA',
          400: '#8E8E8E',
          500: '#3D472B',
          600: '#253900',   // primary border / dark green
          650: '#1A260F',   // subtle border
          700: '#11170D',
          800: '#0C100A',   // cards
          850: '#080A06',   // inputs / secondary buttons
          900: '#050805',   // topbar
          950: '#000000',   // page background
        },

        /* Accent system. `danger` / `warn` are grey tones on purpose:
           the palette forbids red and amber. */
        accent: {
          green: '#08CB00',
          dark: '#253900',
          black: '#000000',
          grey: '#EEEEEE',
          warn: '#C8C8C8',
          danger: '#8E8E8E',
        },

        brand: {
          green: '#08CB00',
          primary: '#08CB00',
          deep: '#253900',
          dark: '#253900',
          black: '#000000',
          midnight: '#000000',
          sidebar: '#030603',
          navbar: '#050805',
        },

        /* Text: 50 headings, 100-300 body/secondary, 400 muted */
        ink: {
          50: '#EEEEEE',
          100: '#C8C8C8',
          200: '#D4D4D4',
          300: '#C8C8C8',
          400: '#8E8E8E',
          500: '#757575',
        },
      },


      /* =====================================================
         FONT
      ===================================================== */

      fontFamily: {

        sans: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          'system-ui',
          'sans-serif',
        ],

        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'monospace',
        ],
      },


      /* =====================================================
         SHADOWS
      ===================================================== */

      boxShadow: {

        panel:
          '0 1px 0 rgba(255,255,255,0.025) inset, 0 8px 30px -12px rgba(0,0,0,0.8)',

        glow:
          '0 0 0 1px rgba(8,203,0,0.25), 0 12px 34px -10px rgba(8,203,0,0.35)',

        'glow-green':
          '0 0 0 1px rgba(8,203,0,0.3), 0 12px 35px -10px rgba(8,203,0,0.4)',

        'glow-dark':
          '0 0 0 1px rgba(37,57,0,0.45), 0 12px 30px -10px rgba(0,0,0,0.8)',
      },


      /* =====================================================
         BORDER RADIUS
      ===================================================== */

      borderRadius: {

        xl2: '1.25rem',
      },


      /* =====================================================
         KEYFRAMES
      ===================================================== */

      keyframes: {

        fadeIn: {

          '0%': {
            opacity: 0,
          },

          '100%': {
            opacity: 1,
          },
        },


        countUp: {

          '0%': {
            opacity: 0,
            transform: 'translateY(8px)',
          },

          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },


        float: {

          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },

          '50%': {
            transform: 'translate(20px, -30px) scale(1.08)',
          },
        },


        floatSlow: {

          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
          },

          '50%': {
            transform: 'translate(-30px, 25px) scale(1.05)',
          },
        },


        glowPulse: {

          '0%, 100%': {
            opacity: 0.55,
            transform: 'scale(1)',
          },

          '50%': {
            opacity: 1,
            transform: 'scale(1.06)',
          },
        },


        shimmer: {

          '0%': {
            backgroundPosition: '-200% 0',
          },

          '100%': {
            backgroundPosition: '200% 0',
          },
        },


        gradientShift: {

          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },

          '50%': {
            backgroundPosition: '100% 50%',
          },
        },


        borderSpin: {

          '0%': {
            transform: 'rotate(0deg)',
          },

          '100%': {
            transform: 'rotate(360deg)',
          },
        },
      },


      /* =====================================================
         ANIMATIONS
      ===================================================== */

      animation: {

        fadeIn:
          'fadeIn 0.4s ease-out',

        countUp:
          'countUp 0.5s ease-out',

        float:
          'float 9s ease-in-out infinite',

        floatSlow:
          'floatSlow 13s ease-in-out infinite',

        glowPulse:
          'glowPulse 3s ease-in-out infinite',

        shimmer:
          'shimmer 2.2s linear infinite',

        gradientShift:
          'gradientShift 8s ease infinite',

        borderSpin:
          'borderSpin 6s linear infinite',
      },
    },
  },

  plugins: [],
};