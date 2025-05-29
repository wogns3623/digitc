import type { webcrypto } from "crypto";

export const generateIV = () => {
  return crypto.getRandomValues(new Uint8Array(12));
};

/**
 * symmetric key wrapper for AES-GCM
 */
export class SymmetricKey {
  private static usages: webcrypto.KeyUsage[] = [
    "encrypt",
    "decrypt",
    "wrapKey",
    "unwrapKey",
  ];

  readonly key: CryptoKey;
  constructor(key: CryptoKey) {
    this.key = key;
  }

  async encrypt(data: BufferSource, iv: BufferSource) {
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.key,
      data,
    );

    return new Uint8Array(encrypted);
  }
  async decrypt(encrypted: BufferSource, iv: BufferSource) {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      this.key,
      encrypted,
    );

    return new Uint8Array(decrypted);
  }

  /** @deprecated not used yet */
  async wrapKey(key: CryptoKey, iv: BufferSource) {
    const wrapped = await crypto.subtle.wrapKey("raw", key, this.key, {
      name: "AES-GCM",
      iv,
    });

    return new Uint8Array(wrapped);
  }

  /** @deprecated not used yet */
  static async unwrapKey(
    unwrappingKey: SymmetricKey,
    wrappedKey: BufferSource,
    iv: BufferSource,
  ) {
    const unwrapped = await crypto.subtle.unwrapKey(
      "raw",
      wrappedKey,
      unwrappingKey.key,
      { name: "AES-GCM", iv },
      { name: "AES-GCM", length: 256 },
      true,
      this.usages,
    );

    return new SymmetricKey(unwrapped);
  }

  async export() {
    const exported = await crypto.subtle.exportKey("raw", this.key);
    return new Uint8Array(exported);
  }

  static async import(rawKey: BufferSource) {
    const key = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      true,
      this.usages,
    );
    return new SymmetricKey(key);
  }

  static async generate() {
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      this.usages,
    );
    return new SymmetricKey(key);
  }

  static async fromPassword(
    password: string,
    salt: BufferSource,
    iterations = 600_000,
  ) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      this.usages,
    );

    return new SymmetricKey(key);
  }

  static async derive({ publicKey, privateKey }: CryptoKeyPair) {
    const derivedKey = await crypto.subtle.deriveKey(
      { name: "ECDH", public: publicKey },
      privateKey,
      { name: "AES-GCM", length: 256 },
      true,
      this.usages,
    );

    return new SymmetricKey(derivedKey);
  }
}

type EccKeyPair = "privateKey" | "publicKey";
export class EccKey<T extends EccKeyPair = EccKeyPair> {
  // exported private and public keys in Uint8Array format
  private keypair: Pick<{ privateKey: Uint8Array; publicKey: Uint8Array }, T>;

  constructor(
    keypair: Pick<{ privateKey: Uint8Array; publicKey: Uint8Array }, T>,
  ) {
    this.keypair = keypair;
  }

  get export(): Readonly<
    Pick<
      { privateKey: Readonly<Uint8Array>; publicKey: Readonly<Uint8Array> },
      T
    >
  > {
    return this.keypair;
  }

