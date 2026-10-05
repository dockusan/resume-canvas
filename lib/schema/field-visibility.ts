import { SECTION_FIELDS } from "./defaults";
import { SectionNode } from "./document";

/**
 * Shared with the renderers so the ATS export hides exactly what the page
 * hides — a field turned off in the inspector must not reappear in the
 * machine-readable copy.
 *
 * A field the document has never stored takes its default: visible, unless
 * the field is an opt-in extra (an education icon) that older documents
 * predate and must not suddenly sprout.
 */
export function isFieldVisible(node: SectionNode, key: string): boolean {
  const spec = node.fields?.[key];
  if (spec) return spec.visible !== false;
  const def = SECTION_FIELDS[node.type]?.find((f) => f.key === key);
  return !def?.hidden;
}
