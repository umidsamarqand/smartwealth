// Native Web Crypto API local encryption utilities for personal finance data privacy.

function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"]
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 10000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a text string using AES-256-GCM derived from a password
 */
export async function encryptData(text: string, password: string): Promise<string> {
  if (typeof window === 'undefined') return '';
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt.buffer);
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );
  
  return [
    bufToHex(salt.buffer),
    bufToHex(iv.buffer),
    bufToHex(ciphertext)
  ].join(':');
}

/**
 * Decrypts an encrypted package string back to original plain text
 */
export async function decryptData(encryptedPackage: string, password: string): Promise<string> {
  if (typeof window === 'undefined') return '';
  try {
    const parts = encryptedPackage.split(':');
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted package format");
    }
    
    const salt = hexToBuf(parts[0]);
    const iv = hexToBuf(parts[1]);
    const ciphertext = hexToBuf(parts[2]);
    
    const key = await deriveKey(password, salt);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      ciphertext
    );
    
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    throw new Error("Decryption failed. Please check your password or biometric credentials.");
  }
}

/**
 * Hashes a string using SHA-256 (for verify-only values like password matches)
 */
export async function hashString(text: string): Promise<string> {
  if (typeof window === 'undefined') return '';
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufToHex(hashBuffer);
}
