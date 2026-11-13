/**
 * Utility for conditionally joining class names.
 * Lightweight clsx alternative.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}

