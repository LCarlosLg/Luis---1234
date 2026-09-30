const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;
const encoder = new TextEncoder();

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function derive(password: string, salt: BufferSource, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS
  );
  return new Uint8Array(bits);
}

/** Formato: pbkdf2$sha256$iteraciones$sal(base64)$hash(base64) */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return ["pbkdf2", "sha256", ITERATIONS, toBase64(salt), toBase64(hash)].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, , iterations, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterations || !saltB64 || !hashB64) return false;

  const expected = fromBase64(hashB64);
  const actual = await derive(password, fromBase64(saltB64), Number(iterations));
  if (actual.length !== expected.length) return false;

  // Comparación en tiempo constante
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
