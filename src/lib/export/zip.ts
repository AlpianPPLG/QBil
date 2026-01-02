export function safeFilename(name: string) {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 160);
}

export function batchZipName(prefix: string) {
  const date = new Date().toISOString().slice(0, 10);
  return safeFilename(`${prefix}-${date}`);
}

