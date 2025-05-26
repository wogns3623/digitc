const PEM_HEADER = "-----BEGIN PRIVATE KEY-----";
const PEM_FOTTER = "-----END PRIVATE KEY-----";
export function wrapPem(key: string) {
  // TODO: Check already wrapped
  return [PEM_HEADER, key, PEM_FOTTER].join("\n");
}
export function unwrapPem(pem: string) {
  // TODO: Check already unwrapped
  if (!pem.startsWith(PEM_HEADER) || !pem.endsWith(PEM_FOTTER)) {
    throw new Error("Invalid PEM format");
  }
  return pem.substring(PEM_HEADER.length, pem.length - PEM_FOTTER.length - 1);
}
