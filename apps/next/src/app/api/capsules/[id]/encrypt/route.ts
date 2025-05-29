// 타임캡슐 데이터를 암호화할 keypair 발급 api
import { NextRequest, NextResponse } from "next/server";
import { hexToBytes, getContract, bytesToHex } from "viem";

import { getPublicClient } from "@/lib/blockchain";
import { Vault } from "@/lib/blockchain/contracts";
import { EccKey, SymmetricKey } from "@/lib/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = await params.then((p) => BigInt(p.id));

  const contract = getContract({
    address: Vault.address,
    abi: Vault.abi,
    client: getPublicClient(),
  });

  const [capsule, participants] = await Promise.all([
    contract.read.getCapsule([id]),
    contract.read.getParticipants([id]),
  ]);
  const iv = hexToBytes(capsule.iv);

  const masterKey = await SymmetricKey.generate();
  const exportedMasterKey = await masterKey.export();
  const ownerKey = await EccKey.generate();

  const encryptedKeys = await Promise.all(
    participants.map(async (participant) => {
      const participantKey = new EccKey({
        publicKey: hexToBytes(participant.publicKey),
      });

      const participantSecretKey = await ownerKey.deriveKey(participantKey);

      // TODO: using .wrapKey() instead of .encrypt()
      const participantEncryptedKey = await participantSecretKey.encrypt(
        exportedMasterKey,
        iv,
      );

      return bytesToHex(participantEncryptedKey);
    }),
  );

  // TODO: Streaming
  const blob = await req.blob();
  const data = await blob.arrayBuffer();
  const encryptedData = await masterKey.encrypt(data, iv);

  const formdata = new FormData();
  formdata.append("publicKey", bytesToHex(ownerKey.export.publicKey));
  encryptedKeys.forEach((encryptedKey) =>
    formdata.append("encryptedKeys", encryptedKey),
  );

  formdata.append("file", new Blob([encryptedData]), "capsule.dat");

  return new NextResponse(formdata, { status: 200 });
}
