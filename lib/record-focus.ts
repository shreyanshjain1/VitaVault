export function buildRecordHref(path: string, id: string) {
  return `${path}?focus=${id}#item-${id}`;
}

export function getFocusedCardClass(focusId: string | undefined, recordId: string) {
  return focusId === recordId
    ? "scroll-mt-28 border-primary/60 bg-primary/5 ring-2 ring-primary/40"
    : "scroll-mt-28";
}
