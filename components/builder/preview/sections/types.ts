import { SectionNode, Theme } from "@/lib/schema/document";

export interface SectionRenderProps {
  /** The schema node: placement, style, item flow and field specs. */
  node: SectionNode;
  theme: Theme;
  /** The section sits on a dark column fill, so text must invert. */
  onFill: boolean;
  /**
   * Half-open range of items to render. Set by the paginator when a section
   * continues across a page boundary; omitted means "all items".
   */
  itemRange?: [number, number];
  /** True when this is a continuation slot, so the heading reads "(cont.)". */
  continued?: boolean;
}

/**
 * Slice a section's items to the paginator's range while preserving each
 * item's true index, so reorder/delete keep addressing the right item.
 */
export function inRange<T>(
  list: T[],
  range?: [number, number],
): Array<[T, number]> {
  const [from, to] = range ?? [0, list.length];
  return list.slice(from, to).map((item, i) => [item, from + i] as [T, number]);
}
