import { UseQueryResult } from "@tanstack/react-query";

import { Vault } from "@/lib/blockchain/contracts";

import { CapsuleCard } from "./CapsuleCard";

export function CapsuleList({
  capsules,
  notFoundMessage = "타임캡슐이 없습니다.",
}: {
  capsules: UseQueryResult<
    ReadonlyArray<Vault.Capsule & { participant?: Vault.Participant }>
  >;
  notFoundMessage?: string;
}) {
  return (
    <section>
      {capsules.isPending ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : capsules.isError ? (
        <div>
          <p className="text-base-content/70">
            타임캡슐을 불러오는 데 실패했습니다.
          </p>

          <button
            className="btn btn-primary mt-4"
            onClick={() => capsules.refetch()}
          >
            재시도
          </button>
        </div>
      ) : capsules.data.length === 0 ? (
        <p className="text-base-content/70">{notFoundMessage}</p>
      ) : (
        <ul className="space-y-2">
          {capsules.data.map(({ participant, ...capsule }) => (
            <CapsuleCard
              capsule={capsule}
              participant={participant}
              key={capsule.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
