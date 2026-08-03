import Link from "next/link";
import type { ReactNode } from "react";
import { Facebook, Github, Mail } from "lucide-react";

function XIcon({ className }: { className?: string }) { return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>; }
function Social({ href, label, children }: { href: string; label: string; children: ReactNode }) { return <a href={href} aria-label={label} title={label} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-[var(--text-3)] transition-colors hover:text-[var(--text)]">{children}</a>; }

const columns = [
  { title: "Products", links: [["VPN", "/vpn"], ["Firewall", "/firewall"], ["Private AI", "/ai"], ["Drop", "/drop"]] },
  { title: "Solutions", links: [["Digital Nomads", "/digital-nomads"], ["Families", "/families"], ["Businesses", "/business"]] },
  { title: "Network", links: [["Explorer", "/dashboard"], ["Run a Node", "/#operators"], ["Documentation", "https://docs.netsepio.com/erebrus/"]] },
  { title: "Company", links: [["NetSepio", "https://netsepio.com"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Account Deletion", "/account-deletion"]] },
] as const;

export function MarketingFooter() {
  return <footer className="border-t border-white/[0.06] px-4 py-12 md:px-8">
    <div className="mx-auto max-w-[1180px]">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
        {columns.map((column) => <div key={column.title}><h2 className="text-sm font-semibold">{column.title}</h2><ul className="mt-4 space-y-3">{column.links.map(([label, href]) => <li key={href}>{href.startsWith("http") ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-3)] hover:text-[var(--text-2)]">{label}</a> : <Link href={href} className="text-sm text-[var(--text-3)] hover:text-[var(--text-2)]">{label}</Link>}</li>)}</ul></div>)}
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-white/[0.06] pt-7 sm:flex-row">
        <div><p className="text-sm text-[var(--text-2)]">Erebrus is built by NetSepio.</p><p className="mt-1 text-xs text-[var(--text-3)]">Erebrus © {new Date().getFullYear()} NetSepio LLC. All rights reserved.</p></div>
        <div className="flex items-center gap-4"><Social href="https://x.com/NetSepio" label="NetSepio on X"><XIcon className="h-[17px] w-[17px]" /></Social><Social href="https://facebook.com/netsepio" label="NetSepio on Facebook"><Facebook className="h-[18px] w-[18px]" /></Social><Social href="https://github.com/NetSepio" label="NetSepio on GitHub"><Github className="h-[18px] w-[18px]" /></Social><Social href="mailto:support@netsepio.com" label="Email support"><Mail className="h-[18px] w-[18px]" /></Social></div>
      </div>
    </div>
  </footer>;
}
