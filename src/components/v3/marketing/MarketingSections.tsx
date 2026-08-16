import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { AuthModalTrigger } from "@/components/v3/AuthModal";
import { AccentButton, Card, Eyebrow } from "@/components/v3/ui";
import { cn } from "@/lib/utils";

export function MarketingButtonLink({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "ghost"; className?: string }) {
  if (href === "#app") return <AuthModalTrigger><AccentButton variant={variant} className={className}>{children}</AccentButton></AuthModalTrigger>;
  return <Link href={href}><AccentButton variant={variant} className={className}>{children}</AccentButton></Link>;
}

export function SolutionHero({ eyebrow, title, body, primary, secondary, note, visual, compactVisual = false }: { eyebrow: string; title: string; body: string; primary: { label: string; href: string }; secondary: { label: string; href: string }; note?: string; visual?: ReactNode; compactVisual?: boolean }) {
  return <section className={cn("mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 md:px-8 md:py-20", compactVisual ? "lg:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)] lg:gap-16" : "md:grid-cols-2")}>
    <div><Eyebrow className="mb-4">{eyebrow}</Eyebrow><h1 className="text-4xl font-bold leading-[1.02] tracking-[-0.04em] md:text-[64px]">{title}</h1><p className="mt-6 max-w-[600px] text-lg leading-relaxed text-[var(--text-2)]">{body}</p><div className="mt-8 flex flex-wrap gap-3"><MarketingButtonLink href={primary.href} className="!px-6 !py-4">{primary.label}<ArrowRight size={17} /></MarketingButtonLink><MarketingButtonLink href={secondary.href} variant="ghost" className="!px-6 !py-4">{secondary.label}</MarketingButtonLink></div>{note && <p className="mt-5 text-sm leading-relaxed text-[var(--text-3)]">{note}</p>}</div>
    {compactVisual ? <div className="w-full max-w-[420px] justify-self-center lg:justify-self-end">{visual ?? <VisualPlaceholder label={eyebrow} />}</div> : visual ?? <VisualPlaceholder label={eyebrow} />}
  </section>;
}

export function VisualPlaceholder({ label, children }: { label: string; children?: ReactNode }) {
  return <Card className="relative flex min-h-[360px] overflow-hidden p-8 md:min-h-[480px]" style={{ background: "radial-gradient(circle at 60% 20%, rgba(255,107,53,.18), transparent 38%), linear-gradient(145deg,#15151b,#09090c)" }}><div className="absolute inset-8 rounded-full border border-[var(--accent)]/15" /><div className="absolute inset-20 rounded-full border border-dashed border-white/[0.09]" /><div className="relative z-10 m-auto w-full max-w-sm rounded-2xl border border-white/[0.1] bg-black/30 p-6 backdrop-blur"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent-hi)]"><ShieldCheck /></div><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-[var(--success)]">Protected connection</div><div className="mt-1 font-semibold">{label}</div></div></div>{children ?? <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-3/4 rounded-full bg-[var(--accent)]" /></div>}</div></Card>;
}

