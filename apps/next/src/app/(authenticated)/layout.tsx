"use client";

import { redirect } from "next/navigation";

import { AccountContext, useContractContext } from "@/lib/blockchain/react";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { account } = useContractContext();
  if (!account) redirect("/");

  return <AccountContext value={account}>{children}</AccountContext>;
}
