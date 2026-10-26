/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict 3-Color Luxury Theme (Olive Drab, Warm Taupe, Bone)
        olive: {
          DEFAULT: '#565449',
          light: '#6E6B5D',
          dark: '#45433A',
        },
        taupe: {
          DEFAULT: '#A0988A',
          light: '#B5AEA1',
          dark: '#8B8375',
        },
        bone: {
          DEFAULT: '#F7F4EB',
          light: '#FAF7F0',
          dark: '#EDE7D9',
        },

        // Black and White removed: remapped to theme
        black: '#1A1A18',
        white: '#F7F4EB',

        slate: {
          50: '#F7F4EB',
          100: '#F7F4EB',
          200: 'rgba(86, 84, 73, 0.35)',
          300: '#A0988A',
          400: '#A0988A',
          500: '#A0988A',
          600: '#1A1A18',
          700: '#1A1A18',
          800: '#1A1A18',
          900: '#1A1A18',
          950: '#111110',
        },
        gray: {
          50: '#F7F4EB',
          100: '#F7F4EB',
          200: 'rgba(86, 84, 73, 0.35)',
          300: '#A0988A',
          400: '#A0988A',
          500: '#A0988A',
          600: '#1A1A18',
          700: '#1A1A18',
          800: '#1A1A18',
          900: '#1A1A18',
          950: '#111110',
        },
        zinc: {
          50: '#F7F4EB',
          100: '#F7F4EB',
          200: 'rgba(86, 84, 73, 0.35)',
          300: '#A0988A',
          400: '#A0988A',
          500: '#A0988A',
          600: '#1A1A18',
          700: '#1A1A18',
          800: '#1A1A18',
          900: '#1A1A18',
          950: '#111110',
        },
        neutral: {
          50: '#F7F4EB',
          100: '#F7F4EB',
          200: 'rgba(86, 84, 73, 0.35)',
          300: '#A0988A',
          400: '#A0988A',
          500: '#A0988A',
          600: '#1A1A18',
          700: '#1A1A18',
          800: '#1A1A18',
          900: '#1A1A18',
          950: '#111110',
        },


        // Legacy theme tokens aligned strictly with the 3 colors
        smoky: {
          DEFAULT: '#1A1A18',
          dark: '#111110',
        },
        floral: {
          DEFAULT: '#F7F4EB',
          dark: '#EDE7D9',
        },
        espresso: {
          900: '#565449',
          800: '#F7F4EB',
          700: '#A0988A',
        },
        sandstone: {
          800: '#F7F4EB',
          700: '#F7F4EB',
          600: '#A0988A',
        },
        copper: {
          DEFAULT: '#565449',
          light: '#6E6B5D',
          dark: '#45433A',
          glow: 'rgba(86, 84, 73, 0.25)',
        },
        brass: {
          DEFAULT: '#565449',
          light: '#A0988A',
          dark: '#45433A',
        },
        saddle: {
          DEFAULT: '#565449',
          light: '#A0988A',
          dark: '#45433A',
        },
        glass: {
          surface: 'rgba(216, 207, 188, 0.85)',
          surfaceHover: 'rgba(216, 207, 188, 0.95)',
          border: 'rgba(160, 152, 138, 0.75)',
          borderHover: 'rgba(86, 84, 73, 0.6)',
          highlight: 'rgba(86, 84, 73, 0.12)',
        },
        text: {
          primary: '#1A1A18', // Smoky Black
          muted: '#A0988A',   // Warm Taupe
          dark: '#F7F4EB',    // Bone text on Olive Drab
        }
      },
      fontFamily: {
        serif: ['Forum', 'serif'],
        sans: ['Forum', 'serif'],
      },
      boxShadow: {
        'glass-warm': '0 8px 30px 0 rgba(86, 84, 73, 0.08)',
        'copper-glow': '0 0 25px rgba(86, 84, 73, 0.25)',
        'brass-glow': '0 0 20px rgba(86, 84, 73, 0.25)',
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
