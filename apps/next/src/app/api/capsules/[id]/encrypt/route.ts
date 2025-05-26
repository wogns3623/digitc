// 타임캡슐 데이터를 암호화할 keypair 발급 api
import { NextRequest, NextResponse } from "next/server";

import { getContract } from "viem";

import { getPublicClient } from "@/lib/blockchain";
import { Vault } from "@/lib/blockchain/contracts";
import {
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPublicKey,
} from "@/lib/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await params.then((p) => BigInt(p.id));

  const masterKeypair = await generateKeyPair();

  // 1. Create contract instance
  const contract = getContract({
    address: Vault.address,
    abi: Vault.abi,
    client: getPublicClient(),
  });

  const capsule = await contract.read.getCapsule([id]);
  capsule.encryptionKey = await exportPublicKey(masterKeypair.publicKey);

  const participants = await contract.read.getParticipants([id]);

  for (const participant of participants) {
    const participantPublicKey = await importPublicKey(participant.publicKey);

    participant.encryptedKey = await exportPrivateKey(
      masterKeypair.privateKey,
      participantPublicKey
    );
  }

  return new NextResponse(
    JSON.stringify({
      capsule,
      participants,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
