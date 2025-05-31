"use client";

import { useQuery } from "@tanstack/react-query";

import { useContractContext } from "@/lib/blockchain/react";

import { CapsuleCard } from "../_components/capsule";

export default function AvailableCapsulesPage() {
  const {
    contracts: { vault },
  } = useContractContext();

  const capsules = useQuery({
    queryKey: ["availableCapsules"],
    queryFn: async () => {
      const [capsules, participants] = await vault.read.getAvailableCapsules();
      return capsules.map((capsule, i) => ({
        capsule,
        participant: participants[i],
      }));
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="flex h-screen w-full flex-col items-center p-8">
      <h1 className="mb-4 text-2xl font-bold">타임캡슐에 참여하기</h1>

      {capsules.isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : !capsules.data || capsules.data.length === 0 ? (
        <p className="text-base-content/70">참여 가능한 타임캡슐이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {capsules.data.map(({ capsule, participant }) => (
            <CapsuleCard
              capsule={capsule}
              participant={participant}
              key={capsule.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
