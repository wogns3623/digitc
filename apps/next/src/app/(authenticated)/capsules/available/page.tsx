"use client";

import { useQuery } from "@tanstack/react-query";

import { useContractContext } from "@/lib/blockchain/react";

import { CapsuleCard } from "../_components/capsule";

export default function AvailableCapsulesPage() {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();

  const availableCapsules = useQuery({
    queryKey: ["availableCapsules"],
    queryFn: async () => {
      if (!walletClient.account) return [];
      const [capsules, participated] = await vault.read.getAvailableCapsules();
      return capsules.map((capsule, i) => ({
        capsule,
        participated: participated[i],
      }));
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="flex h-screen w-full flex-col p-8">
      <h1 className="mb-4 text-2xl font-bold">타임캡슐에 참여하기</h1>

      {availableCapsules.isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : !availableCapsules.data ? (
        <p className="text-secondary-content">
          참여 가능한 타임캡슐이 없습니다.
        </p>
      ) : (
        <ul className="space-y-2">
          {availableCapsules.data.map(({ capsule, participated }) => (
            <CapsuleCard
              capsule={capsule}
              participated={participated}
              key={capsule.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
