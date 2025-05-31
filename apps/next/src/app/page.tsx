"use client";

import Image from "next/image";
import Link from "next/link";
import { useAccount, useConnect } from "wagmi";
import { useDisconnect, useEnsAvatar, useEnsName } from "wagmi";

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="flex h-screen w-full items-center justify-center">
      {isConnected ? <Account /> : <WalletOptions />}
    </div>
  );
}

function WalletOptions() {
  const { connectors, connect } = useConnect();

  return connectors.map((connector) => (
    <button
      className="btn"
      key={connector.uid}
      onClick={() => connect({ connector })}
    >
      {connector.name}
    </button>
  ));
}

function Account() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  return (
    <div>
      {ensAvatar && <Image alt="ENS Avatar" src={ensAvatar} />}
      {address && <div>{ensName ? `${ensName} (${address})` : address}</div>}

      <div className="flex space-x-2">
        <Link className="btn flex-1" href="/capsules">
          타임캡슐 페이지로 이동
        </Link>
        <button className="btn flex-1" onClick={() => disconnect()}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
