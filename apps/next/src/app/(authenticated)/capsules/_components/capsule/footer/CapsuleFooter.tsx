import dayjs from "dayjs";

import { Vault } from "@/lib/blockchain/contracts";
import { useAssertedAccount } from "@/lib/blockchain/react";

import { EncryptDataFooter } from "./EncryptDataFooter";
import { OpenCapsuleFooter } from "./OpenCapsuleFooter";
import { ParticipateFooter } from "./ParticipateFooter";
import { SubmitPrivateKeyFooter } from "./SubmitPrivateKeyFooter";

export function CapsuleFooter({
  capsule,
  participant,
}: {
  capsule: Vault.Capsule;
  participant?: Vault.Participant;
}) {
  const account = useAssertedAccount();

  const isOwner = account.address === capsule.owner;
  const isParticipant = participant && account.address === participant.addr;
  const isReleased =
    dayjs.unix(Number(capsule.releasedAt)).diff(dayjs(), "seconds") <= 0;
  const alreadySubmitted = participant && BigInt(participant.privateKey) > 0n;

  if (capsule.status === Vault.CapsuleStatus.Registered) {
    if (isOwner) return <EncryptDataFooter capsule={capsule} />;
    else if (!isParticipant) return <ParticipateFooter capsule={capsule} />;
  } else if (capsule.status === Vault.CapsuleStatus.Encrypted) {
    if (isParticipant && isReleased)
      return <SubmitPrivateKeyFooter capsule={capsule} />;
  } else if (capsule.status === Vault.CapsuleStatus.Decrypted) {
    if (isParticipant && !alreadySubmitted)
      return <SubmitPrivateKeyFooter capsule={capsule} />;
    if (isOwner) return <OpenCapsuleFooter capsule={capsule} />;
  }

  return null;
}
