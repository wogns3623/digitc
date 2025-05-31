// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VaultModule = buildModule("VaultModule", (m) => {
  const ParticipantsLib = m.library("ParticipantsLib");
  // const EllipticCurve = m.library("EllipticCurve");
  const Vault = m.contract("Vault", [], {
    libraries: {
      ParticipantsLib,
      // EllipticCurve
    },
  });

  return { Vault };
});

export default VaultModule;
