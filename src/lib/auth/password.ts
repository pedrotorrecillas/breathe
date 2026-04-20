import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;
const PASSWORD_HASH_PREFIX = "scrypt";

function toBase64Url(buffer: Uint8Array) {
  return Buffer.from(buffer).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(
    password,
    salt,
    SCRYPT_KEY_LENGTH,
  )) as Buffer;

  return [
    PASSWORD_HASH_PREFIX,
    toBase64Url(salt),
    toBase64Url(derivedKey),
  ].join(":");
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [prefix, encodedSalt, encodedHash] = passwordHash.split(":");

  if (
    prefix !== PASSWORD_HASH_PREFIX ||
    typeof encodedSalt !== "string" ||
    typeof encodedHash !== "string"
  ) {
    return false;
  }

  const salt = fromBase64Url(encodedSalt);
  const expectedHash = fromBase64Url(encodedHash);
  const derivedKey = (await scrypt(
    password,
    salt,
    expectedHash.length,
  )) as Buffer;

  if (derivedKey.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedHash);
}
