import Image from "next/image";
import Link from "next/link";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <Image
            src="/brand/erebrus-mark.png"
            alt=""
            width={24}
            height={24}
            className="rounded-[7px]"
          />
          <span className="text-sm text-[var(--text-3)]">
            Erebrus © {year} NetSepio LLC. All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href="/privacy" className="text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)]">
            Privacy
          </Link>
          <Link href="/terms" className="text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)]">
            Terms
          </Link>
          <Link href="/contact" className="text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)]">
            Contact
          </Link>
          <a
            href="https://docs.netsepio.com/erebrus/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)]"
          >
            Docs
          </a>
          <a
            href="https://x.com/NetSepio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)]"
          >
            X / Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}