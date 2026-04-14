export function getFocusedCardClass(
  focusedId: string | null | undefined,
  recordId: string,
): string {
  if (!focusedId || focusedId !== recordId) {
    return "";
  }

  return "ring-2 ring-primary/40 border-primary/50 bg-primary/5";
}

export function buildRecordHref(basePath: string, recordId: string): string {
  const normalizedBase = basePath.includes("?") ? basePath.split("?")[0] : basePath;
  return `${normalizedBase}?focus=${encodeURIComponent(recordId)}#item-${encodeURIComponent(recordId)}`;
}
