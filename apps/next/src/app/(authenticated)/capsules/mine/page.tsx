"use client";

import { useQuery } from "@tanstack/react-query";

import { useContractContext } from "@/lib/blockchain/react";

import { CapsuleCard } from "../_components/capsule";

export default function MyCapsulesPage() {
  const {
    walletClient,
    contracts: { vault },
  } = useContractContext();

  const myCapsules = useQuery({
    queryKey: ["myCapsules"],
    queryFn: async () => {
      if (!walletClient.account) return [];
      const capsules = await vault.read.getMyCapsules({
        account: walletClient.account,
      });
      return capsules;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="flex h-screen w-full flex-col p-8">
      <h1 className="mb-4 text-2xl font-bold">내 타임캡슐</h1>

      {myCapsules.isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : !myCapsules.data ? (
        <p className="text-secondary-content">타임캡슐이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {myCapsules.data.map((capsule) => (
            <CapsuleCard
              capsule={capsule}
              participated={false}
              key={capsule.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
