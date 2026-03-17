"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, Input } from "@/components/ui";

type CopyInviteFieldProps = {
  value: string;
};

export function CopyInviteField({ value }: CopyInviteFieldProps) {
  const [copied, setCopied] = useState(false);

  const displayValue = useMemo(() => value.trim(), [value]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground/90">Invite link</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input readOnly value={displayValue} className="font-mono text-xs" />
        <Button
          type="button"
          variant={copied ? "secondary" : "outline"}
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy link
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Share this link with the exact email recipient. They must sign in using the same email to accept.
      </p>
    </div>
  );
}