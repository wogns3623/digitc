export function downloadFileViaLink(url: string, filename = "") {
  const link = document.createElement("a");
  link.href = url;
  link.style.display = "none";
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    link.remove();
  }, 3e4);
}

export function downloadFileViaBlob(blob: Blob, filename = "") {
  const objectUrl = URL.createObjectURL(blob);
  downloadFileViaLink(objectUrl, filename);
}
