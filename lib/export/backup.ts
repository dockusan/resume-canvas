/**
 * Resume backup files.
 *
 * The resume lives in this browser's localStorage, so moving it to another
 * browser or device means carrying it by hand. A backup is that persisted
 * state as a JSON file; importing one writes it back and reloads, so the
 * store's own migrations upgrade files saved by older versions.
 */

import {
  PERSIST_VERSION,
  STORAGE_KEY,
  resumeStore,
} from "@/lib/store/useResumeStore";

interface BackupFile {
  app: "resume-canvas";
  version: number;
  exportedAt: string;
  state: {
    resumeData: unknown;
    settings: unknown;
    document: unknown;
  };
}

export function downloadBackup(): void {
  const { resumeData, settings, document: doc } = resumeStore().getState();
  const file: BackupFile = {
    app: "resume-canvas",
    version: PERSIST_VERSION,
    exportedAt: new Date().toISOString(),
    state: { resumeData, settings, document: doc },
  };
  const name =
    resumeData.personalInfo.fullName.trim().replace(/\s+/g, "_") || "resume";
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.resume.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Accepts a backup from `downloadBackup`, or the raw `resume-storage` value
 * copied out of localStorage. Throws a readable error for anything else.
 */
export async function importBackup(file: File): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const candidate = parsed as Partial<BackupFile> & {
    resumeData?: unknown;
  };
  const state = (candidate.state ?? candidate) as BackupFile["state"];
  const info = (state?.resumeData as { personalInfo?: unknown } | undefined)
    ?.personalInfo;
  if (!info || typeof info !== "object") {
    throw new Error("That file doesn't look like a Resume Canvas backup.");
  }
  const version = typeof candidate.version === "number" ? candidate.version : 2;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version }));
  window.location.reload();
}
