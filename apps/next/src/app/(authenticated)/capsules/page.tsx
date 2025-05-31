"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { bytesToHex } from "viem";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import {
  useAccount,
  useBalance,
  useContractContext,
} from "@/lib/blockchain/react";
import { generateIV } from "@/lib/crypto";

const formSchema = z.object({
  fee: z
    .string()
    .regex(/^[\d\.]+$/)
    .transform(BigInt),
  title: z.string().min(1, "타임캡슐 제목을 입력해주세요."),
  releasedAt: z
    .string()
    .datetime({ local: true, message: "유효한 날짜를 입력해주세요." })
    .transform(dayjs)
    .refine((date) => dayjs().isBefore(date, "minute"), {
      message: "개봉일은 현재 시간 이후여야 합니다.",
    })
    .transform((date) => BigInt(date.unix())),
});

export default function CapsuleHomePage() {
  const {
    client,
    contracts: { vault },
  } = useContractContext();
  const account = useAccount();
  const balance = useBalance();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fee: "0",
      title: "",
      releasedAt: new Date().toDateString(),
    },
  });

  const createCapsule = useMutation({
    mutationKey: ["createCapsule"],
    mutationFn: async ({
      fee,
      title,
      releasedAt,
    }: typeof formSchema._output) => {
      const iv = bytesToHex(generateIV());

      const { result, request } = await vault.simulate.register(
        [title, releasedAt, iv],
        { account: account.address, value: fee },
      );
      const hash = await client.writeContract(request);

      return { result, hash };
    },
    onSuccess: ({ result, hash }) => {
      console.log("Transaction result:", result, hash);
    },
    onError: (error) => {
      console.log("Error registering capsule:", error);
      const reason =
        // @ts-expect-error solidity error
        error?.cause?.reason ??
        error?.message ??
        "알 수 없는 오류가 발생했습니다.";

      toast({ description: `타임캡슐 등록에 실패했습니다: ${reason}` });
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createCapsule.mutateAsync(values);
    toast({ description: "타임캡슐이 등록되었습니다." });
  });

  return (
    <section className="flex h-screen flex-col items-center justify-center space-y-8 p-8">
      <div className="flex space-x-4">
        <section className="card card-border bg-base-300 flex flex-1 flex-col justify-center space-y-4 p-4">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold">타임캡슐</h1>

            <p className="text-base-content/70 text-lg">
              블록체인에 당신의 추억을 저장하세요.
            </p>

            <p className="text-base-content/70 text-sm">
              현재 잔액: {balance.data ? `${balance.data} wei` : "로딩 중..."}
            </p>
          </div>

          <Link className="btn" href="/capsules/mine">
            내 타임캡슐 보기
          </Link>

          <Link className="btn" href="/capsules/available">
            타임캡슐에 참여하기
          </Link>

          <Link className="btn" href="/capsules/participated">
            참여한 타임캡슐 보기
          </Link>
        </section>

        <Form
          form={form}
          className="card card-border bg-base-300 flex flex-1 flex-col space-y-4 p-4"
          onSubmit={onSubmit}
        >
          <FormField
            control={form.control}
            name="title"
            description="타임캡슐 제목"
            render={({ field }) => (
              <label className="input">
                <span className="label">제목</span>
                <input type="text" placeholder="제목" {...field} />
              </label>
            )}
          />

          <FormField
            control={form.control}
            name="releasedAt"
            description="타임캡슐이 개봉될 날짜"
            render={({ field }) => (
              <label className="input">
                <span className="label">개봉일</span>
                <input type="datetime-local" {...field} />
              </label>
            )}
          />

          <FormField
            control={form.control}
            name="fee"
            description="타임캡슐 참여자가 받을 수수료"
            render={({ field }) => (
              <label className="input">
                <span className="label">수수료</span>
                <input type="number" placeholder="수수료" {...field} />
                <span className="label">wei</span>
              </label>
            )}
          />

          <button className="btn" type="submit">
            새 타임캡슐 만들기
          </button>
        </Form>
      </div>
    </section>
  );
}
