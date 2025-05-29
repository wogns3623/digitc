"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { bytesToHex, ContractFunctionExecutionError } from "viem";
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
    .refine((date) => date.isAfter(dayjs()), {
      message: "개봉일은 현재 시간 이후여야 합니다.",
    })
    .transform((date) => BigInt(date.unix())),
});

export default function CapsuleHomePage() {
  const {
    walletClient,
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

  const onSubmit = form.handleSubmit(async ({ fee, title, releasedAt }) => {
    const iv = bytesToHex(generateIV());

    try {
      const { result, request } = await vault.simulate.register(
        [title, releasedAt, iv],
        { account: account.address, value: fee },
      );
      const hash = await walletClient.writeContract(request);
      console.log("Transaction result:", result, hash);

      toast({ description: "타임캡슐이 등록되었습니다." });
    } catch (error) {
      console.log("Error registering capsule:", error);
      let reason = "알 수 없는 오류가 발생했습니다.";
      if (error instanceof ContractFunctionExecutionError) {
        // @ts-expect-error solidity error
        reason = error.cause?.reason;
      }
      toast({ description: `타임캡슐 등록에 실패했습니다: ${reason}` });
    }
  });

  return (
    <section className="flex h-screen flex-col items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">타임캡슐</h1>
        <p className="text-secondary-content text-lg">
          블록체인에 당신의 추억을 저장하세요.
        </p>

        <p className="text-secondary-content text-sm">
          address: <span>{walletClient.account?.address}</span>
        </p>

        <p className="text-secondary-content text-sm">
          현재 잔액: {balance ? `${balance} wei` : "로딩 중..."}
        </p>
      </div>

      <div className="mt-8 flex flex-col space-y-4">
        <Form
          form={form}
          onSubmit={onSubmit}
          className="flex flex-col space-y-8"
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

        <Link className="btn" href="/capsules/mine">
          내 타임캡슐 보기
        </Link>

        <Link className="btn" href="/capsules/available">
          내 타임캡슐 보기
        </Link>
      </div>
    </section>
  );
}
