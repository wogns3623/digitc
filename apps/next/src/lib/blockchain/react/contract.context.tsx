"use client";

// Since QueryClientProvider relies on useContext under the hood, we have to put 'use client' on top
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useEffect, useState } from "react";

import { Account, getContract } from "viem";

import { publicClient, walletClient } from "@/lib/blockchain";
import { Vault } from "@/lib/blockchain/contracts";

const ContractContext = createContext({
  publicClient,
  walletClient,
  contracts: {
    vault: getContract({
      address: Vault.address,
      abi: Vault.abi,
      client: { public: publicClient, wallet: walletClient },
    }),
  },
});

export function ContractProvider({ children }: { children: ReactNode }) {
  const vault = useMemo(() => {
    return getContract({
      address: Vault.address,
      abi: Vault.abi,
      client: { public: publicClient, wallet: walletClient },
    });
  }, []);

  return (
    <ContractContext
      value={{ publicClient, walletClient, contracts: { vault } }}
    >
      {children}
    </ContractContext>
  );
}

export function useContractContext() {
  return useContext(ContractContext);
}

const AccountContext = createContext<Account | null>(null);
export function AccountProvider({
  account,
  children,
}: {
  account: Account;
  children: ReactNode;
}) {
  return <AccountContext value={account}>{children}</AccountContext>;
}

export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("useAccount must be with AccountProvider!");

  return account;
}

export function useBalance() {
  const { publicClient } = useContractContext();
  const account = useAccount();
  const [balance, setBalance] = useState<bigint | null>();

  const getBalance = useCallback(async () => {
    const balance = await publicClient.getBalance({ address: account.address });

    setBalance(balance);
  }, [publicClient, account]);

  useEffect(() => {
    void getBalance();
    // const interval = setInterval(async () => {
    //   const balance = await getBalance();
    //   setBalance(balance);
    // }, 10000); // Refresh every 10 seconds

    // return () => clearInterval(interval);
  }, [getBalance]);

  return balance;
}
