"use client";

import { useState } from "react";

type CopyInviteFieldProps = {
  value: string;
};

export function CopyInviteField({ value }: CopyInviteFieldProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Invite link
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={value}
          className="min-w-0 flex-1 rounded-2xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-2xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}