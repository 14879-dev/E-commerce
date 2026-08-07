/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          900: '#F8FAFC', // Crisp light background container
          800: '#FFFFFF', // Clean white base background
          700: '#F1F5F9', // Subtle slate hover
        },
        sandstone: {
          800: '#F8FAFC',
          700: '#F1F5F9',
          600: '#E2E8F0',
        },
        copper: {
          DEFAULT: '#2563EB', // Premium Royal Blue
          light: '#3B82F6',   // Bright Royal Blue
          dark: '#1D4ED8',    // Deep Sapphire Blue
          glow: 'rgba(37, 99, 235, 0.35)',
        },
        brass: {
          DEFAULT: '#1E40AF', // Deep Royal Blue
          light: '#2563EB',
          dark: '#1E3A8A',
        },
        saddle: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#1D4ED8',
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.85)',
          surfaceHover: 'rgba(255, 255, 255, 0.98)',
          border: 'rgba(226, 232, 240, 0.9)',
          borderHover: 'rgba(37, 99, 235, 0.4)',
          highlight: 'rgba(37, 99, 235, 0.1)',
        },
        text: {
          primary: '#0F172A', // Sharp Black/Dark Slate for main text
          muted: '#475569',   // Slate Gray for body/secondary text
          dark: '#FFFFFF',   // White text for dark buttons
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Fraunces', 'serif'],
        sans: ['Inter', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'glass-warm': '0 8px 30px 0 rgba(15, 23, 42, 0.08)',
        'copper-glow': '0 0 25px rgba(37, 99, 235, 0.35)',
        'brass-glow': '0 0 20px rgba(30, 64, 175, 0.25)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
