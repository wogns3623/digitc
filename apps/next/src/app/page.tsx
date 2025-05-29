"use client";

import { redirect } from "next/navigation";

import { useContractContext } from "@/lib/blockchain/react";

export default function HomePage() {
  const { walletClient } = useContractContext();
  if (walletClient.account) redirect("/capsules");

  return <div>지갑 계정이 연결되어있지 않습니다.</div>;
}
