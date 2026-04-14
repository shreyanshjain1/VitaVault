export function getFocusedCardClass(focus: string | null | undefined, id: string) {
  if (!focus || focus !== id) return "";
  return "ring-2 ring-primary/30 border-primary/60 bg-primary/5 shadow-sm shadow-primary/10";
}
