import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import {
  LegalPageShell,
  LegalSection,
} from "@/components/v3/marketing/LegalPageShell";
import { AccentButton } from "@/components/v3/ui";

export const metadata = pageMetadata({
  title: "Account & Data Deletion",
  description:
    "How to request deletion of your Erebrus account and associated data — in-app request, or by contacting support.",
  path: "/account-deletion",
  keywords: [
    "Erebrus account deletion",
    "delete account",
    "data deletion request",
    "NetSepio",
  ],
});

export default function AccountDeletionPage() {
  return (
    <LegalPageShell
      eyebrow="Erebrus account"
      title="Account & data deletion"
      summary="You can request that your Erebrus account and the personal data associated with it be permanently deleted. Requests can be made from inside the app or by contacting support — no app install is required."
      lastUpdated="July 14, 2026"
    >
      <div className="space-y-6">
        <LegalSection
          title="1. Request deletion from your profile"
          body={[
            "If you can sign in, the fastest way is the in-app request: sign in to the Erebrus web app, open your Profile page, and use the “Request account deletion” action. Your account requires a verified email and must have no active organization ownership or memberships (leave or transfer them first).",
            "The request is queued for processing; you will receive an email confirmation once the deletion is completed.",
          ]}
        />
        <LegalSection
          title="2. Request deletion without signing in"
          body={[
            "If you can no longer access your account (for example, you lost access to your wallet), submit a support request using the contact form with the “Account deletion” category, including the wallet address or email tied to your account so we can verify ownership.",
          ]}
        />
        <LegalSection
          title="3. What is deleted and what may be retained"
          items={[
            "Deleted: your account, profile, VPN client configurations, organization memberships, notifications, and Drop file metadata managed by the gateway.",
            "Managed Drop files you own are removed from managed nodes. Copies of public files may persist on the public IPFS network outside NetSepio's control; private files remain unreadable ciphertext without your client-held keys.",
            "Limited records (such as billing, security, audit, or abuse-prevention logs) may be retained for a reasonable period where required for legal, security, or accounting reasons, as described in our Privacy Policy.",
          ]}
        />
        <div className="flex flex-wrap gap-3">
          <Link href="/profile">
            <AccentButton className="!px-5 !py-2.5 !text-sm">
              Go to profile
            </AccentButton>
          </Link>
          <Link href="/contact?category=account-deletion">
            <AccentButton variant="outline" className="!px-5 !py-2.5 !text-sm">
              Contact support
            </AccentButton>
          </Link>
        </div>
      </div>
    </LegalPageShell>
  );
}
