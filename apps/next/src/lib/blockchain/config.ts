import { createConfig, http } from "wagmi";
import { mainnet, hardhat } from "wagmi/chains";

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

export const config = createConfig({
  chains: process.env.NODE_ENV !== "production" ? [hardhat] : [mainnet],
  ssr: true,
  transports: { [mainnet.id]: http(), [hardhat.id]: http() },
});