export type MarketingCardItem = { title: string; body: string; href?: string; cta?: string; eyebrow?: string };
export function CardGridSection({ eyebrow, title, intro, items, columns = 3, id }: { eyebrow?: string; title: string; intro?: string; items: MarketingCardItem[]; columns?: 2 | 3 | 4; id?: string }) {
  return <section id={id} className="mx-auto max-w-[1180px] px-4 py-16 md:px-8 md:py-20"><div className="mb-10 max-w-3xl"><>{eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}</><h2 className="text-3xl font-bold tracking-tight md:text-[44px]">{title}</h2>{intro && <p className="mt-4 text-lg leading-relaxed text-[var(--text-2)]">{intro}</p>}</div><div className={cn("grid gap-4", columns === 2 && "md:grid-cols-2", columns === 3 && "md:grid-cols-3", columns === 4 && "sm:grid-cols-2 lg:grid-cols-4")}>{items.map((item) => <Card key={item.title} className="p-7">{item.eyebrow && <Eyebrow className="mb-3 !text-[10px]">{item.eyebrow}</Eyebrow>}<h3 className="text-lg font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">{item.body}</p>{item.href && <Link href={item.href} className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--accent-hi)] hover:text-[var(--accent)]">{item.cta ?? "Learn more"}<ArrowRight size={15} /></Link>}</Card>)}</div></section>;
}

export function StepsSection({ eyebrow, title, intro, steps, id }: { eyebrow?: string; title: string; intro?: string; steps: Array<{ title: string; body: string }>; id?: string }) {
  return <section id={id} className="mx-auto max-w-[1180px] px-4 py-16 md:px-8"><div className="mb-10 max-w-3xl">{eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}<h2 className="text-3xl font-bold md:text-[44px]">{title}</h2>{intro && <p className="mt-4 text-[var(--text-2)]">{intro}</p>}</div><ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{steps.map((step, index) => <li key={step.title}><Card className="h-full p-6"><div className="font-mono text-xs text-[var(--accent-hi)]">{String(index + 1).padStart(2, "0")}</div><h3 className="mt-4 text-lg font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{step.body}</p></Card></li>)}</ol></section>;
}

export function FaqSection({ items }: { items: Array<{ question: string; answer: string }> }) {
  return <section className="mx-auto max-w-[880px] px-4 py-16 md:px-8"><Eyebrow className="mb-4">Frequently asked questions</Eyebrow><h2 className="text-3xl font-bold md:text-[44px]">Clear answers before you connect.</h2><div className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">{items.map((item) => <details key={item.question} className="group py-5"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">{item.question}<span className="text-[var(--accent-hi)] group-open:rotate-45">+</span></summary><p className="max-w-3xl pb-2 pr-8 text-sm leading-relaxed text-[var(--text-2)]">{item.answer}</p></details>)}</div></section>;
}

export function FinalCta({ title, body, primary, secondary }: { title: string; body: string; primary: { label: string; href: string }; secondary: { label: string; href: string } }) {
  return <section className="mx-auto max-w-[1180px] px-4 py-16 md:px-8"><Card className="p-8 text-center md:p-14" style={{ background: "radial-gradient(ellipse 70% 130% at 80% 0%, rgba(255,107,53,.14), transparent 60%), linear-gradient(180deg,#131318,#0d0d11)" }}><h2 className="text-3xl font-bold md:text-[42px]">{title}</h2><p className="mx-auto mt-4 max-w-2xl text-[var(--text-2)]">{body}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><MarketingButtonLink href={primary.href}>{primary.label}<ArrowRight size={17} /></MarketingButtonLink><MarketingButtonLink href={secondary.href} variant="ghost">{secondary.label}</MarketingButtonLink></div></Card></section>;
}

export function ProductFlow() {
  const nodes = ["Approved device", "Encrypted VPN", "Erebrus gateway", "Shield or Sentinel", "Internet · private service · AI host"];
  return <div className="grid gap-3 md:grid-cols-5" role="img" aria-label="An approved device connects through an encrypted VPN and Erebrus gateway, where Shield or Sentinel applies protection before traffic reaches an approved destination or private AI host.">{nodes.map((node, index) => <div key={node} className="relative"><div className="flex min-h-24 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.03] p-4 text-center text-sm font-semibold">{node}</div>{index < nodes.length - 1 && <span aria-hidden className="absolute left-1/2 top-full z-10 -translate-x-1/2 text-[var(--accent-hi)] md:left-full md:top-1/2 md:-translate-y-1/2 md:translate-x-0">→</span>}</div>)}</div>;
}

export function CheckList({ items }: { items: string[] }) { return <ul className="grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item} className="flex gap-3 text-sm text-[var(--text-2)]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-hi)]" />{item}</li>)}</ul>; }
