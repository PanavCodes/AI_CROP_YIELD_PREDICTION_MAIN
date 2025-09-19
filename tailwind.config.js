/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Enhanced agricultural color palette
        'earth-brown': '#8B4513',
        'leaf-green': '#228B22',
        'sky-blue': '#87CEEB',
        'wheat-gold': '#F5DEB3',
        'soil-dark': '#654321',
        'alert-red': '#DC143C',
        'alert-yellow': '#FFD700',
        
        // Professional AI-focused colors
        'ai-purple': '#613AF5',
        'ai-purple-light': '#9161FF',
        'success-green': '#3C9718',
        'info-blue': '#00AAFF',
        'warning-orange': '#B77224',
        'danger-red': '#B7131A',
        
        // Design system colors
        border: "hsl(var(--border, 214 32% 91%))",
        input: "hsl(var(--input, 214 32% 91%))",
        ring: "hsl(var(--ring, 142 76% 36%))",
        background: "hsl(var(--background, 0 0% 98%))",
        foreground: "hsl(var(--foreground, 222 84% 5%))",
        primary: {
          DEFAULT: "#613AF5",
          foreground: "hsl(var(--primary-foreground, 210 40% 98%))",
        },
        secondary: {
          DEFAULT: "#3C9718",
          foreground: "hsl(var(--secondary-foreground, 210 40% 98%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84% 60%))",
          foreground: "hsl(var(--destructive-foreground, 210 40% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 210 40% 96%))",
          foreground: "hsl(var(--muted-foreground, 215 16% 47%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 210 40% 96%))",
          foreground: "hsl(var(--accent-foreground, 222 84% 5%))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover, 0 0% 100%))",
          foreground: "hsl(var(--popover-foreground, 222 84% 5%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 222 84% 5%))",
        },
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.12)',
        'modal': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(97, 58, 245, 0.3)',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(97, 58, 245, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(97, 58, 245, 0.5)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
}
