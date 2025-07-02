import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Colors
        background: {
          DEFAULT: "var(--background)",
          secondary: "var(--background-secondary)",
          tertiary: "var(--background-tertiary)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          secondary: "var(--foreground-secondary)",
          muted: "var(--foreground-muted)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
        },
        border: {
          DEFAULT: "var(--border)",
          secondary: "var(--border-secondary)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
          light: "var(--secondary-light)",
          dark: "var(--secondary-dark)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        // Glass Effects
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-background': 'var(--gradient-background)',
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glass: "var(--glass-shadow)",
        'glow-primary': "var(--glow-primary)",
        'glow-secondary': "var(--glow-secondary)",
      },
      animation: {
        'subtle-float': 'subtle-float 6s ease-in-out infinite',
        'mesh-movement': 'mesh-movement 25s linear infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
      },
      keyframes: {
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-10px) rotate(0.5deg)' },
          '50%': { transform: 'translateY(-5px) rotate(0deg)' },
          '75%': { transform: 'translateY(-15px) rotate(-0.5deg)' },
        },
        'mesh-movement': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(-1%, -1%) rotate(0.5deg)' },
          '50%': { transform: 'translate(1%, 1%) rotate(1deg)' },
          '75%': { transform: 'translate(-0.5%, 0.5%) rotate(0.5deg)' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }: { addUtilities: Function }) {
      const newUtilities = {
        '.glass-morphism': {
          'background': 'var(--glass-bg)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'border': '1px solid var(--glass-border)',
          'box-shadow': 'var(--glass-shadow)',
        },
        '.text-gradient': {
          'background': 'var(--gradient-primary)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.hover-lift': {
          'transition': 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            'transform': 'translateY(-2px)',
          },
        },
        '.focus-ring-primary': {
          '&:focus': {
            'outline': 'none',
            'box-shadow': '0 0 0 3px rgba(var(--primary), 0.3)',
            'border-color': 'var(--primary)',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;
