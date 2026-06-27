import type React from "react";
import "@/app/globals.css";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import AppChrome from "@/components/layout/AppChrome";
import { cn } from "@/lib/utils";
import { AppKit } from "../context/appkit";
import { OnlineNodesProvider } from "@/context/online-nodes";
import { Toaster } from "sonner";
import { pageMetadata } from "@/lib/seo";

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
  ...pageMetadata({
    title: "Erebrus — The sovereign internet",
    path: "/",
  }),
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: "/favicon.ico",
    apple: "/brand/erebrus-app-icon-180.png",
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
        <AppKit>
          <OnlineNodesProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
              <AppChrome>{children}</AppChrome>
              <Toaster theme="dark" position="top-center" richColors />
            </ThemeProvider>
          </OnlineNodesProvider>
        </AppKit>
      </body>
    </html>
  );
}
