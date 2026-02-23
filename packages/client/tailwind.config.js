/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Adventureland Vintage Palette
        sand: {
          DEFAULT: '#E8D4A8',
          light: '#F5ECD8',
          dark: '#D4C194'
        },
        terracotta: {
          DEFAULT: '#D4735E',
          light: '#E89080',
          dark: '#B85845'
        },
        jungle: {
          DEFAULT: '#4A7859',
          light: '#5E9370',
          dark: '#3A5F47'
        },
        sunset: {
          DEFAULT: '#E87144',
          light: '#F28D64',
          dark: '#D45A2E'
        },
        teal: {
          DEFAULT: '#479B99',
          light: '#5DB3B1',
          dark: '#357F7D'
        },
        mustard: {
          DEFAULT: '#DAA520',
          light: '#E8BE4B',
          dark: '#B8890D'
        },
        burgundy: {
          DEFAULT: '#8B3A3A',
          light: '#A94E4E',
          dark: '#6B2828'
        },
        cream: {
          DEFAULT: '#FFF8E7',
          light: '#FFFCF5',
          dark: '#F5EDD5'
        },
        vintage: {
          text: '#3A3226',
          accent: '#D4735E'
        }
      },
      fontFamily: {
        poster: ['Bebas Neue', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        ui: ['Pathway Gothic One', 'sans-serif'],
        mono: ['Courier Prime', 'monospace']
      },
      boxShadow: {
        'vintage': '3px 3px 0px rgba(58, 50, 38, 0.3)',
        'vintage-hover': '5px 5px 0px rgba(58, 50, 38, 0.4)',
        'vintage-pressed': '1px 1px 0px rgba(58, 50, 38, 0.3)',
        'rough': '0 0 0 3px currentColor, 3px 3px 0px rgba(58, 50, 38, 0.3)'
      },
      textShadow: {
        'letterpress': '1px 1px 2px rgba(255, 255, 255, 0.5), -1px -1px 2px rgba(0, 0, 0, 0.3)',
        'vintage': '2px 2px 4px rgba(58, 50, 38, 0.5)'
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-letterpress': {
          textShadow: '1px 1px 2px rgba(255, 255, 255, 0.5), -1px -1px 2px rgba(0, 0, 0, 0.3)'
        },
        '.text-vintage': {
          textShadow: '2px 2px 4px rgba(58, 50, 38, 0.5)'
        },
        '.border-rough': {
          border: '3px solid currentColor',
          boxShadow: '0 0 0 1px currentColor inset, 3px 3px 0px rgba(58, 50, 38, 0.3)'
        },
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1'
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2'
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3'
        }
      };
      addUtilities(newUtilities);
    }
  ],
}
