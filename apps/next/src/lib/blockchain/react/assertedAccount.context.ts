"use client";

// Since QueryClientProvider relies on useContext under the hood, we have to put 'use client' on top
import { createContext, useContext } from "react";

import { Prettify } from "viem";
import { UseAccountReturnType } from "wagmi";

export type AssertedAccount = Prettify<
  UseAccountReturnType & { status: "connected" }
>;

export const AssertedAccountContext = createContext<AssertedAccount | null>(
  null,
);

export function useAssertedAccount() {
  const account = useContext(AssertedAccountContext);
  if (!account) throw new Error("account is not exists");

  return account;
}
