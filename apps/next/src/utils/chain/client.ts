import { Client, createPublicClient, createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";
import hre from "hardhat";

export async function getPublicClient(): Promise<Client> {
  if (process.env.NODE_ENV !== "production") {
    return await hre.viem.getPublicClient();
  }

  throw new Error("Production environment not supported yet.");
  // return createPublicClient({
  //   chain: mainnet,
  //   transport: http(),
  // });
}

export async function getClient(): Promise<{ public: Client; wallet: Client }> {
  if (process.env.NODE_ENV !== "production") {
    const publicClient = await hre.viem.getPublicClient();
    const walletClients = await hre.viem.getWalletClients();

    return {
      public: publicClient,
      wallet: walletClients[0],
    };
  }

  throw new Error("Production environment not supported yet.");
  //   const publicClient = createPublicClient({
  //     chain: mainnet,
  //     transport: http(),
  //   });

  //   const walletClient = createWalletClient({
  //     chain: mainnet,

  //     transport: http("https://1.rpc.thirdweb.com/..."),
  //   });

  //   return {
  //     public: publicClient,
  //     wallet: walletClient,
  //   };
}
