/**
 * Bitwarden-Grade Cryptographic Engine
 * - Zero-knowledge end-to-end client encryption
 * - PBKDF2-SHA256 (600,000 iterations default per Bitwarden/OWASP 2023+ standard)
 * - AES-GCM 256-bit authenticated encryption with unique 96-bit IV per item
 * - k-Anonymity SHA-1 Pwned Passwords breach verification (never leaks password)
 * - RFC 6238 Time-based One-Time Password (TOTP) engine
 */

export interface KdfConfig {
  algorithm: 'PBKDF2';
  iterations: number;
  saltHex: string;
}

export const DEFAULT_KDF_CONFIG: KdfConfig = {
  algorithm: 'PBKDF2',
  iterations: 600000, // Bitwarden standard default
  saltHex: '',
};

/** Convert ArrayBuffer to Hex string */
export function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Convert Hex string to Uint8Array */
export function hexToBuf(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Generate secure random salt */
export function generateSalt(length = 32): string {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bufToHex(bytes);
}

/**
 * Derive 256-bit AES-GCM Encryption Key from Master Password and Salt
 * Uses native WebCrypto PBKDF2-SHA-256 with 600,000 iterations.
 */
export async function deriveMasterKey(
  masterPassword: string,
  saltHex: string,
  iterations = 600000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(masterPassword);
  const saltBytes = hexToBuf(saltHex);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as ArrayBufferView<ArrayBuffer>,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt arbitrary payload using AES-256-GCM with fresh 12-byte IV.
 */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  );

  return {
    ciphertext: bufToHex(encrypted),
    iv: bufToHex(iv),
  };
}

/**
 * Decrypt payload using AES-256-GCM.
 */
export async function decryptData(
  ciphertextHex: string,
  ivHex: string,
  key: CryptoKey
): Promise<string> {
  const ciphertext = hexToBuf(ciphertextHex);
  const iv = hexToBuf(ivHex);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as ArrayBufferView<ArrayBuffer>,
    },
    key,
    ciphertext as ArrayBufferView<ArrayBuffer>
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * SHA-1 Hash generator for Have I Been Pwned (k-Anonymity).
 */
export async function hashSha1(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
  return bufToHex(hashBuffer).toUpperCase();
}

/**
 * Check password breach status via Have I Been Pwned using k-Anonymity model.
 * ONLY sends the first 5 characters of the SHA-1 hash.
 * The full password or full hash is NEVER sent over the network.
 */
export async function checkPwnedPassword(password: string): Promise<{
  isPwned: boolean;
  breachCount: number;
}> {
  if (!password || password.length === 0) {
    return { isPwned: false, breachCount: 0 };
  }

  try {
    const sha1 = await hashSha1(password);
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true', // Prevents traffic analysis
      },
    });

    if (!response.ok) {
      throw new Error(`HIBP API returned status ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(':');
      if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
        const count = parseInt(countStr, 10) || 1;
        return { isPwned: true, breachCount: count };
      }
    }

    return { isPwned: false, breachCount: 0 };
  } catch (err) {
    console.warn('k-Anonymity breach check failed (network or offline):', err);
    return { isPwned: false, breachCount: 0 };
  }
}

/**
 * Base32 Decoder for RFC 6238 TOTP Seeds (Bitwarden Authenticator integration)
 */
function base32ToBuf(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Generate 6-digit Time-based One-Time Password (TOTP) conforming to RFC 6238.
 */
export async function generateTotp(
  secretBase32: string,
  timeStepSeconds = 30,
  digits = 6
): Promise<{ code: string; secondsRemaining: number }> {
  try {
    const keyBytes = base32ToBuf(secretBase32);
    if (keyBytes.length === 0) {
      return { code: '------', secondsRemaining: 0 };
    }

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / timeStepSeconds);
    const secondsRemaining = timeStepSeconds - (epoch % timeStepSeconds);

    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter));

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes as ArrayBufferView<ArrayBuffer>,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const sigBytes = new Uint8Array(signature);

    // Dynamic truncation
    const offset = sigBytes[sigBytes.length - 1] & 0xf;
    const binary =
      ((sigBytes[offset] & 0x7f) << 24) |
      ((sigBytes[offset + 1] & 0xff) << 16) |
      ((sigBytes[offset + 2] & 0xff) << 8) |
      (sigBytes[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    const code = otp.toString().padStart(digits, '0');

    return { code, secondsRemaining };
  } catch (err) {
    return { code: 'ERR', secondsRemaining: 0 };
  }
}
