/**
 * Brand Theme Colors
 * Single source of truth for all color tokens
 */

// 1. Define Base Colors
const baseColors = {
  ink: '#0f172a',
  brand: '#6366f1',
  paper: '#ffffff',
  blue: '#2F66F6', // Your new Buy Button Blue
  green: '#22c55e',
  coral: '#f87171',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  lavender: '#E6E6FA',

  // Dark Mode Bases
  darkBg: '#000000',
  darkSurface: '#121212',
  darkText: '#FFFFFF',
  darkTextSec: '#A0A0A0',
};

// 2. Export 'Colors' (Capitalized) to match your app components
export const colors = {
  // Keep lowercase aliases for backward compatibility if needed
  ...baseColors,

  // Brand
  primary: baseColors.blue,
  brand: baseColors.brand,

  // Backgrounds
  background: baseColors.darkBg,
  surface: baseColors.darkSurface,
  paper: '#1A1A1A',

  // Text
  textPrimary: baseColors.darkText,
  textSecondary: '#CBD5E1', // Slate 300 (Much brighter than Slate 400)
  textMuted: '#94A3B8', // Slate 400 (Readable, used for less important info)

  // UI
  border: '#2A2A2A',
  error: baseColors.coral,
  success: baseColors.green,
};

// 3. Export Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// 4. Export Typography (This was missing!)
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
};

// 5. Semantic Exports (Optional, keeps existing code working)
export const semantic = {
  textDefault: baseColors.ink,
  bgPage: baseColors.paper,
  link: baseColors.brand,
};

export const Colors = {
  background: '#04070D', // Deep space black
  surface: 'rgba(255, 255, 255, 0.05)', // The "Glass" base
  glassBorder: 'rgba(255, 255, 255, 0.12)', // Thin, elegant border
  primary: '#2F66F6', // Brand Blue
  accent: '#00E5FF', // Electric Cyan
  textPrimary: '#FFFFFF',
  textSecondary: '#CBD5E1', // Slate 300
  error: '#FF4B4B',
  success: '#00C853'
};

export const Gradients = {
  main: ['#04070D', '#0F172A'], // Background depth
  primaryGlow: ['#2F66F6', '#00E5FF'], // For buttons/active states
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.03)'],
  background: ['#04070D', '#0F172A'],
};

export const GlassStyle = {
  borderWidth: 1,
  borderColor: Colors.glassBorder,
  borderRadius: 24,
  backgroundColor: 'rgba(15, 23, 42, 0.6)', // Tinted glass
};
