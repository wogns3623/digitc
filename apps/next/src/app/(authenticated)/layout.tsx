import { redirect } from "next/navigation";

import { AccountProvider, useContractContext } from "@/lib/blockchain/react";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { walletClient } = useContractContext();
  if (!walletClient.account) redirect("/");

  return (
    <AccountProvider account={walletClient.account}>{children}</AccountProvider>
  );
}
