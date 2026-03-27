"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const LOCALES = [
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "en", label: "EN", flag: "🇺🇸" },
] as const;

export function LanguageSelector() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const switchLocale = (code: string) => {
    setOpen(false);
    // Replace the locale segment in the pathname
    const segments = pathname.split("/");
    if (segments[1] === "zh-CN" || segments[1] === "en") {
      segments[1] = code;
    } else {
      segments.splice(1, 0, code);
    }
    router.push(segments.join("/") || "/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={t("common.language")}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-md border border-border bg-background py-1 shadow-md">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-accent ${
                l.code === locale ? "bg-accent font-medium text-accent-foreground" : "text-foreground"
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
