import { arrayBufferToBase64, base64ToArrayBuffer } from "./base64";

export async function getCrypto() {
  const crypto =
    typeof window !== "undefined"
      ? window.crypto
      : // : typeof WorkerGlobalScope !== "undefined"
        // ? WorkerGlobalScope.crypto
        await import("crypto");

  return crypto as {
    subtle: SubtleCrypto;
    getRandomValues: (array: Uint8Array) => Uint8Array;
  };
}

export async function generateKeyPair() {
  const crypto = await getCrypto();

  const keypair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 0, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  return keypair;
}

export async function exportPublicKey(key: CryptoKey) {
  const crypto = await getCrypto();

  const exported = await crypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

export async function importPublicKey(keyString: string) {
  const crypto = await getCrypto();
  const binaryDer = base64ToArrayBuffer(keyString);

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt", "wrapKey"]
  );
}

export async function exportPrivateKey(key: CryptoKey, wrapKey: CryptoKey) {
  const crypto = await getCrypto();

  const exported = await crypto.subtle.wrapKey("pkcs8", key, wrapKey, {
    name: "RSA-OAEP",
    iv: crypto.getRandomValues(new Uint8Array(12)),
  });

  return arrayBufferToBase64(exported);
}

export async function importPrivateKey(keyString: string) {
  const crypto = await getCrypto();
  const binaryDer = base64ToArrayBuffer(keyString);

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt", "unwrapKey"]
  );
}
