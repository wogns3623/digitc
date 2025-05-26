import { NextRequest, NextResponse } from "next/server";

import { getContract } from "viem";

import { wagmiContract } from "@/utils/chain/contracts";
import { getPublicClient } from "@/utils/chain";
import {
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPublicKey,
} from "@/utils/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await params.then((p) => BigInt(p.id));

  const masterKeypair = await generateKeyPair();

  // 1. Create contract instance
  const contract = getContract({
    address: wagmiContract.address,
    abi: wagmiContract.abi,
    client: await getPublicClient(),
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
