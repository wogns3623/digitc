"use client";

import { useReadContract } from "wagmi";

import { contracts } from "@/lib/blockchain";

import { CapsuleList } from "../_components/capsule";

export default function AvailableCapsulesPage() {
  const capsules = useReadContract({
    ...contracts.Vault,
    functionName: "getAvailableCapsules",
    query: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      select([capsules, participants]) {
        return capsules.map((capsule, i) => ({
          ...capsule,
          participant: participants[i],
        }));
      },
    },
  });

  return (
    <div className="flex h-screen w-full flex-col items-center p-8">
      <h1 className="mb-4 text-2xl font-bold">타임캡슐에 참여하기</h1>

      <CapsuleList
        notFoundMessage="참여 가능한 타임캡슐이 없습니다."
        capsules={capsules}
      />
    </div>
  );
}
