import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { bytesToHex } from "viem";
import { useWriteContract } from "wagmi";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { contracts } from "@/lib/blockchain";
import { Vault } from "@/lib/blockchain/contracts";
import { unwrapPem } from "@/lib/crypto";

const fileFormSchema = z.object({ file: z.instanceof(File) });

export function SubmitPrivateKeyFooter({
  capsule,
}: {
  capsule: Vault.Capsule;
}) {
  const { writeContractAsync } = useWriteContract();

  const form = useForm({ resolver: zodResolver(fileFormSchema) });

  const onSubmit = form.handleSubmit(async (value) => {
    const privateKey = await value.file
      .text()
      .then(unwrapPem)
      .then((b64Key) => Buffer.from(b64Key, "base64"))
      .then(bytesToHex);

    await writeContractAsync(
      {
        ...contracts.Vault,
        functionName: "decrypt",
        args: [capsule.id, privateKey],
      },
      {
        onError(error) {
          toast({
            title: "복호화 키 제출에 실패했습니다",
            // @ts-expect-error solidity error
            description: error.cause?.reason ?? error.message,
          });
        },
      },
    );

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
        복호화 키 제출하기
      </button>
    </Form>
  );
}
