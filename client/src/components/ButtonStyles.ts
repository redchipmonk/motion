import { cn } from '../theme';

/**
 * Reusable button class-name presets for consistent styling across the app.
 * Import and spread with cn() to apply, then override as needed.
 */
export const buttonStyles = {
  /** Purple filled button — used for primary CTA (RSVP, Connect, Follow) */
  primary: cn(
    'rounded-2xl py-2 text-center text-2xl font-bold text-white transition-colors border-2 border-transparent',
    'bg-motion-purple',
    'hover:border-motion-orange',
    'active:bg-motion-orange active:border-motion-orange',
  ),

  /** Yellow square icon button — used for bookmark / secondary actions */
  iconSecondary: cn(
    'rounded-xl p-3 transition-colors border-2 border-transparent',
    'bg-motion-yellow',
    'hover:border-motion-orange',
    'active:bg-motion-orange active:border-motion-orange',
  ),

  /** Profile-style action button — slightly larger, pill shape */
  profileAction: cn(
    'font-bold text-xl py-3 px-12 rounded-2xl border-2 border-transparent transition-all',
    'bg-motion-yellow text-motion-purple',
    'hover:border-motion-purple',
    'active:bg-motion-orange active:text-white active:border-transparent',
  ),

  /** Outline/waitlist variant */
  outline: cn(
    'rounded-2xl py-2 text-center text-2xl font-bold transition-colors border-2',
    'bg-white text-motion-purple border-motion-purple',
    'hover:border-motion-orange hover:text-motion-orange',
    'active:bg-motion-orange active:text-white active:border-motion-orange',
  ),
} as const;
