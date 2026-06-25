import type React from "react";
import "@/app/globals.css";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import AppChrome from "@/components/layout/AppChrome";
import { cn } from "@/lib/utils";
import { AppKit } from "../context/appkit";
import AppWalletProvider from "@/components/AppWalletProvider";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "Erebrus — The sovereign internet",
  description:
    "Privacy infrastructure owned by the people who run it. Decentralized VPN and local-first Drop.",
  metadataBase: new URL("https://erebrus.io"),
  icons: { icon: "/brand/erebrus-icon.png" },
  openGraph: {
    type: "website",
    url: "https://erebrus.io",
    title: "Erebrus — The sovereign internet",
    description:
      "Decentralized VPN and local-first Drop — no clouds, no accounts, no middlemen.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={cn(
          "min-h-screen flex flex-col font-sans antialiased",
          spaceGrotesk.variable,
          ibmPlexMono.variable
        )}
      >
        <AppWalletProvider>
          <AppKit>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
              <AppChrome>{children}</AppChrome>
              <Toaster theme="dark" position="top-center" richColors />
            </ThemeProvider>
          </AppKit>
        </AppWalletProvider>
      </body>
    </html>
  );
}
