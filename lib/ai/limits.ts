/**
 * Limits shared by the AI routes and the dialogs that call them, so the UI
 * can never offer something the server will reject.
 */

/** A resume PDF is tens of kilobytes; a designed one with images, a few MB. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Ceiling on the text sent to the model. Ten dense pages run to roughly
 * 40,000 characters; anything longer is not a resume.
 */
export const MAX_SOURCE_CHARS = 40_000;

/** Quick add takes a few lines in the user's own words. */
export const MAX_OVERVIEW_CHARS = 4_000;

/** AI requests per address per hour, across import and quick add. */
export const AI_LIMIT = 30;
export const AI_WINDOW_SECONDS = 60 * 60;

export const ACCEPTED_UPLOADS = ".pdf,.txt,.md,application/pdf,text/plain";
