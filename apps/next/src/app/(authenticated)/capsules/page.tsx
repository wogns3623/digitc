"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { bytesToHex } from "viem";
import { useBalance, useWriteContract } from "wagmi";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { contracts } from "@/lib/blockchain";
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
  const { writeContractAsync } = useWriteContract({
    mutation: {
      onError: (error) => {
        // @ts-expect-error solidity error
        const reason = error.cause?.reason ?? error.message;
        toast({ description: `타임캡슐 등록에 실패했습니다: ${reason}` });
      },
    },
  });
  const balance = useBalance();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fee: "0",
      title: "",
      releasedAt: new Date().toDateString(),
    },
  });

  const onSubmit = form.handleSubmit(async ({ fee, title, releasedAt }) => {
    await writeContractAsync({
      ...contracts.Vault,
      functionName: "register",
      args: [title, releasedAt, bytesToHex(generateIV())],
      value: fee,
    });

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
