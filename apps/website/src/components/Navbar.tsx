"use client";

import Link from "next/link";
import { Headset } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import LanguageToggle from "./LanguageToggle";

export default function Navbar({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: "ar" | "en";
}) {
  return (
    <div className="sticky top-0 z-50 w-full flex justify-center px-4 pt-3 pb-1">
      <nav
        className="glass-card w-full max-w-5xl flex h-14 items-center justify-between gap-4 px-5 sm:px-6"
        role="navigation"
        aria-label="Main"
        style={{ borderRadius: "9999px" }}
      >
        <Link href={`/${locale}`} className="flex items-center shrink-0 group">
          <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-white/40 text-primary transition-all group-hover:bg-primary/15 group-hover:shadow-md">
            <Headset size={15} strokeWidth={2.2} />
          </span>
          <span className="text-lg font-bold text-primary">Mosaed</span>
          <span className="ml-1.5 text-sm font-normal text-muted" dir="rtl">
            مساعد
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageToggle locale={locale} dict={dict} />
          <Link
            href="#final-cta"
            className="btn-liquid inline-flex min-h-[36px] min-w-[44px] items-center justify-center px-5 py-2 text-sm font-semibold text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            style={{ borderRadius: "9999px" }}
          >
            {dict.nav.cta}
          </Link>
        </div>
      </nav>
    </div>
  );
}
