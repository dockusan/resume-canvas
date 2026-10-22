/**
 * Keeping AI suggestions to the evidence.
 *
 * A suggested rewrite may reword a point, or surface something the point
 * already shows in the words a posting uses. It must not make anything up,
 * and the most damaging thing to make up on a resume is a figure. So a
 * rewrite that contains a number the original point didn't is refused —
 * on the server, and again in the browser before it is ever offered.
 */

const NUMBER = /\d+(?:[.,]\d+)*/g;

/** Numbers in `revised` that `original` doesn't contain. */
export function newNumbers(original: string, revised: string): string[] {
  const known = new Set(
    (original.match(NUMBER) ?? []).map((n) => n.replace(/,/g, "")),
  );
  return (revised.match(NUMBER) ?? [])
    .map((n) => n.replace(/,/g, ""))
    .filter((n) => !known.has(n));
}

export const keepsToEvidence = (original: string, revised: string) =>
  newNumbers(original, revised).length === 0;
