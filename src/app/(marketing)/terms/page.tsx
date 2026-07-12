import { pageMetadata } from "@/lib/seo";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/v3/marketing/LegalPageShell";

export const metadata = pageMetadata({
  title: "Terms and Conditions",
  description:
    "Terms and Conditions for Erebrus VPN and Erebrus Drop — wallet access, decentralized VPN usage, and IPFS storage.",
  path: "/terms",
  keywords: [
    "Erebrus terms",
    "VPN terms of service",
    "Drop terms",
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

const lastUpdated = "July 11, 2026";

const sections: TermsSection[] = [
  {
    title: "1. Agreement to These Terms",
    body: [
      'These Terms and Conditions ("Terms") govern your access to and use of Erebrus VPN, Erebrus Drop, the Erebrus web application, mobile applications, websites, dashboards, APIs, network explorer, support channels, and related services (collectively, the "Services"). Erebrus is a product of NetSepio.',
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
        title: "Erebrus Drop",
        body: [
          "Erebrus Drop stores files on selected community-operated or private-organization Kubo/IPFS nodes through the Erebrus gateway. The gateway manages authorization, quota, metadata, and managed pin lifecycle.",
          "Private files are encrypted and decrypted in your browser. Public files are plaintext and may be shared by opaque link or retrieved by CID through IPFS.",
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
      "Some Erebrus VPN features require connecting a supported wallet and signing authentication messages. A signature is used to verify wallet control and does not by itself authorize a token transfer unless the wallet prompt separately says so.",
      "You are responsible for reviewing wallet prompts, transaction details, network fees, and smart contract interactions before approving them. Blockchain transactions can be irreversible.",
    ],
  },
  {
    title: "5. VPN Use and Network Conditions",
    items: [
      "VPN node availability, speed, uptime, location, routing, and performance may vary.",
      "Some VPN infrastructure may be operated by independent node operators or third-party providers, not solely by NetSepio.",
      "VPN access does not guarantee anonymity, immunity from monitoring by all parties, access to every website, or bypass of every technical restriction.",
      "You are responsible for complying with laws, platform rules, and network policies that apply to your use of VPN connections.",
      "Do not use Erebrus VPN to attack, disrupt, harass, defraud, spam, scrape unlawfully, infringe rights, distribute malware, or engage in illegal activity.",
    ],
  },
  {
    title: "6. Drop Storage Responsibilities",
    items: [
      "You are responsible for files you upload, store, retrieve, publish, or share and for ensuring that you have all necessary rights and permissions.",
      "Public files are plaintext. Anyone with the opaque link or CID may retrieve them, and deletion cannot guarantee removal from independent IPFS nodes, caches, recipients, or pins.",
      "Keep your private-file recovery secret secure. NetSepio cannot recover your vault key or decrypt private files if the recovery secret is lost.",
      "Node capacity, connectivity, pin state, browser memory, and IPFS availability may affect upload and retrieval. Keep independent backups of important files.",
      "Organization owners and node operators may use the proxied Kubo WebUI. Pins created directly in Kubo are unmanaged and may not appear in Drop metadata, usage, quota, or deletion workflows.",
    ],
  },
  {
    title: "7. Acceptable Use",
    body: ["You agree not to use the Services to:"],
    items: [
      "Violate any law, regulation, sanctions program, court order, or third-party right.",
      "Transmit malware, exploit code, phishing material, abusive content, non-consensual intimate content, or illegal content.",
      "Interfere with, overload, reverse engineer, crawl, probe, or attack the Services, nodes, wallets, APIs, or other users.",
      "Misrepresent your identity, impersonate another person, or bypass access controls.",
      "Use the Services for high-risk activities where failure could lead to death, personal injury, environmental damage, or critical infrastructure harm.",
      "Resell, sublicense, or commercially exploit the Services unless NetSepio has authorized that use in writing.",
    ],
  },
  {
    title: "8. User Content and Transfers",
    body: [
      'You retain ownership of files, photos, text, wallet data, names, configuration labels, support messages, and other content you provide or transfer through the Services ("User Content").',
      "You grant NetSepio and participating node operators the limited rights necessary to transmit, store, pin, retrieve, replicate, and delete User Content as directed by you and required to operate Drop. This license ends when no longer needed to provide the requested service, subject to backups, independent IPFS copies, legal obligations, and content outside NetSepio's control.",
    ],
  },
  {
    title: "9. Fees, Organization Plans, and Blockchain Features",
    items: [
      "Service access and limits are determined by active organization membership, organization plans, and assigned seats. Personal trials and NFT holdings do not grant product access.",
      "Fees, taxes, gas costs, payment processor charges, and blockchain network fees are your responsibility unless stated otherwise.",
      "NFT minting or token features may be experimental, unavailable, delayed, or non-functional. Ownership of an NFT or token does not guarantee perpetual service access unless NetSepio expressly states that in writing.",
      "Blockchain assets are volatile and can involve risk. NetSepio does not provide financial, investment, tax, or legal advice.",
    ],
  },
  {
    title: "10. Privacy",
    body: [
      "Your use of the Services is also governed by the Erebrus Privacy Policy. The Privacy Policy explains what NetSepio collects, what it does not collect for Erebrus Drop, how data is used, and how privacy rights requests may be made.",
    ],
  },
  {
    title: "11. Third-party Services",
    body: [
      "The Services may rely on or link to third-party wallets, blockchains, RPC providers, payment processors, app stores, browsers, operating systems, QR scanners, storage locations, node operators, hosting providers, analytics or security providers, and external websites. NetSepio is not responsible for third-party services, and your use of them may be governed by their own terms and privacy policies.",
    ],
  },
  {
    title: "12. Security",
    body: [
      "NetSepio works to protect the Services, but no network, VPN, app, device, browser, blockchain, encryption implementation, node, or storage system is perfect. You are responsible for keeping your wallet credentials, Drop recovery secret, devices, operating system, browser, and files secure.",
      "Report suspected vulnerabilities or account abuse to support@netsepio.com. Do not publicly disclose a vulnerability before NetSepio has had a reasonable opportunity to investigate and remediate it.",
    ],
  },
  {
    title: "13. Intellectual Property",
    body: [
      "The Services, software, designs, logos, trademarks, text, graphics, interfaces, documentation, and other materials provided by NetSepio are owned by NetSepio or its licensors and are protected by intellectual property laws. These Terms do not transfer ownership of NetSepio intellectual property to you.",
    ],
  },
  {
    title: "14. Disclaimers",
    body: [
      'The Services are provided "as is" and "as available" to the maximum extent permitted by law. NetSepio disclaims all warranties, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, title, non-infringement, availability, reliability, and security.',
      "NetSepio does not warrant that the Services will be uninterrupted, error-free, secure, compatible with every device or network, free from harmful components, or that any VPN route or Drop transfer will meet your expectations.",
    ],
  },
  {
    title: "15. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, NetSepio and its affiliates, officers, employees, contractors, licensors, and service providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, loss of goodwill, service interruption, device compromise, failed transfers, lost files, wallet compromise, blockchain losses, or unauthorized access arising from or related to the Services.",
      "To the maximum extent permitted by law, NetSepio's total liability for all claims related to the Services will not exceed the greater of the amount you paid to NetSepio for the Services in the six months before the claim or USD 100.",
    ],
  },
  {
    title: "16. Indemnification",
    body: [
      "You agree to defend, indemnify, and hold harmless NetSepio and its affiliates, officers, employees, contractors, licensors, and service providers from claims, damages, liabilities, losses, and expenses, including reasonable attorneys' fees, arising from your use of the Services, your User Content, your transfers, your violation of these Terms, or your violation of law or third-party rights.",
    ],
  },
  {
    title: "17. Suspension and Termination",
    body: [
      "NetSepio may suspend, limit, or terminate access to the Services if we believe you violated these Terms, created risk for the Services or others, triggered abuse or security concerns, or if continued operation is not commercially, legally, or technically feasible.",
      "You may stop using the Services at any time. Some provisions, including intellectual property, disclaimers, limitation of liability, indemnification, dispute terms, and payment obligations, survive termination.",
    ],
  },
  {
    title: "18. Changes to the Services or Terms",
    body: [
      "NetSepio may update the Services and these Terms from time to time. If changes are material, we will take reasonable steps to provide notice, such as updating this page or providing in-product notice. Your continued use after the effective date of updated Terms means you accept the updated Terms.",
    ],
  },
  {
    title: "19. Governing Law and Disputes",
    body: [
      "These Terms are governed by the laws of the United States and, where applicable, the laws of the state or jurisdiction in which NetSepio or its operating entity is established, without regard to conflict of law principles. Courts located in the United States will have jurisdiction unless applicable consumer protection law requires otherwise.",
    ],
  },
  {
    title: "20. Contact",
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
      summary="These Terms cover Erebrus VPN and Erebrus Drop, including wallet access, organization plans, decentralized VPN usage, IPFS storage, browser-side encryption, public sharing, and recovery responsibilities."
      lastUpdated={lastUpdated}
    >
      <div className="space-y-5">
        {sections.map((section) => (
          <LegalSection key={section.title} {...section} />
        ))}
      </div>
    </LegalPageShell>
  );
}
