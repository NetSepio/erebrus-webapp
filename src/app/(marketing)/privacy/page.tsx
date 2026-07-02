import { pageMetadata } from "@/lib/seo";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/v3/marketing/LegalPageShell";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy for Erebrus VPN and Erebrus Drop — how NetSepio handles wallet auth, VPN metadata, and local-first Drop transfers.",
  path: "/privacy",
  keywords: [
    "Erebrus privacy policy",
    "VPN privacy",
    "local file sharing privacy",
    "wallet authentication",
    "NetSepio",
  ],
});

type PolicySection = {
  title: string;
  body?: string[];
  items?: string[];
  subsections?: Array<{
    title: string;
    body?: string[];
    items?: string[];
  }>;
};

const lastUpdated = "June 7, 2026";

const privacyHighlights = [
  "Erebrus Drop transfers are designed to move directly over your local Wi-Fi or hotspot, not through NetSepio cloud storage.",
  "Erebrus Drop does not collect analytics, advertising identifiers, contact lists, account profiles, or location history.",
  "Erebrus VPN may process wallet authentication, subscription, device, technical, and security metadata needed to provide VPN access.",
  "NetSepio does not sell personal information and does not use Drop file contents for advertising.",
];

const sections: PolicySection[] = [
  {
    title: "1. Scope",
    body: [
      "This Privacy Policy explains how NetSepio handles information for Erebrus VPN, Erebrus Drop, the Erebrus web application, mobile applications, dashboard, explorer, websites, support channels, and related services.",
      "Erebrus VPN and Erebrus Drop are different products with different data flows. This policy explains both.",
    ],
  },
  {
    title: "2. Information We Collect",
    subsections: [
      {
        title: "Information common to Erebrus services",
        items: [
          "Wallet address, wallet network, signed authentication messages, and related wallet connection state.",
          "Account or access status, such as free trial eligibility, subscription status, token-gated access status, or NFT-related access signals.",
          "Cookies, local storage, authentication tokens, and session information needed to keep you signed in and secure.",
          "Device and browser metadata, such as user agent, operating system, app version, timestamps, IP address seen by our web servers, request logs, and diagnostics.",
          "Support messages, bug reports, survey responses, and feedback you choose to send us.",
          "Payment or transaction metadata when you purchase, subscribe, mint, or interact with payment processors or blockchains. NetSepio does not need your wallet seed phrase or private key.",
        ],
      },
      {
        title: "Erebrus VPN information",
        items: [
          "VPN client names or labels you create.",
          "Selected node, country or region preference, generated configuration metadata, and dashboard actions needed to manage VPN clients.",
          "Operational, security, and abuse-prevention logs related to authentication, API requests, node availability, subscription enforcement, and service reliability.",
          "Network metadata may be visible to VPN infrastructure as technically necessary to route traffic. For example, a VPN node may need to see connection endpoints to provide service.",
        ],
      },
      {
        title: "Erebrus Drop information",
        items: [
          "Drop Room transfers are designed to happen over your local Wi-Fi or hotspot. File contents are not uploaded to NetSepio servers as part of the local Drop Room transfer flow.",
          "A QR code or browser Drop link may contain temporary local room information needed for a nearby device to join the room.",
          "Files, photos, pasted text, filenames, file sizes, thumbnails, and received-file metadata may be processed locally on your devices so the transfer and Library can work.",
          "Received files may stay on your device or in the app Library until you view, share, export, or delete them.",
          "Erebrus Drop does not collect analytics, advertising identifiers, contact lists, account profiles, or location history.",
        ],
      },
    ],
  },
  {
    title: "3. Information We Do Not Collect for Erebrus Drop",
    items: [
      "We do not upload Drop Room file contents to NetSepio servers for the local transfer flow.",
      "We do not collect Drop analytics events.",
      "We do not collect mobile advertising identifiers for Drop.",
      "We do not collect your contact list or address book for Drop.",
      "We do not create Drop account profiles.",
      "We do not collect precise location history for Drop.",
    ],
  },
  {
    title: "4. How We Use Information",
    items: [
      "Provide, secure, maintain, and troubleshoot Erebrus VPN and Erebrus Drop.",
      "Authenticate wallets and sessions.",
      "Create, manage, and revoke VPN clients and access credentials.",
      "Operate trials, subscriptions, NFT access, promotions, and payment-related workflows.",
      "Detect abuse, fraud, spam, malware, attacks, service misuse, and violations of our Terms.",
      "Respond to support requests and improve product reliability.",
      "Comply with legal obligations and enforce our rights.",
    ],
  },
  {
    title: "5. How Erebrus Drop Works Locally",
    body: [
      "When you create a Drop Room, another nearby device can join by scanning a QR code or opening a browser Drop link. The transfer is designed to use the local network, such as Wi-Fi or hotspot, instead of NetSepio cloud storage.",
      "Because Drop is local-first, your own device, the receiving device, the local router, hotspot, browser, operating system, and any security software you use may process technical information required for the transfer. People who control the local network may be able to observe network-level metadata. Do not use Drop on networks or with devices you do not trust.",
    ],
  },
  {
    title: "6. How We Share Information",
    body: [
      "We do not sell personal information. We do not share Erebrus Drop file contents with advertisers. We may share limited information in the following circumstances:",
    ],
    items: [
      "Service providers that help with hosting, security, support, payment processing, wallet connectivity, infrastructure, analytics for non-Drop services where used, and app operations.",
      "Blockchain networks, wallet providers, RPC providers, payment processors, or app stores when you choose to use those features.",
      "VPN node operators or infrastructure providers as technically necessary to provide VPN routing and network operations.",
      "Legal, safety, or compliance recipients when we believe disclosure is required by law or necessary to protect rights, users, the Services, or the public.",
      "Business transfer recipients if NetSepio is involved in a merger, acquisition, financing, reorganization, or sale of assets.",
      "Other people or services when you intentionally share information, such as sending files through Drop, exporting a Library item, using a share sheet, posting publicly, or contacting support.",
    ],
  },
  {
    title: "7. Cookies and Local Storage",
    body: [
      "We use cookies, local storage, and similar technologies to support authentication, wallet connection state, security, preferences, and product functionality. You can control cookies through your browser, but some features may stop working if cookies or local storage are disabled.",
      "Erebrus Drop may use local device storage for room state, received files, previews, or Library functionality. Deleting app data or Library items may remove locally stored information.",
    ],
  },
  {
    title: "8. Legal Bases for Processing",
    body: [
      "Where laws such as the GDPR apply, we process personal data under one or more legal bases:",
    ],
    items: [
      "Contract: to provide Erebrus VPN, Erebrus Drop, account access, subscriptions, and support.",
      "Legitimate interests: to secure, debug, improve, and protect the Services and users.",
      "Consent: where we ask for optional permissions or communications consent.",
      "Legal obligation: to comply with applicable law, legal process, accounting, tax, fraud prevention, and compliance obligations.",
    ],
  },
  {
    title: "9. Data Retention",
    items: [
      "Wallet authentication, account, subscription, payment, support, and operational records are retained as long as needed to provide the Services, resolve disputes, enforce Terms, maintain security, and comply with law.",
      "VPN client metadata may be retained while your client, account, trial, or subscription is active and for a reasonable period after deletion for security, backup, audit, or legal reasons.",
      "Drop Room file contents are not stored on NetSepio servers for the local transfer flow. Received files may remain locally on your device until you delete them or clear the relevant app/device storage.",
      "Security logs may be retained for a limited period to detect abuse, investigate incidents, and protect the Services.",
    ],
  },
  {
    title: "10. Security",
    body: [
      "We use administrative, technical, and organizational safeguards designed to protect information. These may include access controls, encryption in transit where appropriate, logging, monitoring, secure development practices, and vendor review.",
      "No app, VPN, blockchain, wallet, browser, local network, or transfer method can be guaranteed to be 100 percent secure. Keep your devices, wallets, operating systems, browsers, local networks, and received files secure.",
    ],
  },
  {
    title: "11. Your Choices and Rights",
    body: [
      "Depending on where you live, you may have rights to access, correct, delete, restrict, object to, or receive a copy of certain personal data. You may also have rights to appeal a privacy request decision or lodge a complaint with a regulator.",
    ],
    items: [
      "You can disconnect wallets, clear browser cookies, delete local Drop Library files, or uninstall the app through your device controls.",
      "California residents may have rights to know, access, delete, correct, opt out of sale or sharing, limit use of sensitive personal information, and be free from discrimination for exercising privacy rights.",
      "European Economic Area, United Kingdom, and similar-region users may have GDPR-style rights, including access, rectification, erasure, restriction, objection, portability, and withdrawal of consent where processing is based on consent.",
      "To submit a request, contact support@netsepio.com. We may need to verify your request before acting on it.",
    ],
  },
  {
    title: "12. International Transfers",
    body: [
      "NetSepio and service providers may process information in the United States and other countries. Those countries may have data protection laws different from your location. Where required, we use appropriate safeguards for international transfers.",
    ],
  },
  {
    title: "13. Children",
    body: [
      "The Services are not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us so we can review and delete it where required.",
    ],
  },
  {
    title: "14. Third-party Links and Services",
    body: [
      "The Services may link to or integrate with wallets, blockchains, app stores, operating systems, browsers, payment providers, node operators, support tools, and other third parties. Their privacy practices are governed by their own policies, not this Privacy Policy.",
    ],
  },
  {
    title: "15. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. If changes are material, we will take reasonable steps to notify users, such as updating this page or providing in-product notice. The updated policy applies when posted unless otherwise stated.",
    ],
  },
  {
    title: "16. Contact",
    body: [
      "Questions or privacy requests can be sent to support@netsepio.com.",
      "Postal contact, if required: NetSepio LLC, Georgia, Tbilisi, Krtsanisi District, Nino and Ilia Nakashidzeebi Str., N1, (formerly Avlev), Bl. N3, Apt. N3.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Erebrus legal"
      title="Privacy Policy"
      summary="This policy covers Erebrus VPN and Erebrus Drop, including wallet authentication, VPN client management, local Drop Rooms, QR joins, browser Drop links, received files, and Library controls."
      lastUpdated={lastUpdated}
    >
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
        {privacyHighlights.map((highlight) => (
          <div
            key={highlight}
            className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm leading-6 text-[var(--text-2)]"
          >
            {highlight}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {sections.map((section) => (
          <LegalSection key={section.title} {...section} />
        ))}
      </div>
    </LegalPageShell>
  );
}
