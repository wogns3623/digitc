import { getWalletClient } from "@/lib/blockchain";
import { redirect } from "next/navigation";
import { useState } from "react";
import { WalletClient } from "viem";

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //   const [walletClient] = useState<WalletClient>(() => getWalletClient());
  //   if (!walletClient.account) redirect("/");

  return <>{children}</>;
}
