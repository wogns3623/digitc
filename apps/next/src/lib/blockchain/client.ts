import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  http,
  PublicClient,
  WalletClient,
  webSocket,
} from "viem";
import { mainnet } from "viem/chains";

const localChain = defineChain({
  id: 7777777,
  name: "Local Chain 1",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [`https://127.0.0.1:${process.env.NEXT_PUBLIC_RPC_PORT}`],
      webSocket: [`ws://127.0.0.1:${process.env.NEXT_PUBLIC_RPC_PORT}`],
    },
  },
  // blockExplorers: {
  //   default: { name: "Explorer", url: "https://explorer.zora.energy" },
  // },
  // contracts: {
  //   multicall3: {
  //     address: "0xcA11bde05977b3631167028862bE2a173976CA11",
  //     blockCreated: 5882,
  //   },
  // },
});

let publicClient: PublicClient | null = null;

export function getPublicClient(): PublicClient {
  if (publicClient) return publicClient;

  if (process.env.NODE_ENV !== "production") {
    publicClient = createPublicClient({
      chain: localChain,
      transport: webSocket(),
    });
  } else {
    publicClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });
  }

  return publicClient;
}

let walletClient: WalletClient | null = null;
export function getWalletClient(): WalletClient {
  if (walletClient) return walletClient;

  if (process.env.NODE_ENV !== "production") {
    const account = `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`;

    walletClient = createWalletClient({
      account,
      chain: localChain,
      transport: webSocket(),
    });
  } else {
    walletClient = createWalletClient({
      chain: mainnet,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: custom((window as any).ethereum),
    });
  }

  return walletClient;
}
