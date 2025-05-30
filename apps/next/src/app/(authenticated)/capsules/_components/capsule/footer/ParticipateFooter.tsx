import { useMutation } from "@tanstack/react-query";
import { bytesToHex, Hex } from "viem";

import { toast } from "@/components/ui/toast";
import { Vault } from "@/lib/blockchain/contracts";
import { useAccount, useContractContext } from "@/lib/blockchain/react";
import { EccKey, wrapPem } from "@/lib/crypto";
import { downloadFileViaBlob } from "@/lib/file";

export function ParticipateFooter({ capsule }: { capsule: Vault.Capsule }) {
  const {
    client,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();

  const participate = useMutation({
    mutationKey: ["participate", capsule.id.toString()],
    mutationFn: async (publicKeyHex: Hex) => {
      const { result, request } = await vault.simulate.participate(
        [capsule.id, publicKeyHex],
        { account: account.address },
      );
      const hash = await client.writeContract(request);

      return { result, hash };
    },
    onSuccess: ({ result, hash }) => {
      console.log("Transaction result:", result, hash);
    },
    onError: (error) => {
      console.log("Error participating in capsule:", error);
      const reason =
        // @ts-expect-error solidity error
        error?.cause?.reason ??
        error.message ??
        "알 수 없는 오류가 발생했습니다.";

      toast({ description: `타임캡슐에 참여하지 못했습니다: ${reason}` });
    },
  });

  const onParticipate = async () => {
    const participantKey = await EccKey.generate();
    await participate.mutateAsync(bytesToHex(participantKey.export.publicKey));
    const blob = new Blob([
      wrapPem(Buffer.from(participantKey.export.privateKey).toString("base64")),
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