  async sign(this: EccKey<"privateKey">, data: BufferSource) {
    const privateKey = await EccKey.importPrivateKey(
      this.keypair.privateKey,
      "ECDSA",
    );
    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-384" } },
      privateKey,
      data,
    );
    return new Uint8Array(signature);
  }

  async verify(
    this: EccKey<"publicKey">,
    data: BufferSource,
    signature: BufferSource,
  ) {
    const publicKey = await EccKey.importPublicKey(
      this.keypair.publicKey,
      "ECDSA",
    );
    const isValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-384" } },
      publicKey,
      signature,
      data,
    );
    return isValid;
  }

  async deriveKey(
    this: EccKey<"privateKey">,
    other: EccKey<"publicKey">,
  ): Promise<SymmetricKey>;
  async deriveKey(
    this: EccKey<"publicKey">,
    other: EccKey<"privateKey">,
  ): Promise<SymmetricKey>;
  async deriveKey(this: EccKey, other: EccKey): Promise<SymmetricKey> {
    let publicKey: CryptoKey, privateKey: CryptoKey;

    if (this.keypair.privateKey && other.keypair.publicKey) {
      [publicKey, privateKey] = await Promise.all([
        EccKey.importPublicKey(other.keypair.publicKey, "ECDH"),
        EccKey.importPrivateKey(this.keypair.privateKey, "ECDH"),
      ]);
    } else if (this.keypair.publicKey && other.keypair.privateKey) {
      [publicKey, privateKey] = await Promise.all([
        EccKey.importPrivateKey(this.keypair.publicKey, "ECDH"),
        EccKey.importPublicKey(other.keypair.privateKey, "ECDH"),
      ]);
    } else {
      throw new Error("Both keys must be provided for ECDH key derivation.");
    }

    return SymmetricKey.derive({ publicKey, privateKey });
  }

  static async generate() {
    const keypair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-384" },
      false,
      ["deriveKey"],
    );

    const exported = await this.exportKeypair(keypair);

    return new EccKey(exported);
  }

  private static async exportKeypair(keypair: CryptoKeyPair) {
    const [privateKey, publicKey] = await Promise.all([
      crypto.subtle.exportKey("pkcs8", keypair.privateKey),
      crypto.subtle.exportKey("spki", keypair.publicKey),
    ]);

    return {
      privateKey: new Uint8Array(privateKey),
      publicKey: new Uint8Array(publicKey),
    };
  }

  addPublicKey<T extends Exclude<EccKeyPair, "publicKey">>(
    this: EccKey<T>,
    publicKey: Uint8Array,
  ): EccKey<T | "publicKey"> {
    const self = this as EccKey<T | "publicKey">;
    self.keypair.publicKey = publicKey;

    return self;
  }

  addPrivateKey<T extends Exclude<EccKeyPair, "privateKey">>(
    this: EccKey<T>,
    privateKey: Uint8Array,
  ): EccKey<T | "privateKey"> {
    const self = this as EccKey<T | "privateKey">;
    self.keypair.privateKey = privateKey;
    return self;
  }

  private static async importPublicKey(
    rawKey: BufferSource,
    usage: "ECDH" | "ECDSA",
  ): Promise<CryptoKey> {
    const publicKey = await crypto.subtle.importKey(
      "spki",
      rawKey,
      { name: usage, namedCurve: "P-384" },
      false,
      usage === "ECDSA" ? ["verify"] : [],
    );
    return publicKey;
  }
  private static async importPrivateKey(
    rawKey: BufferSource,
    usage: "ECDH" | "ECDSA",
  ): Promise<CryptoKey> {
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      rawKey,
      { name: usage, namedCurve: "P-384" },
      false,
      usage === "ECDSA" ? ["sign"] : ["deriveKey", "deriveBits"],
    );
    return privateKey;
  }

  /** @deprecated not used yet */
  private static async unwrapPublicKey(
    unwrappingKey: SymmetricKey,
    wrappedKey: BufferSource,
    iv: BufferSource,
  ) {
    const unwrapped = await crypto.subtle.unwrapKey(
      "raw",
      wrappedKey,
      unwrappingKey.key,
      { name: "AES-GCM", iv },
      { name: "ECDSA", namedCurve: "P-384" },
      true,
      ["verify"],
    );

    return unwrapped;
  }

  /** @deprecated not used yet */
  private static async unwrapPrivateKey(
    unwrappingKey: SymmetricKey,
    wrappedKey: BufferSource,
    iv: BufferSource,
  ) {
    const unwrapped = await crypto.subtle.unwrapKey(
      "raw",
      wrappedKey,
      unwrappingKey.key,
      { name: "AES-GCM", iv },
      { name: "ECDSA", namedCurve: "P-384" },
      true,
      ["sign"],
    );

    return unwrapped;
  }
}
