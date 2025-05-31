import type { webcrypto } from "crypto";
import elliptic from "elliptic";
import { bytesToHex, hexToBytes, Prettify } from "viem";

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

type EccKeyType = "public" | "private";

export class EccKey<T extends EccKeyType = "public"> {
  private static EC = new elliptic.ec("p256");

  private type: T;
  private key: elliptic.ec.KeyPair;

  private constructor(key: elliptic.ec.KeyPair, type: T) {
    this.type = type;
    this.key = key;
  }

  // verify(data: Uint8Array, signature: Uint8Array) {
  //   return this.key.verify(data, signature);
  // }

  // sign(this: EccKey<"private">, data: Uint8Array) {
  //   return this.key.sign(data);
  // }

  async deriveKey(
    this: EccKey<"private">,
    other: EccKey<"public">,
  ): Promise<SymmetricKey>;
  async deriveKey(other: EccKey<"private">): Promise<SymmetricKey>;
  async deriveKey(this: EccKey<EccKeyType>, other: EccKey<EccKeyType>) {
    if (!this.hasPrivateKey() && !other.hasPrivateKey()) {
      throw new Error("Both keys must be provided for ECDH key derivation.");
    }

    const secretKey = this.hasPrivateKey()
      ? this.key.derive(other.key.getPublic())
      : other.key.derive(this.key.getPublic());

    return SymmetricKey.import(new Uint8Array(secretKey.toArray()));
  }

  hasPrivateKey(): this is EccKey<"private"> {
    return this.type === "private";
  }

  /**
   * y의 부호는 ECDH에서 중요하지 않기 때문에 solidity uint256에 맞추기 위해 뺌
   */
  exportPublicKey() {
    return new Uint8Array(this.key.getPublic().encodeCompressed().slice(1));
  }

  exportPrivateKey(this: EccKey<"private">): Uint8Array {
    return new Uint8Array(this.key.getPrivate().toArray());
  }

  // addPrivateKey<T extends Exclude<EccKeyType, "privateKey">>(
  //   this: EccKey<T>,
  //   privateKey: Uint8Array,
  // ): EccKey<T | "privateKey"> {
  //   const self = this as EccKey<T | "privateKey">;
  //   self.keypair.privateKey = privateKey;
  //   return self;
  // }

  static generate() {
    return new EccKey(this.EC.genKeyPair(), "private");
  }

  /**
   * @param publicKey compressed public key in Uint8Array format
   */
  static fromPublicKey(publicKey: Uint8Array): EccKey<"public"> {
    return new EccKey(
      this.EC.keyFromPublic(new Uint8Array([0x03, ...publicKey])),
      "public",
    );
  }

  static fromPrivateKey(privateKey: Uint8Array): EccKey<"private"> {
    return new EccKey(this.EC.keyFromPrivate(privateKey), "private");
  }

  // /** @deprecated not used yet */
  // private static async unwrapPublicKey(
  //   unwrappingKey: SymmetricKey,
  //   wrappedKey: BufferSource,
  //   iv: BufferSource,
  // ) {
  //   const unwrapped = await crypto.subtle.unwrapKey(
  //     "raw",
  //     wrappedKey,
  //     unwrappingKey.key,
  //     { name: "AES-GCM", iv },
  //     { name: "ECDSA", namedCurve: "P-256" },
  //     true,
  //     ["verify"],
  //   );

  //   return unwrapped;
  // }

  // /** @deprecated not used yet */
  // private static async unwrapPrivateKey(
  //   unwrappingKey: SymmetricKey,
  //   wrappedKey: BufferSource,
  //   iv: BufferSource,
  // ) {
  //   const unwrapped = await crypto.subtle.unwrapKey(
  //     "raw",
  //     wrappedKey,
  //     unwrappingKey.key,
  //     { name: "AES-GCM", iv },
  //     { name: "ECDSA", namedCurve: "P-256" },
  //     true,
  //     ["sign"],
  //   );

  //   return unwrapped;
  // }
}

// const EC = new elliptic.ec("p256");
// {
//   const keypair = EC.genKeyPair();
//   const privateKey = `0x${keypair.getPrivate("hex")}`;
//   const publicKey = `0x${keypair.getPublic("hex")}`;
//   console.log(privateKey);
//   console.log(publicKey);
//   console.log(keypair.getPrivate("hex"));
//   console.log(bytesToHex(keypair.getPrivate().toBuffer()));
//   console.log(keypair.getPublic().encodeCompressed("hex"));

//   // const restored = EC.keyFromPublic(
//   //   {
//   //     x: keypair.getPublic().getX().toString("hex"),
//   //     y: keypair.getPublic().getY().toString("hex"),
//   //   },
//   //   "hex",
//   // );
//   const restored = EC.keyFromPublic(
//     new Uint8Array(keypair.getPublic().encodeCompressed()),
//   );

//   console.log(restored.getPrivate());
//   console.log(restored.getPublic().encodeCompressed("hex"));

