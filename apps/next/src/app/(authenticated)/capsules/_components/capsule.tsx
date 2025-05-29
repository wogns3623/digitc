import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { useCountdown } from "usehooks-ts";
import { bytesToHex, ContractFunctionExecutionError, Hex } from "viem";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { Vault } from "@/lib/blockchain/contracts";
import { useAccount, useContractContext } from "@/lib/blockchain/react";
import { EccKey, wrapPem } from "@/lib/crypto";
import { downloadFileViaBlob } from "@/lib/file";
import { cn } from "@/lib/utils";

const formSchema = z.object({ file: z.instanceof(File) });

export function CapsuleCard({
  capsule,
  participated,
}: {
  capsule: Vault.Capsule;
  participated: boolean;
}) {
  const releasedAt = dayjs.unix(Number(capsule.releasedAt));
  const { isNegative, days, hours, minutes, seconds } =
    useCapsuleCountdown(releasedAt);

  return (
    <li className="card card-border bg-base-300 shadow-xl">
      <div className="card-body">
        <section className="card-title flex items-center justify-between space-x-8">
          <span className="flex items-center space-x-2">
            <h2 className="text-3xl">{capsule.title}</h2>

            <div
              className={cn("badge badge-soft", {
                "badge-primary":
                  capsule.status === Vault.CapsuleStatus.Registered,
                "badge-success":
                  capsule.status === Vault.CapsuleStatus.Encrypted,
                "badge-warning":
                  capsule.status === Vault.CapsuleStatus.Decrypted,
                "badge-accent": capsule.status === Vault.CapsuleStatus.Approved,
              })}
            >
              {Vault.CapsuleStatusLabels[capsule.status as Vault.CapsuleStatus]}
            </div>
          </span>

          <span className="font-mono text-2xl">
            {isNegative ? "-" : ""}
            {days > 0 && <span>{String(days).padStart(3, "0")}d</span>}
            <span className="countdown">
              <span style={{ "--value": hours } as React.CSSProperties}>
                {hours}
              </span>
              h
              <span style={{ "--value": minutes } as React.CSSProperties}>
                {minutes}
              </span>
              m
              <span style={{ "--value": seconds } as React.CSSProperties}>
                {seconds}
              </span>
              s
            </span>
          </span>
        </section>

        <div className="divider" />
        <section className="text-secondary-content space-y-2 text-sm">
          <p>수수료: {capsule.fee} WEI</p>
          <p>참여자: {capsule.participantCount}명</p>
          <p>개봉일: {releasedAt.format("YYYY-MM-DD HH:mm:ss")}</p>
        </section>

        <div className="card-actions flex justify-between">
          <CapsuleFooter capsule={capsule} participated={participated} />
        </div>
      </div>
    </li>
  );
}

function CapsuleFooter({
  capsule,
  participated,
}: {
  capsule: Vault.Capsule;
  participated: boolean;
}) {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();

  const isOwner = account.address === capsule.owner;

  if (capsule.status === Vault.CapsuleStatus.Registered) {
    if (isOwner) {
      return <EncryptFooter capsule={capsule} />;
    } else if (!participated) {
      return <ParticipateFooter capsule={capsule} />;
    }
  } else if (capsule.status === Vault.CapsuleStatus.Encrypted) {
    if (participated) {
      return <SubmitKeyFooter capsule={capsule} />;
    }
  }

  if (capsule.status === Vault.CapsuleStatus.Decrypted) {
    return <CanDecrypteFooter capsule={capsule} />;
  }

  return null;
}

function ParticipateFooter({ capsule }: { capsule: Vault.Capsule }) {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();

  const onParticipate = async () => {
    const participantKey = await EccKey.generate();

    try {
      const { result, request } = await vault.simulate.participate(
        [capsule.id, bytesToHex(participantKey.export.publicKey)],
        { account: account.address },
      );
      const hash = await walletClient.writeContract(request);
      console.log("Transaction result:", result, hash);

      toast({ description: "타임캡슐에 참여했습니다." });
    } catch (error) {
      console.log("Error registering capsule:", error);
      let reason = "알 수 없는 오류가 발생했습니다.";
      if (error instanceof ContractFunctionExecutionError) {
        // @ts-expect-error solidity error
        reason = error.cause?.reason;
      }
      toast({ description: `타임캡슐에 참여하지 못했습니다: ${reason}` });
    }

    const blob = new Blob([
      wrapPem(Buffer.from(participantKey.export.privateKey).toString("base64")),
    ]);

    downloadFileViaBlob(blob, `capsule_${capsule.id}.pem`);
  };

  return (
    <button className="btn btn-primary" onClick={onParticipate}>
      참여하기
    </button>
  );
}

function EncryptFooter({ capsule }: { capsule: Vault.Capsule }) {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();

  const encrypt = useMutation({
    mutationKey: ["encrypt", capsule.id.toString()],
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
  });

  const form = useForm({ resolver: zodResolver(formSchema) });

  const onSubmit = form.handleSubmit(async (values) => {
    const formdata = await encrypt.mutateAsync(values.file);

    const encrypted = formdata.get("file") as File;
    const publicKey = formdata.get("publicKey") as Hex;
    const encryptedKeys = formdata.getAll("encryptedKeys") as Hex[];

    try {
      const { result, request } = await vault.simulate.encrypt(
        [capsule.id, publicKey, encryptedKeys],
        { account: account.address },
      );
      const hash = await walletClient.writeContract(request);
      console.log("Transaction result:", result, hash);

      downloadFileViaBlob(encrypted, `capsule_${capsule.id}.enc`);
      toast({ description: "타임캡슐을 암호화했습니다." });
    } catch (error) {
      console.log("Error registering capsule:", error);
      let reason = "알 수 없는 오류가 발생했습니다.";
      if (error instanceof ContractFunctionExecutionError) {
        // @ts-expect-error solidity error
        reason = error.cause?.reason;
      }
      toast({ description: `타임캡슐 암호화에 실패했습니다: ${reason}` });
    }
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

function SubmitKeyFooter({ capsule }: { capsule: Vault.Capsule }) {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();
  return (
    <button
      className="btn btn-primary"
      onClick={() => {
        // `/api/capsules/${capsule.id}/decrypt`
      }}
    >
      복호화 키 제출하기
    </button>
  );
}

function CanDecrypteFooter({ capsule }: { capsule: Vault.Capsule }) {
  return (
    <button
      className="btn btn-primary"
      onClick={() => {
        // `/api/capsules/${capsule.id}/decrypt`
      }}
    >
      개봉하기
    </button>
  );
}

function useCapsuleCountdown(releasedAt: dayjs.Dayjs) {
  const countdown = useCountdown({
    countStart: releasedAt.diff(dayjs(), "seconds"),
    intervalMs: 1000,
    countStop: -Infinity,
  });
  const { startCountdown } = countdown[1];

  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  let [count] = countdown;
  const isNegative = count < 0;

  if (isNegative) count = -count;

  const days = Math.floor(count / (3600 * 24));
  const hours = Math.floor((count % (3600 * 24)) / 3600);
  const minutes = Math.floor((count % 3600) / 60);
  const seconds = count % 60;

  return { isNegative, days, hours, minutes, seconds };
}
