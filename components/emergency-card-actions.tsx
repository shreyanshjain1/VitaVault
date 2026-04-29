"use client";

import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function EmergencyCardActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print current page
      </Button>
      <Link
        href="/emergency-card/print?autoprint=1"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:bg-muted/60"
      >
        <Download className="h-4 w-4" />
        Open print card
      </Link>
    </div>
  );
}
