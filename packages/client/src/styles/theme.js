// Adventureland Chief of Staff - Design System

export const colors = {
  // Primary Colors (Warm Earth Tones)
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

  // Secondary Colors (Vintage Accents)
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

  // Text Colors
  vintage: {
    text: '#3A3226',
    accent: '#D4735E'
  }
};

export const typography = {
  fonts: {
    poster: 'Bebas Neue, sans-serif',
    serif: 'Merriweather, serif',
    ui: 'Pathway Gothic One, sans-serif',
    mono: 'Courier Prime, monospace'
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem'    // 72px
  }
};

export const shadows = {
  vintage: '3px 3px 0px rgba(58, 50, 38, 0.3)',
  vintageHover: '5px 5px 0px rgba(58, 50, 38, 0.4)',
  vintagePressed: '1px 1px 0px rgba(58, 50, 38, 0.3)',
  rough: '0 0 0 3px currentColor, 3px 3px 0px rgba(58, 50, 38, 0.3)',
  letterpress: '1px 1px 2px rgba(255, 255, 255, 0.5), -1px -1px 2px rgba(0, 0, 0, 0.3)'
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem'    // 64px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',  // 2px
  md: '0.25rem',   // 4px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  full: '9999px'
};

// Agent color assignments
export const agentColors = {
  explorer: colors.jungle,
  trader: colors.mustard,
  navigator: colors.teal,
  archaeologist: colors.sand,
  scout: colors.sunset,
  guide: colors.burgundy
};
