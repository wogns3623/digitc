import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Abi, ContractFunctionName } from "viem";
import { useAccount } from "wagmi";
import { readContractQueryKey } from "wagmi/query";

import { contracts } from "@/lib/blockchain";
import { useAssertedAccount } from "@/lib/blockchain/react";

export function useReadContractInvalidation<
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "pure" | "view">,
>({
  abi,
  address,
  functionName,
}: {
  abi: abi;
  address?: string;
  functionName: functionName;
}) {
  const queryClient = useQueryClient();
  const account = useAccount();
  const capsuleQueryKey = readContractQueryKey({
    abi,
    address,
    functionName,
    account: account.address,
  } as any);

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: capsuleQueryKey });
  }, [queryClient, capsuleQueryKey]);
}

export function useCapsulesQueryInvalidation() {
  const invalidateGetMyCapsulesQueries = useReadContractInvalidation({
    ...contracts.Vault,
    functionName: "getMyCapsules",
  });
  const invalidateGetAvailableCapsulesQueries = useReadContractInvalidation({
    ...contracts.Vault,
    functionName: "getAvailableCapsules",
  });
  const invalidateGetParticipatedCapsulesQueries = useReadContractInvalidation({
    ...contracts.Vault,
    functionName: "getParticipatedCapsules",
  });
  return useCallback(() => {
    invalidateGetMyCapsulesQueries();
    invalidateGetAvailableCapsulesQueries();
    invalidateGetParticipatedCapsulesQueries();
  }, []);
}
