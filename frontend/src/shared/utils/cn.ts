/** Tiny className joiner — avoids pulling in a dependency for this. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
