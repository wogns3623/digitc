"use client";

import { useEffect, useState } from "react";

import * as crypto from "@/lib/crypto";

export default function DevPage() {
  const [reload, setReload] = useState({});

  useEffect(() => {
    (async () => {
      const masterKeypair = await crypto.generateKeyPair();
      const keypair1 = await crypto.generateKeyPair([
        "encrypt",
        "decrypt",
        "wrapKey",
        "unwrapKey",
      ]);
      console.log(masterKeypair, keypair1);

      const masterPublicKey = await crypto.exportPublicKey(
        masterKeypair.publicKey,
      );
      const publicKey = await crypto.exportPublicKey(keypair1.publicKey);
      const masterPrivateKey = await crypto.exportPrivateKey(
        masterKeypair.privateKey,
        keypair1.publicKey,
      );
      console.log({ masterPublicKey, publicKey, masterPrivateKey });
    })().catch((error) => {
      console.error("Error in DevPage useEffect:", error);
    });
  }, [reload]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-8">
      <button className="btn btn-primary" onClick={() => setReload({})}>
        reload
      </button>
    </div>
  );
}
