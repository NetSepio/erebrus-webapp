import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/v3/marketing/LegalPageShell";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy for Erebrus VPN, Erebrus Drop, and Erebrus AI — wallet authentication, VPN metadata, decentralized file storage, and local AI.",
  path: "/privacy",
  keywords: [
    "Erebrus privacy policy",
    "VPN privacy",
    "IPFS storage privacy",
    "Erebrus AI privacy",
    "local AI privacy",
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

const lastUpdated = "July 25, 2026";

const privacyHighlights = [
  "Private Drop files are encrypted in your browser before upload; NetSepio and node operators store ciphertext and cannot recover your plaintext without your client-held keys.",
  "Public Drop files are plaintext on IPFS and may be retrieved by anyone who has the opaque share link or learns the CID.",
  "Erebrus AI is designed for local-first inference. Prompts, outputs, personas, and model files used only on your device are not uploaded to NetSepio by default.",
  "Erebrus VPN may process wallet authentication, subscription, device, technical, and security metadata needed to provide VPN access.",
  "NetSepio does not sell personal information or use Drop file contents, private prompts, or AI outputs for advertising.",
];

const sections: PolicySection[] = [
  {
    title: "1. Scope",
    body: [
      "This Privacy Policy explains how NetSepio handles information for Erebrus VPN, Erebrus Drop, Erebrus AI, the Erebrus web application, mobile applications, dashboard, explorer, websites, support channels, and related services.",
      "Erebrus VPN, Erebrus Drop, and Erebrus AI are different products with different data flows. This policy explains those differences.",
    ],
  },
  {
    title: "2. Information We Collect",
    subsections: [
      {
        title: "Information common to Erebrus services",
        items: [
          "Wallet address, wallet network, signed authentication messages, and related wallet connection state.",
          "Organization membership, role, assigned seat tier, and organization plan data used to determine service access and storage quota.",
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
          "File metadata such as filename, content type, byte size, selected node, storage scope, visibility, CID, upload state, and timestamps.",
          "Public file contents are sent as plaintext through the gateway to the selected Kubo/IPFS node.",
          "Private file contents are encrypted in your browser. The gateway and node receive ciphertext, authenticated encryption metadata, and a wrapped per-file key, but not the plaintext file key.",
          "An encrypted vault backup may be stored by the gateway. Your recovery secret and unwrapped vault key are not sent to the gateway and are not persisted by the web app.",
          "Upload, download, quota, node-health, audit, rate-limit, and security events needed to operate and protect the storage service.",
        ],
      },
      {
        title: "Erebrus AI information",
        items: [
          "Model catalog interactions, selected model identifiers, quantization preferences, download state, runtime settings, device capability signals, and app diagnostics needed to provide model discovery and local inference features.",
          "Personas, system prompts, conversation history, prompts, inputs, files, images, and outputs may be stored locally by the app when you choose to save them on your device.",
          "If you enable LAN discovery or shared inference, devices on the same network or trusted workspace may receive limited service discovery metadata, such as node availability, address, port, runtime status, and model capability information.",
          "If you send prompts, files, images, or other inputs to a shared model, workspace node, nearby device, gateway, support channel, or cloud-connected feature, the information needed to route, process, troubleshoot, secure, and return the request may be processed outside your device.",
          "Support messages, crash logs, diagnostics, or feedback may include AI prompts, outputs, model names, or local runtime details if you choose to send them to NetSepio.",
        ],
      },
    ],
  },
  {
    title: "3. Drop and AI Information We Do Not Collect by Default",
    items: [
      "Your Drop recovery secret.",
      "Your plaintext account vault key.",
      "Plaintext per-file data keys.",
      "Plaintext private file contents.",
      "Prompts, outputs, personas, conversation history, local files, local images, or local model files used only with local-only Erebrus AI inference.",
      "Your wallet seed phrase or private key.",
    ],
  },
  {
    title: "4. How We Use Information",
    items: [
      "Provide, secure, maintain, and troubleshoot Erebrus VPN, Erebrus Drop, and Erebrus AI.",
      "Authenticate wallets and sessions.",
      "Create, manage, and revoke VPN clients and access credentials.",
      "Provide model catalog, local inference, shared-node discovery, workspace access, and AI diagnostics where you use those features.",
      "Apply organization membership, seat, plan, quota, and payment-related rules.",
      "Detect abuse, fraud, spam, malware, attacks, service misuse, and violations of our Terms.",
      "Respond to support requests and improve product reliability.",
      "Comply with legal obligations and enforce our rights.",
    ],
  },
  {
    title: "5. How Erebrus Drop Storage Works",
    body: [
      "The web app sends file bytes through the Erebrus gateway to the Kubo node you select. The gateway controls authorization, quota, metadata, and managed pin lifecycle. Kubo stores content-addressed blocks and participates in IPFS.",
      "Private files are encrypted and decrypted in your browser using a random per-file key wrapped by your in-memory account vault key. Keep the recovery secret secure: NetSepio cannot reset it or decrypt your files if it is lost.",
      "Public IPFS content should be treated as public and potentially durable. Deleting a managed Drop file removes the gateway record and its managed pin when safe, but cannot guarantee removal from other IPFS nodes, caches, recipients, or independent pins.",
    ],
  },
  {
    title: "6. How Erebrus AI Works",
    body: [
      "Erebrus AI is designed to run supported local models on your own device where available. In that local-only mode, prompts, inputs, personas, conversation history, outputs, and model files are not uploaded to NetSepio by default.",
      "When you enable LAN discovery, a desktop or other device may advertise an Erebrus AI service, including limited technical metadata, to devices on the same local network. Only enable discovery on networks and devices you trust.",
      "When you choose a shared model, workspace node, nearby device, remote gateway, support workflow, or future cloud-connected AI feature, the prompts, files, images, inputs, outputs, authorization data, and technical metadata needed for that feature may be processed outside your device.",
      "Third-party models and model hubs may have their own licenses, terms, and privacy practices. Review them before downloading or using a model.",
    ],
  },
  {
    title: "7. How We Share Information",
    body: [
      "We do not sell personal information. We do not share Erebrus Drop file contents with advertisers. We may share limited information in the following circumstances:",
    ],
    items: [
      "Service providers that help with hosting, security, support, payment processing, wallet connectivity, infrastructure, model delivery or catalog operations, analytics for non-Drop and non-local-AI services where used, and app operations.",
      "Blockchain networks, wallet providers, RPC providers, payment processors, or app stores when you choose to use those features.",
      "VPN and Drop node operators or infrastructure providers as technically necessary to provide routing and storage. Drop operators may see metadata and stored bytes; private stored bytes are ciphertext.",
      "AI workspace operators, shared-node providers, nearby devices, or infrastructure providers as technically necessary when you choose shared inference, LAN discovery, support, or remote AI features. Local-only AI inference is not sent to NetSepio by default.",
      "Legal, safety, or compliance recipients when we believe disclosure is required by law or necessary to protect rights, users, the Services, or the public.",
      "Business transfer recipients if NetSepio is involved in a merger, acquisition, financing, reorganization, or sale of assets.",
      "Other people or services when you intentionally publish or share a Drop file, disclose its CID, share AI outputs, export content, post publicly, or contact support.",
    ],
  },
  {
    title: "8. Cookies and Local Storage",
    body: [
      "We use cookies, local storage, and similar technologies to support authentication, wallet connection state, security, preferences, and product functionality. You can control cookies through your browser, but some features may stop working if cookies or local storage are disabled.",
      "The Drop vault key and recovery secret are not placed in localStorage or persisted app state. The raw vault key is held in memory only while unlocked and is cleared by refresh, navigation, or an explicit lock.",
      "Erebrus AI may store model catalog cache, downloaded model state, personas, settings, conversation history, prompts, and outputs locally on your device if you choose to save or cache them. Clearing app or browser data may remove that local state.",
    ],
  },
  {
    title: "9. Legal Bases for Processing",
    body: [
      "Where laws such as the GDPR apply, we process personal data under one or more legal bases:",
    ],
    items: [
      "Contract: to provide Erebrus VPN, Erebrus Drop, Erebrus AI, account access, subscriptions, and support.",
      "Legitimate interests: to secure, debug, improve, and protect the Services and users.",
      "Consent: where we ask for optional permissions or communications consent.",
      "Legal obligation: to comply with applicable law, legal process, accounting, tax, fraud prevention, and compliance obligations.",
    ],
  },
  {
    title: "10. Data Retention",
    items: [
      "Wallet authentication, organization, plan, payment, support, and operational records are retained as long as needed to provide the Services, resolve disputes, enforce Terms, maintain security, and comply with law.",
      "VPN client metadata may be retained while your client, account, or organization service is active and for a reasonable period after deletion for security, backup, audit, or legal reasons.",
      "Managed Drop files and metadata remain until deleted, expired, or removed under applicable policy. Public IPFS copies may remain outside NetSepio's control; encrypted private blocks may also persist as unreadable ciphertext on independent nodes or backups.",
      "Local Erebrus AI model files, personas, prompts, conversation history, and outputs remain on your device until you delete them, clear app data, or uninstall the app. Shared-node, support, or remote AI request metadata may be retained as needed to provide the feature, maintain security, troubleshoot, enforce Terms, and comply with law.",
      "Security logs may be retained for a limited period to detect abuse, investigate incidents, and protect the Services.",
    ],
  },
  {
    title: "11. Security",
    body: [
      "We use administrative, technical, and organizational safeguards designed to protect information. These may include access controls, encryption in transit where appropriate, logging, monitoring, secure development practices, and vendor review.",
      "No app, VPN, AI runtime, model file, blockchain, wallet, browser, local network, or transfer method can be guaranteed to be 100 percent secure. Keep your devices, wallets, operating systems, browsers, local networks, received files, prompts, and AI outputs secure.",
      "AI outputs can be inaccurate, unsafe, or unexpected. Review outputs before relying on them, sharing them, or using them in sensitive decisions.",
    ],
  },
  {
    title: "12. Your Choices and Rights",
    body: [
      "Depending on where you live, you may have rights to access, correct, delete, restrict, object to, or receive a copy of certain personal data. You may also have rights to appeal a privacy request decision or lodge a complaint with a regulator.",
    ],
    items: [
      "You can disconnect wallets, clear browser cookies, lock the Drop vault, delete managed Drop files, delete local AI models, remove personas or conversation history, disable LAN discovery where available, or uninstall the app through your device controls.",
      "California residents may have rights to know, access, delete, correct, opt out of sale or sharing, limit use of sensitive personal information, and be free from discrimination for exercising privacy rights.",
      "European Economic Area, United Kingdom, and similar-region users may have GDPR-style rights, including access, rectification, erasure, restriction, objection, portability, and withdrawal of consent where processing is based on consent.",
      "To submit a request, contact support@netsepio.com. We may need to verify your request before acting on it.",
    ],
  },
  {
    title: "13. International Transfers",
    body: [
      "NetSepio and service providers may process information in the United States and other countries. Those countries may have data protection laws different from your location. Where required, we use appropriate safeguards for international transfers.",
    ],
  },
  {
    title: "14. Children",
    body: [
      "The Services are not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us so we can review and delete it where required.",
    ],
  },
  {
    title: "15. Third-party Links and Services",
    body: [
      "The Services may link to or integrate with wallets, blockchains, app stores, operating systems, browsers, payment providers, node operators, AI model publishers, model hubs, support tools, and other third parties. Their privacy practices are governed by their own policies, not this Privacy Policy.",
    ],
  },
  {
    title: "16. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. If changes are material, we will take reasonable steps to notify users, such as updating this page or providing in-product notice. The updated policy applies when posted unless otherwise stated.",
    ],
  },
  {
    title: "17. Contact",
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
      summary="This policy covers Erebrus VPN, Erebrus Drop, and Erebrus AI, including wallet authentication, organization entitlements, VPN client management, IPFS storage, browser-side encryption, public shares, key recovery, local AI inference, LAN discovery, and shared model access."
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

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-xl font-semibold tracking-tight md:text-2xl">
            Account deletion
          </h2>
          <p className="mb-4 leading-7 text-[var(--text-2)]">
            You can request deletion of your Erebrus account and the personal data associated with it. Read the{" "}
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
