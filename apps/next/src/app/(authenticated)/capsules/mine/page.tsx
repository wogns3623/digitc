"use client";

import { useQuery } from "@tanstack/react-query";

import { useContractContext } from "@/lib/blockchain/react";

import { CapsuleCard } from "../_components/capsule";

export default function MyCapsulesPage() {
  const {
    contracts: { vault },
  } = useContractContext();

  const capsules = useQuery({
    queryKey: ["myCapsules"],
    queryFn: async () => {
      const capsules = await vault.read.getMyCapsules();
      return capsules;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="flex h-screen w-full flex-col items-center p-8">
      <h1 className="mb-4 text-2xl font-bold">내 타임캡슐</h1>

      {capsules.isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : !capsules.data || capsules.data.length === 0 ? (
        <p className="text-base-content/70">타임캡슐이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {capsules.data.map((capsule) => (
            <CapsuleCard capsule={capsule} key={capsule.id} />
          ))}
        </ul>
      )}
    </div>
  );
}
