/**
 * E2E encryption utilities for the messenger using WebCrypto API.
 * Uses X25519 for key agreement and AES-GCM for symmetric encryption.
 */

const DB_NAME = "messenger-keys";
const STORE_NAME = "keys";
const PRIVATE_KEY_ID = "private-key";

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
  });
}

export async function storePrivateKey(key: CryptoKey): Promise<void> {
  const db = await getDB();
  const raw = await crypto.subtle.exportKey("pkcs8", key);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(raw, PRIVATE_KEY_ID);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getPrivateKey(): Promise<CryptoKey | null> {
  const db = await getDB();
  const raw = await new Promise<ArrayBuffer | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(PRIVATE_KEY_ID);
    req.onsuccess = () => {
      db.close();
      resolve(req.result);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
  if (!raw) return null;
  return crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "X25519" },
    true,
    ["deriveBits"]
  );
}

export async function generateKeyPair(): Promise<{
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}> {
  const pair = await crypto.subtle.generateKey(
    { name: "X25519" },
    true,
    ["deriveBits"]
  );
  if (!("publicKey" in pair)) {
    throw new Error("Expected CryptoKeyPair from X25519 generateKey");
  }
  return { publicKey: pair.publicKey, privateKey: pair.privateKey };
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "X25519" },
    false,
    []
  );
}

export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.deriveBits(
    {
      name: "X25519",
      public: publicKey,
    },
    privateKey,
    256
  );
}

const HKDF_INFO = new TextEncoder().encode("messenger-v1");
const SALT = new Uint8Array(32).fill(0);

async function hkdf(sharedSecret: ArrayBuffer): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: SALT,
      info: HKDF_INFO,
    },
    key,
    256
  );
  return crypto.subtle.importKey(
    "raw",
    bits,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(
  plaintext: string,
  sharedSecret: ArrayBuffer,
  nonce?: Uint8Array
): Promise<{ ciphertext: string; nonce: string }> {
  const key = await hkdf(sharedSecret);
  const iv = nonce ?? crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 },
    key,
    encoded
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    nonce: btoa(String.fromCharCode(...iv)),
  };
}

export async function decrypt(
  ciphertextBase64: string,
  nonceBase64: string,
  sharedSecret: ArrayBuffer
): Promise<string> {
  const key = await hkdf(sharedSecret);
  const binary = atob(ciphertextBase64);
  const ciphertext = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) ciphertext[i] = binary.charCodeAt(i);
  const ivBinary = atob(nonceBase64);
  const iv = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) iv[i] = ivBinary.charCodeAt(i);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

/** Generate a random AES key for group encryption */
export async function generateGroupKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/** Export group key as raw bytes (for encrypting with member's public key) */
export async function exportGroupKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", key);
}

/** Import group key from raw bytes */
export async function importGroupKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt group key for a member using ECDH with their public key */
export async function encryptGroupKeyForMember(
  groupKeyRaw: ArrayBuffer,
  memberPublicKey: CryptoKey,
  myPrivateKey: CryptoKey
): Promise<{ encrypted: string; nonce: string }> {
  const sharedSecret = await deriveSharedSecret(myPrivateKey, memberPublicKey);
  const key = await hkdf(sharedSecret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 },
    key,
    groupKeyRaw
  );
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    nonce: btoa(String.fromCharCode(...iv)),
  };
}

/** Decrypt group key using my private key */
export async function decryptGroupKey(
  encryptedBase64: string,
  nonceBase64: string,
  senderPublicKey: CryptoKey,
  myPrivateKey: CryptoKey
): Promise<CryptoKey> {
  const sharedSecret = await deriveSharedSecret(myPrivateKey, senderPublicKey);
  const key = await hkdf(sharedSecret);
  const binary = atob(encryptedBase64);
  const ciphertext = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) ciphertext[i] = binary.charCodeAt(i);
  const ivBinary = atob(nonceBase64);
  const iv = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) iv[i] = ivBinary.charCodeAt(i);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext
  );
  return importGroupKey(decrypted);
}

/** Encrypt message with symmetric group key (AES-GCM) */
export async function encryptWithGroupKey(
  plaintext: string,
  groupKey: CryptoKey,
  nonce?: Uint8Array
): Promise<{ ciphertext: string; nonce: string }> {
  const iv = nonce ?? crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 },
    groupKey,
    encoded
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    nonce: btoa(String.fromCharCode(...iv)),
  };
}

/** Decrypt message with symmetric group key */
export async function decryptWithGroupKey(
  ciphertextBase64: string,
  nonceBase64: string,
  groupKey: CryptoKey
): Promise<string> {
  const binary = atob(ciphertextBase64);
  const ciphertext = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) ciphertext[i] = binary.charCodeAt(i);
  const ivBinary = atob(nonceBase64);
  const iv = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) iv[i] = ivBinary.charCodeAt(i);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    groupKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
