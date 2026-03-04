import Link from "next/link";
import type { Dictionary } from "@/lib/dictionaries";

export default function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer
      className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8"
      role="contentinfo"
      style={{
        background: "rgba(248, 250, 249, 0.45)",
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
      }}
    >
      <div className="section-glow-divider absolute top-0 left-0 right-0" />
      <div className="floating-blob floating-blob-mint w-[240px] h-[240px] -bottom-24 right-0 opacity-40" aria-hidden="true" />

      <div className="mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <span className="text-lg font-bold gradient-text">Mosaed</span>
            <p className="mt-1 text-sm text-muted">{dict.footer.tagline}</p>
          </div>
          <nav
            className="flex flex-wrap items-center justify-center gap-6"
            aria-label="Footer"
          >
            <Link
              href="#"
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              {dict.footer.privacy}
            </Link>
            <Link
              href="#"
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              {dict.footer.terms}
            </Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2 pt-8 text-center sm:flex-row sm:justify-between">
          <div className="section-glow-divider absolute left-4 right-4" style={{ top: "calc(100% - 4rem - 2rem)" }} />
          <p className="text-sm text-muted">{dict.footer.cr}</p>
          <p className="text-sm text-muted">{dict.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
