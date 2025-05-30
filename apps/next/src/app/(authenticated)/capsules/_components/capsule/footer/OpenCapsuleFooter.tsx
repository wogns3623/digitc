import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { hexToBool, hexToBytes } from "viem";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { Vault } from "@/lib/blockchain/contracts";
import { useAccount, useContractContext } from "@/lib/blockchain/react";
import { EccKey, SymmetricKey } from "@/lib/crypto";
import { downloadFileViaBlob } from "@/lib/file";

const fileFormSchema = z.object({ file: z.instanceof(File) });

export function OpenCapsuleFooter({ capsule }: { capsule: Vault.Capsule }) {
  const {
    client,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();

  const getParticipants = async () => {
    const participants = await vault.read.getParticipants([capsule.id], {
      account: account.address,
    });
    return participants;
  };

  const approve = useMutation({
    mutationKey: ["approve", capsule.id.toString()],
    mutationFn: async () => {
      const { result, request } = await vault.simulate.approve([capsule.id], {
        account: account.address,
      });
      const hash = await client.writeContract(request);

      return { result, hash };
    },

    onSuccess: ({ result, hash }) => {
      console.log("Transaction result:", result, hash);
    },
    onError: (error) => {
      console.log("Error opening capsule:", error);
      const reason =
        // @ts-expect-error solidity error
        error?.cause?.reason ??
        error.message ??
        "알 수 없는 오류가 발생했습니다.";

      toast({ description: `타임캡슐 개봉에 실패했습니다: ${reason}` });
    },
  });

  const form = useForm({ resolver: zodResolver(fileFormSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    const file = values.file;
    const publicKey = new EccKey({ publicKey: hexToBytes(capsule.publicKey) });

    const participants = await getParticipants();
    const participant = participants.find(
      (p) => hexToBool(p.privateKey) && p.isApproved,
    );
    if (!participant) {
      toast({ description: "아직 키를 제출한 참여자가 없습니다." });
      return;
    }

    const privateKey = new EccKey({
      privateKey: hexToBytes(participant.privateKey),
    });
    const secretKey = await publicKey.deriveKey(privateKey);
    const masterKey = await secretKey
      .decrypt(hexToBytes(participant.encryptedKey), hexToBytes(capsule.iv))
      .then(SymmetricKey.import);

    const data = await file.arrayBuffer();
    const decrypted = await masterKey.decrypt(data, hexToBytes(capsule.iv));

    await approve.mutateAsync();

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
