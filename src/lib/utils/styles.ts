/**
 * Utility for concatenating CSS classes, filtering out falsy values.
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
