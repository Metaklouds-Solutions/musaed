"use client";

import Link from "next/link";
import type { Dictionary } from "@/lib/dictionaries";

export default function LanguageToggle({
  locale,
  dict,
}: {
  locale: "ar" | "en";
  dict: Dictionary;
}) {
  return (
    <div className="flex items-center gap-2 text-sm" role="group" aria-label="Language">
      {locale === "ar" ? (
        <>
          <span className="font-semibold text-primary" aria-current="true">
            {dict.languageToggle.ar}
          </span>
          <span className="text-muted" aria-hidden="true">|</span>
          <Link
            href="/en"
            className="text-muted transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            aria-label="Switch to English"
          >
            {dict.languageToggle.en}
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/ar"
            className="text-muted transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            aria-label="Switch to Arabic"
          >
            {dict.languageToggle.ar}
          </Link>
          <span className="text-muted" aria-hidden="true">|</span>
          <span className="font-semibold text-primary" aria-current="true">
            {dict.languageToggle.en}
          </span>
        </>
      )}
    </div>
  );
}
