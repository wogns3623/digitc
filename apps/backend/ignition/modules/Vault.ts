// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultModule = buildModule("VaultModule", (m) => {
  const participantsLib = m.library("ParticipantsLib");
  const vault = m.contract("Vault", [], {
    libraries: { ParticipantsLib: participantsLib },
  });

  return { vault };
});

export default VaultModule;
