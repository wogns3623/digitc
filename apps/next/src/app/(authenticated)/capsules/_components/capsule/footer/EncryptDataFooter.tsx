import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Hex } from "viem";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { Vault } from "@/lib/blockchain/contracts";
import { useAccount, useContractContext } from "@/lib/blockchain/react";
import { downloadFileViaBlob } from "@/lib/file";

const fileFormSchema = z.object({ file: z.instanceof(File) });

export function EncryptDataFooter({ capsule }: { capsule: Vault.Capsule }) {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();

  const submitPublicKey = useMutation({
    mutationKey: ["submitPublicKey", capsule.id.toString()],
    mutationFn: async ({
      publicKey,
      encryptedKeys,
    }: {
      publicKey: Hex;
      encryptedKeys: Hex[];
    }) => {
      const { result, request } = await vault.simulate.encrypt(
        [capsule.id, publicKey, encryptedKeys],
        { account: account.address },
      );
      const hash = await walletClient.writeContract(request);

      return { result, hash };
    },
    onSuccess: ({ result, hash }) => {
      console.log("Transaction result:", result, hash);
    },
    onError: (error) => {
      console.log("Error submitting public key:", error);
      const reason =
        // @ts-expect-error solidity error
        error?.cause?.reason ??
        error.message ??
        "알 수 없는 오류가 발생했습니다.";

      toast({ description: `타임캡슐 암호화에 실패했습니다: ${reason}` });
    },
  });

  const encryptData = useMutation({
    mutationKey: ["encryptData", capsule.id.toString()],
    mutationFn: async (file: File) => {
      const response = await fetch(`/api/capsules/${capsule.id}/encrypt`, {
        body: file,
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("암호화 요청에 실패했습니다.");
      }

      const formdata = await response.formData();
      return formdata;
    },
    onError: (error) => {
      console.log("Error encrypting data:", error);
      const reason =
        // @ts-expect-error solidity error
        error?.cause?.reason ??
        error.message ??
        "알 수 없는 오류가 발생했습니다.";

      toast({ description: `타임캡슐 암호화에 실패했습니다: ${reason}` });
    },
  });

  const form = useForm({ resolver: zodResolver(fileFormSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    const file = values.file;
    const formdata = await encryptData.mutateAsync(file);

    const encrypted = formdata.get("file") as File;
    const publicKey = formdata.get("publicKey") as Hex;
    const encryptedKeys = formdata.getAll("encryptedKeys") as Hex[];

    await submitPublicKey.mutateAsync({ publicKey, encryptedKeys });

    downloadFileViaBlob(encrypted, `${file.name}.enc`);
    toast({ description: "타임캡슐을 암호화했습니다." });
  });

  return (
    <Form form={form} className="flex w-full space-x-2" onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name="file"
        className="flex-1"
        render={({ field }) => (
          <input
            type="file"
            className="file-input w-full"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(field as any)}
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
        암호화하기
      </button>
    </Form>
  );
}
