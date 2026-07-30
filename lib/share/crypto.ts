/**
 * Client-side encryption for share links.
 *
 * The key is generated in the browser, never sent anywhere, and lives only in
 * the URL fragment — which browsers do not transmit. The server therefore
 * holds a blob it cannot read, which is the whole point: the privacy claim
 * survives the feature.
 */

const ALGORITHM = "AES-GCM";
const IV_BYTES = 12;

export interface EncryptedShare {
  /** base64 */
  ciphertext: string;
  /** base64 */
  iv: string;
  /** base64url — belongs in the fragment and nowhere else. */
  key: string;
}

function toBase64(bytes: Bytes): string {
  let binary = "";
  // Chunked: spreading a multi-megabyte array into apply() overflows the
  // call stack, which is exactly the size a photo produces.
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(value: string): Bytes {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const toBase64Url = (bytes: Bytes) =>
  toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) =>
  fromBase64(value.replace(/-/g, "+").replace(/_/g, "/"));

/** Concrete ArrayBuffer backing: SharedArrayBuffer is never valid here. */
type Bytes = Uint8Array<ArrayBuffer>;

async function gzip(bytes: Bytes): Promise<Bytes> {
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Bytes): Promise<Bytes> {
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Compress, then encrypt. Order matters — ciphertext does not compress. */
export async function encryptPayload(
  payload: unknown,
): Promise<EncryptedShare> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const compressed = await gzip(json);

  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, compressed),
  );
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    key: toBase64Url(raw),
  };
}

/** Thrown when the key is wrong, truncated, or the blob was tampered with. */
export class ShareDecryptError extends Error {
  constructor() {
    super("Could not decrypt this resume");
    this.name = "ShareDecryptError";
  }
}

export async function decryptPayload(
  ciphertext: string,
  iv: string,
  keyMaterial: string,
): Promise<unknown> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      fromBase64Url(keyMaterial),
      { name: ALGORITHM },
      false,
      ["decrypt"],
    );
    const compressed = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: fromBase64(iv) },
        key,
        fromBase64(ciphertext),
      ),
    );
    const json = new TextDecoder().decode(await gunzip(compressed));
    return JSON.parse(json);
  } catch {
    // AES-GCM authenticates, so a wrong key fails here rather than producing
    // plausible garbage. Everything downstream can trust what it decrypted.
    throw new ShareDecryptError();
  }
}
