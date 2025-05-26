import { Abi } from "viem";

export const wagmiContract = {
  address: process.env.CONTRACT_ADDRESS as `0x${string}`,
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "string",
          name: "decryptionKey",
          type: "string",
        },
      ],
      name: "Decrypted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "string",
          name: "encryptionKey",
          type: "string",
        },
      ],
      name: "Encrypted",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "participantAddr",
          type: "address",
        },
        {
          indexed: false,
          internalType: "string",
          name: "publicKey",
          type: "string",
        },
      ],
      name: "Participated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "participant",
          type: "address",
        },
        {
          indexed: false,
          internalType: "string",
          name: "encryptedKey",
          type: "string",
        },
      ],
      name: "RequestDecrypt",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          internalType: "string",
          name: "encryptionKey",
          type: "string",
        },
        {
          internalType: "string[]",
          name: "encryptedKeys",
          type: "string[]",
        },
      ],
      name: "addEncryptionKey",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          internalType: "string",
          name: "decryptionKey",
          type: "string",
        },
      ],
      name: "decrypt",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
      ],
      name: "getCapsule",
      outputs: [
        {
          components: [
            {
              internalType: "enum Vault.CapsuleStatus",
              name: "status",
              type: "uint8",
            },
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "fee",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "createdAt",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "releasedAt",
              type: "uint256",
            },
            {
              internalType: "string",
              name: "encryptionKey",
              type: "string",
            },
            {
              internalType: "string",
              name: "decryptionKey",
              type: "string",
            },
          ],
          internalType: "struct Vault.Capsule",
          name: "",
          type: "tuple",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
      ],
      name: "getParticipants",
      outputs: [
        {
          components: [
            {
              internalType: "address",
              name: "addr",
              type: "address",
            },
            {
              internalType: "string",
              name: "publicKey",
              type: "string",
            },
            {
              internalType: "string",
              name: "encryptedKey",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "decryptedAt",
              type: "uint256",
            },
          ],
          internalType: "struct Vault.Participant[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
        {
          internalType: "string",
          name: "publicKey",
          type: "string",
        },
      ],
      name: "participate",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "releasedAt",
          type: "uint256",
        },
      ],
      name: "register",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
      ],
      name: "requestDecrypt",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const,
} satisfies {
  address: `0x${string}`;
  abi: Abi;
};
