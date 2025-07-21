import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Generate a key from the ENC_SECRET
function getKey(secret: string): Buffer {
  return crypto.scryptSync(secret, "salt", KEY_LENGTH);
}

export function encrypt(text: string): string {
  const secret = process.env.ENC_SECRET;
  if (!secret) {
    throw new Error("ENC_SECRET environment variable is not set");
  }

  const key = getKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data as hex string
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  const secret = process.env.ENC_SECRET;
  if (!secret) {
    throw new Error("ENC_SECRET environment variable is not set");
  }

  const textParts = encryptedText.split(":");
  if (textParts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }

  const key = getKey(secret);
  const iv = Buffer.from(textParts[0]!, "hex");
  const encrypted = textParts[1]!;

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
