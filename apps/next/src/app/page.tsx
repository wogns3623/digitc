"use client";

import { useState } from "react";

import { redirect } from "next/navigation";
import { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { knownAccounts } from "@/lib/blockchain";
import { useContractContext } from "@/lib/blockchain/react";

export default function HomePage() {
  const { setAccount } = useContractContext();
  const [localAccount, setLocalAccount] = useState<{ privateKey: Hex } | null>(
    null,
  );

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <section className="flex flex-col items-center space-y-4 p-8">
        <select
          value={localAccount ? localAccount.privateKey : "지갑 계정 선택"}
          className="select w-full"
          onChange={(e) => {
            if (e.target.value === "지갑 계정 선택") return;

            const privateKey = e.target.value as Hex;
            const account = privateKeyToAccount(privateKey);
            setAccount(account);
            setLocalAccount({ privateKey });
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
          disabled={localAccount === null}
          className="btn btn-primary mt-4 w-full"
          onClick={() => {
            if (localAccount) redirect("/capsules");
          }}
        >
          로그인
        </button>
      </section>
    </div>
  );
}
