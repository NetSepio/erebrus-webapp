"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hero,
  Features,
  NetworkStats,
  HowItWorks,
  CTA,
} from "@/components/landing";
import Footer from "@/components/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";

// Loading screen component
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020417]"
    >
      <div className="w-full max-w-md px-8">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold erebrus-gradient-text mb-2">
            EREBRUS
          </h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase">
            Initializing Secure Connection
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Progress Text */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-cyan-400 font-mono text-sm">{progress}%</span>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#020417] flex items-center justify-center">
        <div className="text-cyan-400 font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Erebrus - Decentralized VPN Network | Web3 Privacy</title>
        <meta
          name="description"
          content="Experience the future of internet privacy with Erebrus. Decentralized VPN network powered by DePIN. Connect with your crypto wallet and browse securely."
        />
        <meta
          name="keywords"
          content="VPN, decentralized, Web3, privacy, crypto, blockchain, DePIN, secure browsing"
        />
        <link rel="canonical" href="https://erebrus.io" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://erebrus.io" />
        <meta
          property="og:title"
          content="Erebrus - Decentralized VPN Network"
        />
        <meta
          property="og:description"
          content="Redefining digital connectivity with globally accessible, secure and private network through the power of DePIN."
        />
        <meta property="og:image" content="https://erebrus.io/og-image.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://erebrus.io" />
        <meta
          name="twitter:title"
          content="Erebrus - Decentralized VPN Network"
        />
        <meta
          name="twitter:description"
          content="Redefining digital connectivity with globally accessible, secure and private network through the power of DePIN."
        />
        <meta name="twitter:image" content="https://erebrus.io/og-image.png" />
      </Head>

      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      <main className="relative min-h-screen bg-[#020417] erebrus-bg">
        {/* Scroll Progress Indicator */}
        <ScrollProgress color="#00D4FF" height={3} />

        {/* Mesh Background Animation */}
        <div className="erebrus-mesh" />

        {/* Main Content */}
        <div className="relative z-10">
          <Hero />
          <Features />
          <NetworkStats />
          <HowItWorks />
          <CTA />
          <Footer />
        </div>
      </main>
    </>
  );
}
