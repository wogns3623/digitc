import { Client, GetContractReturnType, Hex } from "viem";

export const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Hex;
export const abi = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      {
        indexed: false,
        internalType: "bytes32",
        name: "privateKey",
        type: "bytes32",
      },
    ],
    name: "Decrypted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      {
        indexed: false,
        internalType: "bytes32",
        name: "publicKey",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes[]",
        name: "encryptedKeys",
        type: "bytes[]",
      },
    ],
    name: "Encrypted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      {
        indexed: false,
        internalType: "address",
        name: "participant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "publicKey",
        type: "bytes32",
      },
    ],
    name: "Participated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      {
        indexed: false,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      { indexed: false, internalType: "uint256", name: "fee", type: "uint256" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      {
        indexed: false,
        internalType: "uint256",
        name: "createdAt",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "releasedAt",
        type: "uint256",
      },
    ],
    name: "Registered",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "approve",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "bytes32", name: "privateKey", type: "bytes32" },
    ],
    name: "decrypt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "deleteCapsule",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "bytes32", name: "publicKey", type: "bytes32" },
      { internalType: "bytes[]", name: "encryptedKeys", type: "bytes[]" },
    ],
    name: "encrypt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAvailableCapsules",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          {
            internalType: "enum Vault.CapsuleStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "fee", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "releasedAt", type: "uint256" },
          {
            internalType: "uint256",
            name: "participantCount",
            type: "uint256",
          },
          { internalType: "bytes12", name: "iv", type: "bytes12" },
          { internalType: "bytes32", name: "publicKey", type: "bytes32" },
        ],
        internalType: "struct Vault.Capsule[]",
        name: "",
        type: "tuple[]",
      },
      { internalType: "bool[]", name: "", type: "bool[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getCapsule",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          {
            internalType: "enum Vault.CapsuleStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "fee", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "releasedAt", type: "uint256" },
          {
            internalType: "uint256",
            name: "participantCount",
            type: "uint256",
          },
          { internalType: "bytes12", name: "iv", type: "bytes12" },
          { internalType: "bytes32", name: "publicKey", type: "bytes32" },
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
    inputs: [],
    name: "getMyCapsules",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          {
            internalType: "enum Vault.CapsuleStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "fee", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "releasedAt", type: "uint256" },
          {
            internalType: "uint256",
            name: "participantCount",
            type: "uint256",
          },
          { internalType: "bytes12", name: "iv", type: "bytes12" },
          { internalType: "bytes32", name: "publicKey", type: "bytes32" },
        ],
        internalType: "struct Vault.Capsule[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getParticipants",
    outputs: [
      {
        components: [
          { internalType: "address", name: "addr", type: "address" },
          { internalType: "bytes32", name: "publicKey", type: "bytes32" },
          { internalType: "bytes", name: "encryptedKey", type: "bytes" },
          { internalType: "bytes32", name: "privateKey", type: "bytes32" },
          { internalType: "uint256", name: "decryptAt", type: "uint256" },
        ],
        internalType: "struct ParticipantsLib.Participant[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getParticipatedCapsules",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          {
            internalType: "enum Vault.CapsuleStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "fee", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "releasedAt", type: "uint256" },
          {
            internalType: "uint256",
            name: "participantCount",
            type: "uint256",
          },
          { internalType: "bytes12", name: "iv", type: "bytes12" },
          { internalType: "bytes32", name: "publicKey", type: "bytes32" },
        ],
        internalType: "struct Vault.Capsule[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "isParticipated",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "bytes32", name: "publicKey", type: "bytes32" },
    ],
    name: "participate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "title", type: "string" },
      { internalType: "uint256", name: "releasedAt", type: "uint256" },
      { internalType: "bytes12", name: "iv", type: "bytes12" },
    ],
    name: "register",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export type Contract = GetContractReturnType<typeof abi, Client>;
export type Capsule = Awaited<ReturnType<Contract["read"]["getCapsule"]>>;

export enum CapsuleStatus {
  Null,
  Registered,
  Encrypted,
  Decrypted,
  Approved,
}

export const CapsuleStatusLabels = {
  [CapsuleStatus.Null]: "없음",
  [CapsuleStatus.Registered]: "등록됨",
  [CapsuleStatus.Encrypted]: "암호화됨",
  [CapsuleStatus.Decrypted]: "복호화됨",
  [CapsuleStatus.Approved]: "승인됨",
} satisfies Record<CapsuleStatus, string>;
