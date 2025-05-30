"use client";

import { redirect } from "next/navigation";
import { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { knownAccounts } from "@/lib/blockchain";
import { useContractContext } from "@/lib/blockchain/react";

export default function HomePage() {
  const { account, setAccount } = useContractContext();

  const foundAccount = knownAccounts.find(
    (knownAccount) => knownAccount.publicKey === account?.publicKey,
  );

  console.log(account, foundAccount);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <section className="flex flex-col items-center space-y-4 p-8">
        <select
          defaultValue={
            foundAccount ? foundAccount.privateKey : "지갑 계정 선택"
          }
          className="select w-full"
          onChange={(e) => {
            const privateKey = e.target.value;
            if (privateKey === "지갑 계정 선택") return;
            const account = privateKeyToAccount(privateKey as Hex);
            setAccount(account);
          }}
        >
          <option disabled={true}>지갑 계정 선택</option>
          {knownAccounts.map((account) => (
            <option key={account.publicKey} value={account.privateKey}>
              {account.publicKey}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={!account}
          className="btn btn-primary mt-4 w-full"
          onClick={() => {
            if (account) redirect("/capsules");
          }}
        >
          로그인
        </button>
      </section>
    </div>
  );
}
