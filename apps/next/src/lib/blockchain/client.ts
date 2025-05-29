import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  PublicClient,
  WalletClient,
} from "viem";
import { mainnet, hardhat } from "viem/chains";

export function getPublicClient(): PublicClient {
  if (process.env.NODE_ENV !== "production") {
    return createPublicClient({ chain: hardhat, transport: http() });
  } else {
    return createPublicClient({ chain: mainnet, transport: http() });
  }
}

export function getWalletClient(): WalletClient {
  if (process.env.NODE_ENV !== "production") {
    const account = `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`;

    return createWalletClient({ account, chain: hardhat, transport: http() });
  } else {
    return createWalletClient({
      chain: mainnet,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: custom((window as any).ethereum),
    });
  }
}

export const publicClient = getPublicClient();
export const walletClient = getWalletClient();
