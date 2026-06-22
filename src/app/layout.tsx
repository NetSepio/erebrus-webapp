import type React from "react";
import "@/app/globals.css";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import AppChrome from "@/components/layout/AppChrome";
import { cn } from "@/lib/utils";
import "./globals.css";
import { AppKit } from "../context/appkit";
import AppWalletProvider from "@/components/AppWalletProvider";

const dmSans = DM_Sans({ subsets: ["latin"], 
  variable: "--font-dm-sans",
 });

const myFont = localFont({
  src: "../../public/fonts/Another-Xanadu.ttf",
  variable: "--font-another-xanadu",
});

export const metadata = {
  name: "Erebrus",
  description:
    "Redefining digital connectivity and unleashing the future of internet with globally accessible, secure and private network through the power of DePIN.",
  url: "https://erebrus.io",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
  openGraph: {
    type: "website",
    url: "https://erebrus.io",
    title: "Erebrus",
    description:
      "Redefining digital connectivity and unleashing the future of internet with globally accessible, secure and private network through the power of DePIN.",
  },
  alternates: {
    canonical: "https://erebrus.io",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body className={cn("min-h-screen flex flex-col", myFont.variable, dmSans.variable)}>
        <AppWalletProvider>
          <AppKit>
            <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
              <AppChrome>{children}</AppChrome>
            </ThemeProvider>
          </AppKit>
        </AppWalletProvider>
      </body>
    </html>
  );
}
