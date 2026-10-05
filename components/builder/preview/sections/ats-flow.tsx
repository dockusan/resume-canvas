"use client";

import { createContext, useContext } from "react";

/**
 * Set by the ATS-safe export. Components that normally push related text to
 * opposite edges of a line (a job title on the left, its dates on the right)
 * keep them together instead, so a parser reading the PDF's text layer sees
 * them as one line rather than two unrelated fragments.
 */
export const AtsFlowContext = createContext(false);

export const useAtsFlow = () => useContext(AtsFlowContext);

/**
 * A separator that is written into the PDF's text but not visible on paper.
 *
 * Flex gaps put no characters between items, so text extraction runs
 * neighbours together ("+880 1755 682652mostofa@…"). Transparent glyphs are
 * kept in the text layer (hidden or clipped ones are dropped), and at 1px they
 * take no visible room.
 */
export function TextSeparator({ text = " | " }: { text?: string }) {
  return (
    <span
      aria-hidden
      style={{ color: "transparent", fontSize: 1, userSelect: "none" }}
    >
      {text}
    </span>
  );
}
