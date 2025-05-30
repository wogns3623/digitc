import { Vault } from "@/lib/blockchain/contracts";
import { useAccount } from "@/lib/blockchain/react";

import { EncryptDataFooter } from "./EncryptDataFooter";
import { OpenCapsuleFooter } from "./OpenCapsuleFooter";
import { ParticipateFooter } from "./ParticipateFooter";
import { SubmitPrivateKeyFooter } from "./SubmitPrivateKeyFooter";

export function CapsuleFooter({
  capsule,
  participated,
}: {
  capsule: Vault.Capsule;
  participated: boolean;
}) {
  const account = useAccount();

  const isOwner = account.address === capsule.owner;

  if (capsule.status === Vault.CapsuleStatus.Registered) {
    if (isOwner) return <EncryptDataFooter capsule={capsule} />;
    else if (!participated) return <ParticipateFooter capsule={capsule} />;
  } else if (capsule.status === Vault.CapsuleStatus.Encrypted) {
    if (participated) return <SubmitPrivateKeyFooter capsule={capsule} />;
  } else if (capsule.status === Vault.CapsuleStatus.Decrypted) {
    if (isOwner) return <OpenCapsuleFooter capsule={capsule} />;
  }

  return null;
}
