import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/v3/marketing/LegalPageShell";

export const metadata = pageMetadata({
  title: "Terms and Conditions",
  description:
    "Terms and Conditions for Erebrus VPN, Erebrus Firewall, Erebrus Drop, and Erebrus AI — wallet access, network protection, local file transfer, optional IPFS storage, and local AI.",
  path: "/terms",
  keywords: [
    "Erebrus terms",
    "VPN terms of service",
    "firewall terms",
    "Drop terms",
    "local file transfer terms",
    "Erebrus AI terms",
    "local AI terms",
    "decentralized VPN",
    "NetSepio",
  ],
});

type TermsSection = {
  title: string;
  body?: string[];
  items?: string[];
  subsections?: Array<{
    title: string;
    body?: string[];
    items?: string[];
  }>;
};

const lastUpdated = "July 31, 2026";

const sections: TermsSection[] = [
  {
    title: "1. Agreement to These Terms",
    body: [
      'These Terms and Conditions ("Terms") govern your access to and use of Erebrus VPN, Erebrus Firewall, Erebrus Drop, Erebrus AI, the Erebrus web application, mobile applications, websites, dashboards, APIs, network explorer, support channels, and related services (collectively, the "Services"). Erebrus is a product of NetSepio.',
      "By accessing or using any Service, you agree to these Terms. If you do not agree, do not use the Services.",
    ],
  },
  {
    title: "2. Service Overview",
    subsections: [
      {
        title: "Erebrus VPN",
        body: [
          "Erebrus VPN provides wallet-authenticated access to decentralized VPN and DePIN network features. Depending on availability, you may browse nodes, create VPN clients, generate or download configuration files, manage organization plans and seats, and access related network tools.",
        ],
      },
      {
        title: "Erebrus Firewall",
        body: [
          "Erebrus Firewall provides network-protection features for eligible workspaces and nodes where available, including firewall or DNS-filtering service status, rule management, service credentials, sync, and restart controls.",
          "Firewall behavior depends on the selected node, plan, rules, upstream providers, device configuration, and local or cloud network settings. It is a protection layer, not a guarantee that every threat, tracker, malicious destination, or unwanted connection will be blocked.",
        ],
      },
      {
        title: "Erebrus Drop",
        body: [
          "Erebrus Drop is local-transfer-first. Drop Rooms help you move files, photos, and pasted text between nearby devices over Wi-Fi or hotspot using QR codes, local room links, or browser-based transfer flows where available.",
          "When you choose persistent storage or share links, Erebrus Drop may store files on selected community-operated or private-organization Kubo/IPFS nodes through the Erebrus gateway. The gateway manages authorization, quota, metadata, and managed pin lifecycle for those storage features.",
          "Private stored files are encrypted and decrypted in your browser. Public stored files are plaintext and may be shared by opaque link or retrieved by CID through IPFS.",
        ],
      },
      {
        title: "Erebrus AI",
        body: [
          "Erebrus AI provides local-first AI tools for downloading and running supported open or third-party models, creating custom personas, and using trusted devices or workspace nodes for inference where available.",
          "Local-only inference is designed to run on your own device. If you choose LAN discovery, shared model access, workspace nodes, support workflows, or any remote feature, related prompts, inputs, outputs, model metadata, and technical request data may be processed outside your device as needed to provide that feature.",
        ],
      },
    ],
  },
  {
    title: "3. Eligibility and Account Access",
    items: [
      "You must be legally able to enter into these Terms in your jurisdiction.",
      "You are responsible for your wallet, device, browser, operating system, private keys, seed phrases, and local network security.",
      "You may not use the Services if you are barred from doing so under applicable law or sanctions rules.",
      "If you use the Services on behalf of an organization, you represent that you have authority to bind that organization.",
    ],
  },
  {
    title: "4. Wallets, Signatures, and Authentication",
    body: [
      "Some Erebrus VPN, Erebrus Firewall, Erebrus Drop, and Erebrus AI features require connecting a supported wallet and signing authentication messages. A signature is used to verify wallet control and does not by itself authorize a token transfer unless the wallet prompt separately says so.",
      "You are responsible for reviewing wallet prompts, transaction details, network fees, and smart contract interactions before approving them. Blockchain transactions can be irreversible.",
    ],
  },
  {
    title: "5. VPN, Firewall, and Network Conditions",
    items: [
      "VPN node availability, speed, uptime, location, routing, and performance may vary.",
      "Some VPN infrastructure may be operated by independent node operators or third-party providers, not solely by NetSepio.",
      "VPN access does not guarantee anonymity, immunity from monitoring by all parties, access to every website, or bypass of every technical restriction.",
      "Firewall rules, DNS filtering, service credentials, node sync, and restart actions may not apply instantly and may not block every unwanted, malicious, or restricted destination.",
      "Organization owners and administrators are responsible for firewall rules they create, credentials they share, and network policies they enforce for their members.",
      "You are responsible for complying with laws, platform rules, and network policies that apply to your use of VPN connections.",
      "Do not use Erebrus VPN to attack, disrupt, harass, defraud, spam, scrape unlawfully, infringe rights, distribute malware, or engage in illegal activity.",
    ],
  },
  {
    title: "6. Drop Rooms and Optional Storage Responsibilities",
    items: [
      "You are responsible for files, photos, text, and other content you send, receive, upload, store, retrieve, publish, or share and for ensuring that you have all necessary rights and permissions.",
      "Drop Room transfers rely on nearby devices, local network conditions, QR scanning, browser compatibility, and device permissions. Only join rooms and accept files from devices or people you trust.",
      "Optional public stored files are plaintext. Anyone with the opaque link or CID may retrieve them, and deletion cannot guarantee removal from independent IPFS nodes, caches, recipients, or pins.",
      "Keep your private-file recovery secret secure. NetSepio cannot recover your vault key or decrypt private files if the recovery secret is lost.",
      "Node capacity, connectivity, pin state, browser memory, and IPFS availability may affect upload and retrieval. Keep independent backups of important files.",
      "Organization owners and node operators may use the proxied Kubo WebUI. Pins created directly in Kubo are unmanaged and may not appear in Drop metadata, usage, quota, or deletion workflows.",
    ],
  },
  {
    title: "7. AI Model and Inference Responsibilities",
    items: [
      "You are responsible for choosing, downloading, configuring, and using AI models and for ensuring that your use complies with applicable model licenses, third-party terms, export rules, laws, and organizational policies.",
      "AI outputs may be incomplete, inaccurate, offensive, biased, unsafe, or unsuitable for your intended use. You are responsible for reviewing outputs before relying on them, publishing them, or using them to make decisions.",
      "Erebrus AI does not provide medical, legal, financial, investment, tax, emergency, or other professional advice. Do not use AI outputs as a substitute for qualified professional judgment.",
      "If you enable LAN discovery or shared inference, your device may advertise or reveal limited local-network service metadata, such as service availability, address, port, or model capability information, to devices on the same network. Use these features only on networks and devices you trust.",
      "If you send prompts, files, images, or other inputs to a workspace node, shared model, nearby device, or support channel, that recipient may technically process those inputs and outputs. Do not send sensitive content to untrusted nodes or users.",
      "NetSepio does not guarantee that any model, model hub entry, quantization, persona, shared node, runtime, hardware acceleration path, or AI output will be available, secure, lawful for your use, or fit for a particular purpose.",
    ],
  },
  {
    title: "8. Acceptable Use",
    body: ["You agree not to use the Services to:"],
    items: [
      "Violate any law, regulation, sanctions program, court order, or third-party right.",
      "Transmit malware, exploit code, phishing material, abusive content, non-consensual intimate content, illegal content, or unlawful AI-generated content.",
      "Interfere with, overload, reverse engineer, crawl, probe, or attack the Services, nodes, wallets, APIs, or other users.",
      "Misrepresent your identity, impersonate another person, or bypass access controls.",
      "Use AI features to generate, automate, or facilitate illegal activity, cyber abuse, fraud, harassment, rights violations, or other harmful conduct.",
      "Use the Services for high-risk activities where failure could lead to death, personal injury, environmental damage, or critical infrastructure harm.",
      "Resell, sublicense, or commercially exploit the Services unless NetSepio has authorized that use in writing.",
    ],
  },
  {
    title: "9. User Content, Prompts, Outputs, and Transfers",
    body: [
      'You retain ownership of files, photos, text, wallet data, names, configuration labels, prompts, personas, model settings, AI outputs, support messages, and other content you provide, generate, or transfer through the Services ("User Content").',
      "You grant NetSepio and participating node operators the limited rights necessary to transmit, store, pin, retrieve, replicate, process, generate, display, and delete User Content as directed by you and required to operate the Services, including local Drop transfers, optional Drop storage, and optional AI shared-node or support workflows. This license ends when no longer needed to provide the requested service, subject to backups, independent IPFS copies, legal obligations, and content outside NetSepio's control.",
    ],
  },
  {
    title: "10. Fees, Organization Plans, AI Access, and Blockchain Features",
    items: [
      "Service access and limits are determined by active organization membership, organization plans, assigned seats, product availability, and applicable AI model or workspace access rules. Personal trials and NFT holdings do not grant product access.",
      "Fees, taxes, gas costs, payment processor charges, and blockchain network fees are your responsibility unless stated otherwise.",
      "NFT minting or token features may be experimental, unavailable, delayed, or non-functional. Ownership of an NFT or token does not guarantee perpetual service access unless NetSepio expressly states that in writing.",
      "Blockchain assets are volatile and can involve risk. NetSepio does not provide financial, investment, tax, or legal advice.",
    ],
  },
  {
    title: "11. Privacy",
    body: [
      "Your use of the Services is also governed by the Erebrus Privacy Policy. The Privacy Policy explains what NetSepio collects, what it does not collect by default for local-only Drop Room transfers, private Drop storage, and local-only AI inference, how data is used, and how privacy rights requests may be made.",
    ],
  },
  {
    title: "12. Third-party Services",
    body: [
      "The Services may rely on or link to third-party wallets, blockchains, RPC providers, payment processors, app stores, browsers, operating systems, QR scanners, storage locations, node operators, firewall or DNS-filtering providers, AI model publishers, model hubs, local-network discovery systems, hosting providers, analytics or security providers, and external websites. NetSepio is not responsible for third-party services, and your use of them may be governed by their own terms, model licenses, and privacy policies.",
    ],
  },
  {
    title: "13. Security",
    body: [
      "NetSepio works to protect the Services, but no network, VPN, firewall, AI runtime, model file, app, device, browser, blockchain, encryption implementation, node, local transfer, or storage system is perfect. You are responsible for keeping your wallet credentials, Drop recovery secret, firewall credentials, prompts, AI outputs, local models, devices, operating system, browser, and files secure.",
      "Report suspected vulnerabilities or account abuse to support@netsepio.com. Do not publicly disclose a vulnerability before NetSepio has had a reasonable opportunity to investigate and remediate it.",
    ],
  },
  {
    title: "14. Intellectual Property",
    body: [
      "The Services, software, designs, logos, trademarks, text, graphics, interfaces, documentation, and other materials provided by NetSepio are owned by NetSepio or its licensors and are protected by intellectual property laws. These Terms do not transfer ownership of NetSepio intellectual property to you.",
    ],
  },
  {
    title: "15. Disclaimers",
    body: [
      'The Services are provided "as is" and "as available" to the maximum extent permitted by law. NetSepio disclaims all warranties, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, title, non-infringement, availability, reliability, and security.',
      "NetSepio does not warrant that the Services will be uninterrupted, error-free, secure, compatible with every device or network, free from harmful components, or that any VPN route, firewall rule, Drop transfer, Drop storage action, AI model, AI output, shared node, or local runtime will meet your expectations.",
    ],
  },
  {
    title: "16. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, NetSepio and its affiliates, officers, employees, contractors, licensors, and service providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, loss of goodwill, service interruption, device compromise, failed transfers, lost files, firewall misconfiguration, wallet compromise, blockchain losses, AI model errors, inaccurate outputs, prompt disclosure through shared nodes, or unauthorized access arising from or related to the Services.",
      "To the maximum extent permitted by law, NetSepio's total liability for all claims related to the Services will not exceed the greater of the amount you paid to NetSepio for the Services in the six months before the claim or USD 100.",
    ],
  },
  {
    title: "17. Indemnification",
    body: [
      "You agree to defend, indemnify, and hold harmless NetSepio and its affiliates, officers, employees, contractors, licensors, and service providers from claims, damages, liabilities, losses, and expenses, including reasonable attorneys' fees, arising from your use of the Services, your User Content, prompts, AI outputs, model downloads, transfers, your violation of these Terms, or your violation of law, model licenses, or third-party rights.",
    ],
  },
  {
    title: "18. Suspension and Termination",
    body: [
      "NetSepio may suspend, limit, or terminate access to the Services if we believe you violated these Terms, created risk for the Services or others, triggered abuse or security concerns, or if continued operation is not commercially, legally, or technically feasible.",
      "You may stop using the Services at any time. Some provisions, including intellectual property, disclaimers, limitation of liability, indemnification, dispute terms, and payment obligations, survive termination.",
    ],
  },
  {
    title: "19. Changes to the Services or Terms",
    body: [
      "NetSepio may update the Services and these Terms from time to time. If changes are material, we will take reasonable steps to provide notice, such as updating this page or providing in-product notice. Your continued use after the effective date of updated Terms means you accept the updated Terms.",
    ],
  },
  {
    title: "20. Governing Law and Disputes",
    body: [
      "These Terms are governed by the laws of the United States and, where applicable, the laws of the state or jurisdiction in which NetSepio or its operating entity is established, without regard to conflict of law principles. Courts located in the United States will have jurisdiction unless applicable consumer protection law requires otherwise.",
    ],
  },
  {
    title: "21. Contact",
    body: [
      "Questions about these Terms can be sent to support@netsepio.com.",
      "Postal contact, if required: NetSepio LLC, Georgia, Tbilisi, Krtsanisi District, Nino and Ilia Nakashidzeebi Str., N1, (formerly Avlev), Bl. N3, Apt. N3.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Erebrus legal"
      title="Terms and Conditions"
      summary="These Terms cover Erebrus VPN, Erebrus Firewall, Erebrus Drop, and Erebrus AI, including wallet access, organization plans, decentralized VPN usage, firewall controls, local Drop Room transfers, optional IPFS storage, browser-side encryption, public sharing, local AI inference, shared model access, and recovery responsibilities."
      lastUpdated={lastUpdated}
    >
      <div className="space-y-5">
        {sections.map((section) => (
          <LegalSection key={section.title} {...section} />
        ))}

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-xl font-semibold tracking-tight md:text-2xl">
            Account deletion
          </h2>
          <p className="mb-4 leading-7 text-[var(--text-2)]">
            You can request deletion of your Erebrus account and associated data at any time. Read the{" "}
            <Link
              href="/account-deletion"
              className="text-[var(--accent-hi)] hover:underline"
            >
              account deletion page
            </Link>{" "}
            for what is deleted, what may be retained, and how to verify ownership.
          </p>
          <p className="leading-7 text-[var(--text-2)]">
            If you can sign in, request deletion from your Profile. If you cannot sign in, use the{" "}
            <Link
              href="/contact?category=account-deletion"
              className="text-[var(--accent-hi)] hover:underline"
            >
              contact form
            </Link>{" "}
            with the “Account deletion” category.
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
