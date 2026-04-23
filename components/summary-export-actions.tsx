"use client";

import { FileText, Printer, Sparkles } from "lucide-react";

export function SummaryExportActions() {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95 hover:shadow-md"
      >
        <Printer className="h-4 w-4" />
        Print this page
      </button>
      <a
        href="/summary/print"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition hover:border-border hover:bg-muted/60"
      >
        <FileText className="h-4 w-4" />
        Standard PDF view
      </a>
      <a
        href="/summary/print?mode=compact&autoprint=1"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition hover:border-border hover:bg-muted/60"
      >
        <Sparkles className="h-4 w-4" />
        Compact auto-print PDF
      </a>
    </div>
  );
}
