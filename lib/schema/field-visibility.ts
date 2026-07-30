import { SectionNode } from "./document";

/**
 * Shared with the renderers so the ATS export hides exactly what the page
 * hides — a field turned off in the inspector must not reappear in the
 * machine-readable copy.
 */
export function isFieldVisible(node: SectionNode, key: string): boolean {
  return node.fields?.[key]?.visible !== false;
}
