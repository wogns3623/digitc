"use client";

import { redirect } from "next/navigation";
import { useAccount } from "wagmi";

import { AssertedAccountContext } from "@/lib/blockchain/react";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const account = useAccount();
  if (!account.isConnected) redirect("/");

  if (account.isReconnecting) {
    return (
      <div>
        <p className="text-center text-lg">Reconnecting...</p>
        <p className="text-center text-sm">Please wait...</p>
      </div>
    );
  }

  return (
    <AssertedAccountContext value={account}>{children}</AssertedAccountContext>
  );
}
