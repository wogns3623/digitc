import { bytesToString, stringToBytes } from "viem";

function ab2str(buf: ArrayBuffer) {
  return bytesToString(new Uint8Array(buf));
}
// function ab2str(buf) {
//   return String.fromCharCode.apply(null, new Uint8Array(buf));
// }
function toBase64(str: string) {
  if (typeof window !== "undefined") return window.btoa(str);

  return Buffer.from(str, "utf-8").toString("base64");
}
export function arrayBufferToBase64(buf: ArrayBuffer) {
  return toBase64(ab2str(buf));
}

function fromBase64(base64: string) {
  if (typeof window !== "undefined") return window.atob(base64);

  return Buffer.from(base64, "base64").toString("utf-8");
}
function str2ab(str: string) {
  return stringToBytes(str);
}
// function str2ab(str: string) {
//   const buf = new ArrayBuffer(str.length);
//   const bufView = new Uint8Array(buf);
//   for (let i = 0, strLen = str.length; i < strLen; i++) {
//     bufView[i] = str.charCodeAt(i);
//   }
//   return buf;
// }
export function base64ToArrayBuffer(base64: string) {
  return str2ab(fromBase64(base64));
}
