import { bytesToHex } from "viem";
import { useWriteContract } from "wagmi";

import { toast } from "@/components/ui/toast";
import { contracts } from "@/lib/blockchain";
import { Vault } from "@/lib/blockchain/contracts";
import { EccKey, wrapPem } from "@/lib/crypto";
import { downloadFileViaBlob } from "@/lib/file";

export function ParticipateFooter({ capsule }: { capsule: Vault.Capsule }) {
  const { writeContractAsync } = useWriteContract();

  const onParticipate = async () => {
    const participantKey = EccKey.generate();

    await writeContractAsync(
      {
        ...contracts.Vault,
        functionName: "decrypt",
        args: [capsule.id, bytesToHex(participantKey.exportPublicKey())],
      },
      {
        onError(error) {
          toast({
            title: "타임캡슐에 참여하지 못했습니다",
            // @ts-expect-error solidity error
            description: error.cause?.reason ?? error.message,
          });
        },
      },
    );
    const blob = new Blob([
      wrapPem(
        Buffer.from(participantKey.exportPrivateKey()).toString("base64"),
      ),
    ]);

    downloadFileViaBlob(blob, `capsule_${capsule.id}.pem`);

    toast({ description: "타임캡슐에 참여했습니다." });
  };

  return (
    <button className="btn btn-primary w-full" onClick={onParticipate}>
      참여하기
    </button>
  );
}
