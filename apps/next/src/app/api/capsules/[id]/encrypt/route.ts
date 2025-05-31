// 타임캡슐 데이터를 암호화할 keypair 발급 api
import { NextRequest, NextResponse } from "next/server";
import { hexToBytes, bytesToHex } from "viem";
import { readContracts } from "wagmi/actions";

import { config, contracts } from "@/lib/blockchain";
import { EccKey, SymmetricKey } from "@/lib/crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = await params.then((p) => BigInt(p.id));

  const [capsule, participants] = await readContracts(config, {
    contracts: [
      { ...contracts.Vault, functionName: "getCapsule", args: [id] },
      { ...contracts.Vault, functionName: "getParticipants", args: [id] },
    ],
  });

  if (capsule.status !== "success" || participants.status !== "success") {
    return new NextResponse(
      `Failed to retrieve capsule or participants of the capsule ${id}.`,
      { status: 500 },
    );
  }

  const iv = hexToBytes(capsule.result.iv);

  const masterKey = await SymmetricKey.generate();
  const exportedMasterKey = await masterKey.export();
  const ownerKeypair = EccKey.generate();

  const publicKey = bytesToHex(ownerKeypair.exportPublicKey());
  const encryptedKeys = await Promise.all(
    participants.result.map(async (participant) => {
      const participantKeypair = EccKey.fromPublicKey(
        hexToBytes(participant.publicKey),
      );

      const derivedKey = await ownerKeypair.deriveKey(participantKeypair);

      // TODO: using .wrapKey() instead of .encrypt()
      const participantEncryptedKey = await derivedKey.encrypt(
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
  formdata.append("publicKey", publicKey);
  encryptedKeys.forEach((encryptedKey) =>
    formdata.append("encryptedKeys", encryptedKey),
  );

  formdata.append("file", new Blob([encryptedData]), "capsule.dat");

  return new NextResponse(formdata, { status: 200 });
}
