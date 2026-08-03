import Link from "next/link";
import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { Card, Eyebrow } from "@/components/v3/ui";
import { LiveNetworkStats } from "@/components/v3/marketing/LiveNetworkStats";
import { LandingNetworkPreview } from "@/components/v3/marketing/LandingNetworkPreview";
import { pageMetadata } from "@/lib/seo";
import { CardGridSection, FinalCta, MarketingButtonLink, ProductFlow, VisualPlaceholder } from "@/components/v3/marketing/MarketingSections";

export const metadata = pageMetadata({
  title: "Erebrus - Private VPN, Firewall and AI for Work, Travel and Home",
  description: "Secure your connection with Erebrus VPN, block threats with firewall protection, and run private AI on trusted hardware. Built for travellers, families and growing teams.",
  path: "/",
});

const audiences = [
  { title: "Digital Nomads", body: "Stay protected on airport, hotel, cafe, and coworking Wi-Fi while keeping access to the services you rely on.", href: "/digital-nomads", cta: "Explore for Digital Nomads" },
  { title: "Families", body: "Protect household devices, reduce exposure to harmful websites, and manage safer connection policies at home and away.", href: "/families", cta: "Explore for Families" },
  { title: "Businesses and Teams", body: "Secure employee access, protect company systems, and run confidential AI workloads on trusted infrastructure.", href: "/business", cta: "Explore for Business" },
];
const products = [
  { title: "Erebrus VPN", body: "Encrypt your connection on public and private networks, choose trusted gateways, and access approved resources from anywhere.", href: "/vpn", cta: "Explore VPN" },
  { title: "Erebrus Firewall", body: "Block malicious domains and unwanted traffic, apply safer DNS policies, and protect devices before threats reach them.", href: "/firewall", cta: "Explore Firewall" },
  { title: "Erebrus AI", body: "Run supported AI models on your computer, server, or private node so sensitive work can remain under your control.", href: "/ai", cta: "Explore Private AI" },
];

export default function LandingPage() {
  return <><MarketingNav />
    <main>
      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-4 py-16 md:grid-cols-[1.05fr_.95fr] md:px-8 md:py-24">
        <div><Eyebrow className="mb-5">Private connectivity and AI</Eyebrow><h1 className="text-5xl font-bold leading-[.98] tracking-[-.045em] sm:text-6xl md:text-[76px]">Privacy that travels with you.</h1><p className="mt-6 max-w-[640px] text-lg leading-relaxed text-[var(--text-2)] md:text-xl">Secure your connection with Erebrus VPN, block harmful traffic with firewall protection, and run private AI on hardware you trust.</p><div className="mt-9 flex flex-wrap gap-3"><MarketingButtonLink href="#app" className="!px-6 !py-4 !text-base">Get Erebrus →</MarketingButtonLink><MarketingButtonLink href="/business" variant="ghost" className="!px-6 !py-4 !text-base">Explore for Business</MarketingButtonLink></div><p className="mt-6 text-sm text-[var(--text-3)]">VPN for secure access. Firewall for safer connections. Private AI for sensitive work.</p></div>
        {/* TODO: Replace with home-privacy-contexts.webp per handoff section 18.2. */}<VisualPlaceholder label="Work · travel · home" />
      </section>

      <CardGridSection eyebrow="Built around how you connect" title="Choose the Erebrus experience that fits you." items={audiences} />
      <CardGridSection eyebrow="One private workspace, three core capabilities" title="Connect. Protect. Work privately." items={products} />

      <section className="mx-auto max-w-[1180px] px-4 pb-10 md:px-8"><Link href="/drop"><Card className="flex flex-col justify-between gap-4 p-6 transition-colors hover:border-[var(--accent)]/30 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Need private file transfer too?</h2><p className="mt-1 text-sm text-[var(--text-2)]">Erebrus Drop helps you move files directly and securely across trusted devices.</p></div><span className="font-semibold text-[var(--accent-hi)]">Explore Drop →</span></Card></Link></section>

      <section className="mx-auto max-w-[1180px] px-4 py-16 md:px-8"><div className="mb-10 max-w-3xl"><Eyebrow className="mb-4">How it fits together</Eyebrow><h2 className="text-3xl font-bold md:text-[44px]">One secure path from device to intelligence.</h2><p className="mt-4 text-[var(--text-2)]">Connect through a trusted gateway, apply protection, and reach only the internet services, private resources, or AI hosts you approve.</p></div><ProductFlow /></section>

      <CardGridSection eyebrow="Deployment flexibility" title="Use the Erebrus network or deploy your own." intro="Start with available Erebrus gateways, use infrastructure dedicated to your organization, or deploy Erebrus in your cloud or on hardware you manage." items={[{title:"Erebrus network",body:"Choose from available gateways operated across the network."},{title:"Dedicated company gateway",body:"Connect a team through infrastructure assigned to the organization."},{title:"Your cloud",body:"Deploy in infrastructure controlled by your organization where supported."},{title:"Your hardware",body:"Run Erebrus from hardware you manage at home, in an office, or at the edge."}]} columns={4} />

      <section className="mx-auto max-w-[1180px] px-4 py-10 md:px-8"><div className="mb-8 max-w-3xl"><Eyebrow className="mb-4">The Erebrus network</Eyebrow><h2 className="text-3xl font-bold md:text-[44px]">Powered by an open network of independent operators.</h2><p className="mt-4 text-[var(--text-2)]">Erebrus combines community infrastructure with private and customer-controlled deployments, giving users more choice over how and where they connect.</p></div><LiveNetworkStats /><LandingNetworkPreview /><div className="mt-6 flex gap-5 text-sm font-semibold"><Link href="/dashboard" className="text-[var(--accent-hi)]">Explore the Network →</Link><Link href="/#operators" className="text-[var(--text-2)]">Run a Node →</Link></div></section>

      <section id="operators" className="mx-auto max-w-[1180px] px-4 py-12 md:px-8"><Card className="p-8 md:p-12"><Eyebrow className="mb-4">For operators</Eyebrow><h2 className="text-3xl font-bold">Run a node. Help power the network.</h2><p className="mt-4 max-w-2xl text-[var(--text-2)]">Enroll compatible infrastructure, choose how it is shared, and monitor it from your Erebrus workspace.</p></Card></section>
      <FinalCta title="Start with the connection you need today." body="Download Erebrus for personal use, or explore a managed private network for your team." primary={{label:"Get Erebrus",href:"#app"}} secondary={{label:"Explore for Business",href:"/business"}} />
    </main><MarketingFooter /></>;
}
