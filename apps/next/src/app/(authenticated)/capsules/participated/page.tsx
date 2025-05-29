"use client";

import { useQuery } from "@tanstack/react-query";

import { useContractContext } from "@/lib/blockchain/react";

import { CapsuleCard } from "../_components/capsule";

export default function ParticipatedCapsulesPage() {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();

  const participatedCapsules = useQuery({
    queryKey: ["participatedCapsules"],
    queryFn: async () => {
      if (!walletClient.account) return [];
      const capsules = await vault.read.getParticipatedCapsules();
      return capsules;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="flex h-screen w-full flex-col p-8">
      <h1 className="mb-4 text-2xl font-bold">참여한 타임캡슐</h1>

      {participatedCapsules.isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : !participatedCapsules.data ? (
        <p className="text-secondary-content">참여한 타임캡슐이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {participatedCapsules.data.map((capsule) => (
            <CapsuleCard
              capsule={capsule}
              participated={true}
              key={capsule.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
