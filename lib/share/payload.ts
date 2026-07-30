import { ResumeDocument } from "@/lib/schema/document";
import { ResumeData, ResumeSettings } from "@/lib/types";

/**
 * Bumped whenever the shape below stops being readable by the current
 * renderer. A viewer that meets an unknown version says so plainly rather
 * than rendering a half-understood document.
 */
export const SHARE_VERSION = 1;

export interface SharePayload {
  version: number;
  resumeData: ResumeData;
  settings: ResumeSettings;
  document: ResumeDocument;
}

/**
 * What travels in a share link.
 *
 * These are exactly the three slices the editor persists, so a shared resume
 * renders from the same inputs as the original — the alternative, shipping a
 * hand-picked subset, is a standing invitation for the viewer to drift out of
 * step with the builder.
 */
export function buildPayload(
  state: Pick<SharePayload, "resumeData" | "settings" | "document">,
): SharePayload {
  return {
    version: SHARE_VERSION,
    resumeData: state.resumeData,
    settings: state.settings,
    document: state.document,
  };
}

export class ShareVersionError extends Error {
  constructor(readonly found: unknown) {
    super(`Unsupported share version: ${String(found)}`);
    this.name = "ShareVersionError";
  }
}

export function parsePayload(value: unknown): SharePayload {
  const payload = value as Partial<SharePayload> | null;
  if (!payload || typeof payload !== "object") {
    throw new ShareVersionError(undefined);
  }
  if (payload.version !== SHARE_VERSION) {
    throw new ShareVersionError(payload.version);
  }
  if (!payload.resumeData || !payload.settings || !payload.document) {
    throw new ShareVersionError(payload.version);
  }
  return payload as SharePayload;
}
