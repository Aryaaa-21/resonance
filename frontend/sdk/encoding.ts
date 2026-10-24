import { PublicKey } from "@solana/web3.js";

export type Bytes32Input = Uint8Array | string;

export function u16ToLe(value: number): Buffer {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) throw new Error("Expected an unsigned 16-bit integer");
  const result = Buffer.alloc(2);
  result.writeUInt16LE(value, 0);
  return result;
}

export function u32ToLe(value: number): Buffer {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) throw new Error("Expected an unsigned 32-bit integer");
  const result = Buffer.alloc(4);
  result.writeUInt32LE(value, 0);
  return result;
}

export function u64ToLe(value: bigint | number | string): Buffer {
  let normalized: bigint;
  try {
    normalized = typeof value === "bigint" ? value : BigInt(value);
  } catch {
    throw new Error("Expected an unsigned 64-bit integer");
  }
  if (normalized < BigInt(0) || normalized > BigInt("18446744073709551615")) throw new Error("Expected an unsigned 64-bit integer");
  const result = Buffer.alloc(8);
  result.writeBigUInt64LE(normalized, 0);
  return result;
}

export function i64ToLe(value: bigint | number | string): Buffer {
  let normalized: bigint;
  try {
    normalized = typeof value === "bigint" ? value : BigInt(value);
  } catch {
    throw new Error("Expected a signed 64-bit integer");
  }
  if (normalized < BigInt("-9223372036854775808") || normalized > BigInt("9223372036854775807")) throw new Error("Expected a signed 64-bit integer");
  const result = Buffer.alloc(8);
  result.writeBigInt64LE(normalized, 0);
  return result;
}

export function publicKey(value: PublicKey | string): PublicKey {
  return value instanceof PublicKey ? value : new PublicKey(value);
}

function decodeHex(value: string): Uint8Array | null {
  const normalized = value.replace(/^0x/i, "").replace(/^sha256:/i, "");
  if (!/^[0-9a-f]+$/i.test(normalized) || normalized.length % 2 !== 0) return null;
  return Uint8Array.from(Buffer.from(normalized, "hex"));
}

export function bytes32(value: Bytes32Input, label = "value"): Buffer {
  const bytes = typeof value === "string" ? decodeHex(value) : value;
  if (!bytes || bytes.length !== 32) throw new Error(`${label} must encode exactly 32 bytes`);
  return Buffer.from(bytes);
}

export function nonZeroBytes32(value: Bytes32Input, label = "value"): Buffer {
  const bytes = bytes32(value, label);
  if (bytes.every((byte) => byte === 0)) throw new Error(`${label} must not be all zero`);
  return bytes;
}

export function commitmentToBytes(value: Bytes32Input): Buffer {
  return nonZeroBytes32(value, "commitment");
}

export async function commitmentFromText(value: string): Promise<Buffer> {
  const text = value.trim();
  if (!text) throw new Error("commitment text must not be empty");
  const encoded = new TextEncoder().encode(text);
  const bytes = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Buffer.from(new Uint8Array(digest));
}
