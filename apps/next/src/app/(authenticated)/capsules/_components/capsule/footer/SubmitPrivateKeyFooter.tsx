import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { bytesToHex, Hex } from "viem";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { Vault } from "@/lib/blockchain/contracts";
import { useAccount, useContractContext } from "@/lib/blockchain/react";
import { unwrapPem } from "@/lib/crypto";

const fileFormSchema = z.object({ file: z.instanceof(File) });

export function SubmitPrivateKeyFooter({
  capsule,
}: {
  capsule: Vault.Capsule;
}) {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();

  const submitPrivateKey = useMutation({
    mutationKey: ["submitPrivateKey", capsule.id.toString()],
    mutationFn: async (privateKey: Hex) => {
      const { result, request } = await vault.simulate.decrypt(
        [capsule.id, privateKey],
        { account: account.address },
      );
      const hash = await walletClient.writeContract(request);

      return { result, hash };
    },

    onSuccess: ({ result, hash }) => {
      console.log("Transaction result:", result, hash);
    },
    onError: (error) => {
      console.log("Error submitting participant private key:", error);
      const reason =
        // @ts-expect-error solidity error
        error?.cause?.reason ??
        error.message ??
        "알 수 없는 오류가 발생했습니다.";

      toast({ description: `복호화 키 제출에 실패했습니다: ${reason}` });
    },
  });

  const form = useForm({ resolver: zodResolver(fileFormSchema) });

  const onSubmit = form.handleSubmit(async (value) => {
    const privateKey = await value.file
      .text()
      .then(unwrapPem)
      .then((b64Key) => Buffer.from(b64Key, "base64"))
      .then(bytesToHex);

    await submitPrivateKey.mutateAsync(privateKey);

    toast({
      description:
        "복호화 키를 제출했습니다. 이후 타임캡슐이 개봉되면 보상이 정산됩니다.",
    });
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
            accept=".pem"
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
        복호화 키 제출하기
      </button>
    </Form>
  );
}
