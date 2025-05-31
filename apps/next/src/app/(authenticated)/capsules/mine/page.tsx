"use client";

import { useReadContract } from "wagmi";

import { contracts } from "@/lib/blockchain";
import { useAssertedAccount } from "@/lib/blockchain/react";

import { CapsuleList } from "../_components/capsule";

export default function MyCapsulesPage() {
  const { address } = useAssertedAccount();
  const capsules = useReadContract({
    ...contracts.Vault,
    functionName: "getMyCapsules",
    query: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    account: address,
  });

  return (
    <div className="flex h-screen w-full flex-col items-center p-8">
      <h1 className="mb-4 text-2xl font-bold">내 타임캡슐</h1>

      <CapsuleList
        notFoundMessage="생성한 타임캡슐이 없습니다."
        capsules={capsules}
      />
    </div>
  );
}
