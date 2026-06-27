import { pageMetadata } from "@/lib/seo";
import { LegalPageShell } from "@/components/v3/marketing/LegalPageShell";
import { ContactForm } from "@/components/v3/marketing/ContactForm";

export const metadata = pageMetadata({
  title: "Contact & Support",
  description:
    "Contact the Erebrus team for VPN, Drop, Wallet login, Billing, or Account Support. We respond by email.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <LegalPageShell
      eyebrow="Erebrus support"
      title="Contact us"
      summary="Submit a support request for Erebrus VPN, Drop, Wallet Access, Subscriptions, or Account questions. We typically respond by email."
      lastUpdated="June 26, 2026"
    >
      <ContactForm />
    </LegalPageShell>
  );
}
