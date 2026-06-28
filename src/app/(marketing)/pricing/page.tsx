import { MarketingNav } from "@/components/v3/marketing/MarketingNav";
import { MarketingFooter } from "@/components/v3/marketing/MarketingFooter";
import { PricingPageContent } from "@/components/v3/marketing/PricingPage";

export default function PricingPage() {
  return (
    <>
      <MarketingNav variant="platform" />
      <PricingPageContent />
      <MarketingFooter />
    </>
  );
}