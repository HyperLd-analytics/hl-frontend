"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  displayValue?: string;
}

export function CopyButton({ value, className, displayValue }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors",
        copied
          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          : "bg-muted text-muted-foreground hover:bg-muted/80",
        className
      )}
    >
      {copied ? "✓ Copied" : (displayValue ?? value.slice(0, 6) + "..." + value.slice(-4))}
    </button>
  );
}
