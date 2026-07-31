import Link from "next/link";
import { cn } from "@/lib/utils";

type AppDownloadLinksProps = {
  appleHref: string;
  googleHref: string;
  productName: string;
  className?: string;
};

const storeLinks = [
  {
    key: "google",
    eyebrow: "Get it on",
    label: "Google Play",
    icon: GooglePlayIcon,
  },
  {
    key: "apple",
    eyebrow: "Join beta on",
    label: "TestFlight",
    icon: AppleIcon,
  },
] as const;

export function AppDownloadLinks({
  appleHref,
  googleHref,
  productName,
  className,
}: AppDownloadLinksProps) {
  const hrefs = {
    apple: appleHref,
    google: googleHref,
  };

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {storeLinks.map((store) => {
        const Icon = store.icon;

        return (
          <Link
            key={store.key}
            href={hrefs[store.key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${store.eyebrow} ${store.label} for ${productName}`}
            className="group inline-flex min-h-[58px] min-w-[178px] items-center gap-3 rounded-[14px] border border-white/[0.14] bg-black px-4 py-2.5 text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition-colors hover:border-[var(--accent)]/45 hover:bg-[#101014] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/45"
          >
            <Icon className="h-7 w-7 shrink-0" />
            <span className="text-left">
              <span className="block text-[10px] font-medium leading-none text-white/70">
                {store.eyebrow}
              </span>
              <span className="mt-1 block text-[19px] font-semibold leading-none tracking-normal">
                {store.label}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M16.49 12.72c-.03-2.59 2.12-3.84 2.22-3.9-1.22-1.78-3.1-2.02-3.75-2.04-1.58-.16-3.11.94-3.91.94-.82 0-2.05-.92-3.38-.9-1.72.03-3.34 1.02-4.22 2.58-1.82 3.15-.46 7.78 1.28 10.33.87 1.25 1.89 2.65 3.22 2.6 1.3-.05 1.78-.83 3.34-.83 1.55 0 2 .83 3.36.8 1.4-.02 2.28-1.25 3.12-2.51.99-1.43 1.39-2.85 1.4-2.92-.03-.01-2.65-1.02-2.68-4.15ZM13.92 5.1c.7-.88 1.18-2.07 1.04-3.27-1.02.04-2.3.71-3.03 1.56-.65.76-1.23 2-1.08 3.15 1.15.09 2.34-.58 3.07-1.44Z" />
    </svg>
  );
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 31" className={className}>
      <path
        d="M1.56.84C.84 1.24.38 2.02.38 3.03v24.94c0 1.01.46 1.79 1.18 2.19l.09.05 14.08-14.08v-.25L1.65.79l-.09.05Z"
        fill="#34A853"
      />
      <path
        d="m20.42 20.83-4.69-4.7v-.25l4.69-4.7.1.06 5.56 3.15c1.59.9 1.59 2.37 0 3.27l-5.56 3.15-.1.02Z"
        fill="#FBBC04"
      />
      <path
        d="m20.52 20.81-4.79-4.8L1.56 30.16c1.02.58 2.39.46 3.94-.42l15.02-8.93Z"
        fill="#EA4335"
      />
      <path
        d="M20.52 11.19 5.5 2.26C3.95 1.38 2.58 1.26 1.56 1.84l14.17 14.17 4.79-4.82Z"
        fill="#4285F4"
      />
    </svg>
  );
}
