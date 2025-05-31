import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { hexToBigInt, hexToBytes } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { contracts } from "@/lib/blockchain";
import { Vault } from "@/lib/blockchain/contracts";
import { EccKey, SymmetricKey } from "@/lib/crypto";
import { downloadFileViaBlob } from "@/lib/file";

const fileFormSchema = z.object({ file: z.instanceof(File) });

export function OpenCapsuleFooter({ capsule }: { capsule: Vault.Capsule }) {
  const form = useForm({ resolver: zodResolver(fileFormSchema) });

  const { writeContractAsync } = useWriteContract();
  const participants = useReadContract({
    ...contracts.Vault,
    functionName: "getParticipants",
    query: {
      enabled: form.formState.touchedFields.file,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const file = values.file;
    const ownerKeypair = EccKey.fromPublicKey(hexToBytes(capsule.publicKey));

    const participant = (await participants.promise).find(
      (p) => hexToBigInt(p.privateKey) > 0n,
    );
    if (!participant) {
      toast({ description: "아직 키를 제출한 참여자가 없습니다." });
      return;
    }

    const participantKeypair = EccKey.fromPrivateKey(
      hexToBytes(participant.privateKey),
    );
    const secretKey = await ownerKeypair.deriveKey(participantKeypair);
    const masterKey = await secretKey
      .decrypt(hexToBytes(participant.encryptedKey), hexToBytes(capsule.iv))
      .then((keyBytes) => SymmetricKey.import(keyBytes));

    const data = await file.arrayBuffer();
    const decrypted = await masterKey.decrypt(data, hexToBytes(capsule.iv));

    await writeContractAsync(
      { ...contracts.Vault, functionName: "approve", args: [capsule.id] },
      {
        onError(error) {
          toast({
            title: "타임캡슐 개봉에 실패했습니다",
            // @ts-expect-error solidity error
            description: error.cause?.reason ?? error.message,
          });
        },
      },
    );

    const filename = file.name.endsWith(".enc")
      ? file.name.slice(0, -4)
      : file.name;
    downloadFileViaBlob(new Blob([decrypted]), filename);

    toast({
      description: "데이터를 복호화했습니다. 참여자들에게는 보상이 정산됩니다.",
    });
  });

  return (
    <Form form={form} className="flex w-full space-x-2" onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name="file"
        className="flex-1"
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        render={({ field: { value, onChange, ...field } }) => (
          <input
            type="file"
            className="file-input w-full"
            {...field}
            onChange={(e) => onChange(e.target.files?.[0])}
            disabled={
              capsule.participantCount === 0n ||
              form.formState.isSubmitting ||
              field.disabled
            }
          />
        )}
      />

      <button
        type="submit"
        className="btn btn-primary"
        disabled={
          capsule.participantCount === 0n || form.formState.isSubmitting
        }
      >
        {form.formState.isSubmitting && (
          <span className="loading loading-spinner" />
        )}
        개봉하기
      </button>
    </Form>
  );
}
