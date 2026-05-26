import { hash, verify } from "@node-rs/argon2";

// argon2id with strong parameters (OWASP recommendation).
const OPTIONS = {
  memoryCost: 19456, // ~19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, OPTIONS);
}

export async function verifyPassword(
  plaintext: string,
  hashed: string,
): Promise<boolean> {
  try {
    return await verify(hashed, plaintext);
  } catch {
    return false;
  }
}
