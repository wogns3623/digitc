import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Hex } from "viem";
import { useWriteContract } from "wagmi";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { useCapsulesQueryInvalidation } from "@/hooks/capsuleQuery";
import { contracts } from "@/lib/blockchain";
import { Vault } from "@/lib/blockchain/contracts";
import { downloadFileViaBlob } from "@/lib/file";

const fileFormSchema = z.object({ file: z.instanceof(File) });

export function EncryptDataFooter({ capsule }: { capsule: Vault.Capsule }) {
  const invalidateCapsulesQueries = useCapsulesQueryInvalidation();

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
      toast({
        title: "타임캡슐 암호화에 실패했습니다",
        description: error.message,
      });
    },
  });

  const { writeContractAsync } = useWriteContract();
  const form = useForm({ resolver: zodResolver(fileFormSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    const file = values.file;
    const formdata = await encryptData.mutateAsync(file);

    const encrypted = formdata.get("file") as File;
    const publicKey = formdata.get("publicKey") as Hex;
    const encryptedKeys = formdata.getAll("encryptedKeys") as Hex[];

    await writeContractAsync(
      {
        ...contracts.Vault,
        functionName: "encrypt",
        args: [capsule.id, publicKey, encryptedKeys],
      },
      {
        onError(error) {
          toast({
            title: "타임캡슐 암호화에 실패했습니다",
            // @ts-expect-error solidity error
            description: error.cause?.reason ?? error.message,
          });
        },
        onSuccess() {
          invalidateCapsulesQueries();
        },
      },
    );

    downloadFileViaBlob(encrypted, `${file.name}.enc`);
    toast({ description: "타임캡슐을 암호화했습니다." });
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
        암호화하기
      </button>
    </Form>
  );
}
