"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { bytesToHex } from "viem";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { z } from "zod";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { useCapsulesQueryInvalidation } from "@/hooks/capsuleQuery";
import { contracts } from "@/lib/blockchain";
import { generateIV } from "@/lib/crypto";

const formSchema = z.object({
  feeEth: z
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

const ETH = 10n ** 18n; // 1 ETH in wei
export default function HomePage() {
  const account = useAccount();

  return (
    <section className="flex h-screen flex-col items-center justify-center space-y-8 p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">타임캡슐</h1>

        <p className="text-base-content/70 text-lg">
          블록체인에 당신의 추억을 저장하세요.
        </p>
      </div>

      {!account.isConnected ? <WalletOptions /> : <CreateCapsuleForm />}
    </section>
  );
}

function WalletOptions() {
  const { connectors, connect } = useConnect();

  return connectors.map((connector) => (
    <button
      className="btn"
      key={connector.uid}
      onClick={() => connect({ connector })}
    >
      {connector.name}
    </button>
  ));
}

function Account() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  const balance = useQuery({
    queryKey: ["balance", address],
    queryFn: async () => {
      if (!address) return null;
      const balance = await publicClient.getBalance({ address });
      return { value: balance / ETH, symbol: "ETH" };
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-4">
      {ensAvatar && <Image alt="ENS Avatar" src={ensAvatar} />}
      {address && (
        <div className="text-sm">
          {ensName ? `${ensName} (${address})` : address}
        </div>
      )}

      <p className="text-base-content/70 text-sm">
        현재 잔액:{" "}
        {balance.data
          ? `${balance.data.value} ${balance.data.symbol}`
          : "로딩 중..."}
      </p>

      <button className="btn w-full" onClick={() => disconnect()}>
        로그아웃
      </button>
    </div>
  );
}

function CreateCapsuleForm() {
  const account = useAccount();

  const { writeContractAsync } = useWriteContract();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feeEth: "0",
      title: "",
      releasedAt: new Date().toDateString(),
    },
    disabled: !account.address,
  });

  const invalidateCapsulesQueries = useCapsulesQueryInvalidation();
  const onSubmit = form.handleSubmit(async ({ feeEth, title, releasedAt }) => {
    await writeContractAsync(
      {
        ...contracts.Vault,
        functionName: "register",
        args: [title, releasedAt, bytesToHex(generateIV())],
        value: feeEth * ETH,
      },
      {
        onError: (error) => {
          toast({
            title: "타임캡슐 등록에 실패했습니다",
            // @ts-expect-error solidity error
            description: error.cause?.reason ?? error.message,
          });
        },
        onSuccess: () => {
          invalidateCapsulesQueries();
          // form.reset();
        },
      },
    );

    toast({ description: "타임캡슐이 등록되었습니다." });
  });

  return (
    <div className="flex space-x-4">
      <section className="card card-border bg-base-300 flex flex-1 flex-col justify-between space-y-4 p-4">
        <Account />

        <section className="flex flex-col space-y-4">
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
          name="feeEth"
          description="타임캡슐 참여자가 받을 수수료"
          render={({ field }) => (
            <label className="input">
              <span className="label">수수료</span>
              <input type="number" placeholder="수수료" {...field} />
              <span className="label">ETH</span>
            </label>
          )}
        />

        <button className="btn" type="submit">
          새 타임캡슐 만들기
        </button>
      </Form>
    </div>
  );
}
