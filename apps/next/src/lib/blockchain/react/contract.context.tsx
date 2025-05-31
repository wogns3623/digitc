"use client";

// Since QueryClientProvider relies on useContext under the hood, we have to put 'use client' on top
import {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useReadLocalStorage } from "usehooks-ts";
import { Account, getContract, GetContractReturnType, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getClient } from "@/lib/blockchain";
import { Vault } from "@/lib/blockchain/contracts";

const ContractContext = createContext<{
  client: ReturnType<typeof getClient>;
  account: Account | null;
  setAccount: Dispatch<Account | null>;
  contracts: {
    vault: GetContractReturnType<
      typeof Vault.abi,
      ReturnType<typeof getClient>,
      typeof Vault.address
    >;
  };
} | null>(null);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [account, setAccountRaw] = useState<Account | null>(() => {
    try {
      if (typeof window === "undefined") return null;

      const localAccount = localStorage.getItem("accountPrivateKey");
      if (!localAccount) return null;

      const { privateKey } = JSON.parse(localAccount) as { privateKey: Hex };

      return privateKeyToAccount(privateKey);
    } catch (error) {
      console.error("Failed to parse account from local storage:", error);
      return null;
    }
  });

  const [client, setClient] = useState(() => getClient(account ?? undefined));

  const vault = useMemo(() => {
    return getContract({ address: Vault.address, abi: Vault.abi, client });
  }, [client]);

  const setAccount = useCallback((account: Account | null) => {
    setAccountRaw(account);
    setClient(getClient(account ?? undefined));
  }, []);

  return (
    <ContractContext
      value={{ client, account, setAccount, contracts: { vault } }}
    >
      {children}
    </ContractContext>
  );
}

export function useContractContext() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error(
      "useContractContext must be used within a ContractProvider",
    );
  }

  return context;
}

export const AccountContext = createContext<Account | null>(null);

export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("account is not exists");

  return account;
}

export function useBalance() {
  const { client } = useContractContext();
  const account = useAccount();
  const balance = useQuery({
    queryKey: ["balance", account.address],
    queryFn: async () => {
      const balance = await client.getBalance({ address: account.address });

      return balance;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    initialData: null,
    staleTime: 10000, // Data is fresh for 10 seconds
  });

  return balance;
}