//   const publicKeyWithoutPrefix = new Uint8Array(
//     restored.getPublic().encodeCompressed().slice(1),
//   );
//   const publicKeyWithoutPrefixHex = bytesToHex(publicKeyWithoutPrefix);
//   console.log(
//     bytesToHex(publicKeyWithoutPrefix),
//     publicKeyWithoutPrefix.length,
//   );

//   const restored2 = EC.keyFromPublic(
//     new Uint8Array([0x03, ...publicKeyWithoutPrefix]),
//   );
//   console.log(restored2.getPublic().encodeCompressed("hex"));
//   console.log(
//     restored2.getPublic().encodeCompressed("hex") ===
//       restored.getPublic().encodeCompressed("hex"),
//   );

//   restored2.verify;
// }

// {
//   // Generate keys
//   const key1 = EC.genKeyPair();
//   const key2 = EC.genKeyPair();

//   const shared1 = key1.derive(key2.getPublic());
//   const shared2 = key2.derive(key1.getPublic());

//   console.log(bytesToHex(shared1.toBuffer()), bytesToHex(shared2.toBuffer()));

//   const key1ImportedPrivate = await crypto.subtle.importKey(
//     "jwk",
//     {
//       kty: "EC",
//       crv: "P-256",
//       x: key1.getPublic().getX().toBuffer().toString("base64"),
//       y: key1.getPublic().getY().toBuffer().toString("base64"),
//       d: key1.getPrivate().toBuffer().toString("base64"),
//     },
//     { name: "ECDH", namedCurve: "P-256" },
//     true,
//     ["deriveKey"],
//   );
//   const key1ImportedPublic = await crypto.subtle.importKey(
//     "jwk",
//     {
//       kty: "EC",
//       crv: "P-256",
//       x: key1.getPublic().getX().toBuffer().toString("base64"),
//       y: key1.getPublic().getY().toBuffer().toString("base64"),
//     },
//     { name: "ECDH", namedCurve: "P-256" },
//     true,
//     [],
//   );

//   const key2ImportedPrivate = await crypto.subtle.importKey(
//     "jwk",
//     {
//       kty: "EC",
//       crv: "P-256",
//       x: key2.getPublic().getX().toBuffer().toString("base64"),
//       y: key2.getPublic().getY().toBuffer().toString("base64"),
//       d: key2.getPrivate().toBuffer().toString("base64"),
//     },
//     { name: "ECDH", namedCurve: "P-256" },
//     true,
//     ["deriveKey"],
//   );
//   const key2ImportedPublic = await crypto.subtle.importKey(
//     "jwk",
//     {
//       kty: "EC",
//       crv: "P-256",
//       x: key2.getPublic().getX().toBuffer().toString("base64"),
//       y: key2.getPublic().getY().toBuffer().toString("base64"),
//     },
//     { name: "ECDH", namedCurve: "P-256" },
//     true,
//     [],
//   );
//   console.log(
//     key1ImportedPrivate,
//     key1ImportedPublic,
//     key2ImportedPrivate,
//     key2ImportedPublic,
//   );

//   const sharedKey1 = await SymmetricKey.derive({
//     privateKey: key1ImportedPrivate,
//     publicKey: key2ImportedPublic,
//   });
//   const sharedKey2 = await SymmetricKey.derive({
//     privateKey: key2ImportedPrivate,
//     publicKey: key1ImportedPublic,
//   });

//   console.log(
//     bytesToHex(await sharedKey1.export()),
//     bytesToHex(await sharedKey2.export()),
//   );
// }

// {
//   const message = new TextEncoder().encode("Hello, world!");
//   const keypair = EccKey.generate();
//   console.log(keypair.key.getPublic().encodeCompressed("hex"));

//   // const signature = keypair.sign(message);
//   // const signatureHex = bytesToHex(new Uint8Array(signature.toDER()));
//   // console.log(signatureHex);
//   // console.log(keypair.verify(message, hexToBytes(signatureHex)));

//   const keypair2 = EccKey.generate();
//   const sharedKey1 = await keypair.deriveKey(keypair2);
//   const sharedKey2 = await keypair2.deriveKey(keypair);
//   console.log(bytesToHex(await sharedKey1.export()));
//   console.log(bytesToHex(await sharedKey2.export()));

//   const publicKey = keypair.exportPublicKey();
//   const privateKey = keypair.exportPrivateKey();
//   console.log(bytesToHex(publicKey));
//   console.log(bytesToHex(privateKey));

//   const restoredKeypair = EccKey.fromPublicKey(publicKey);
//   // console.log(restoredKeypair.verify(message, hexToBytes(signatureHex)));

//   const restoredSharedKey = await restoredKeypair.deriveKey(keypair2);
//   console.log(bytesToHex(await restoredSharedKey.export()));
//   console.log(
//     bytesToHex(await restoredSharedKey.export()) ===
//       bytesToHex(await sharedKey1.export()),
//   );
// }
