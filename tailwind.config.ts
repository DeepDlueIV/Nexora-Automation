import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const color = (token: string) => `hsl(var(--${token}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      colors: {
        background: color('background'),
        foreground: color('foreground'),
        primary: { DEFAULT: color('primary'), foreground: color('primary-foreground') },
        secondary: { DEFAULT: color('secondary'), foreground: color('secondary-foreground') },
        muted: { DEFAULT: color('muted'), foreground: color('muted-foreground') },
        accent: { DEFAULT: color('accent'), foreground: color('accent-foreground') },
        success: { DEFAULT: color('success'), foreground: color('success-foreground') },
        destructive: { DEFAULT: color('destructive'), foreground: color('destructive-foreground') },
        warning: { DEFAULT: color('warning'), foreground: color('warning-foreground') },
        border: color('border'),
        ring: color('ring'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        dashboard: 'var(--shadow-dashboard)',
        play: 'var(--shadow-play)',
        dialog: 'var(--shadow-dialog)',
      },
    },
  },
  plugins: [animate],
} satisfies Config
