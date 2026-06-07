"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  CloudOff,
  Fingerprint,
  Globe,
  Library,
  Lock,
  QrCode,
  Shield,
  Wallet,
  Wifi,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Decentralized VPN Access",
    description:
      "Create VPN clients, select available nodes, and use WireGuard-compatible configurations for private network access.",
    accent: "text-cyan-300",
    background: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  {
    icon: Globe,
    title: "Node Choice",
    description:
      "Explore the Erebrus network, compare locations, and choose the route that fits your speed, access, and trust needs.",
    accent: "text-blue-300",
    background: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Wallet,
    title: "Wallet-native Identity",
    description:
      "Sign in with supported EVM, Solana, and Aptos wallets instead of creating another password-based account.",
    accent: "text-violet-300",
    background: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
  {
    icon: Wifi,
    title: "Local Drop Rooms",
    description:
      "Move files, photos, and pasted text between nearby devices over the same Wi-Fi or hotspot connection.",
    accent: "text-emerald-300",
    background: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    icon: QrCode,
    title: "QR Join Flow",
    description:
      "Create a room on one device, scan the QR code from another, and start transferring through your local network.",
    accent: "text-teal-300",
    background: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
  {
    icon: CloudOff,
    title: "No Cloud Storage for Drop",
    description:
      "Drop Room transfers are designed to stay off NetSepio servers, with received files managed from the local Library.",
    accent: "text-amber-300",
    background: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      className={`group relative overflow-hidden rounded-lg border ${feature.borderColor} bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.055]`}
    >
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg border ${feature.borderColor} ${feature.background}`}
      >
        <feature.icon className={`h-6 w-6 ${feature.accent}`} />
      </div>

      <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-cyan-100">
        {feature.title}
      </h3>
      <p className="leading-7 text-slate-400">{feature.description}</p>
    </motion.div>
  );
}

export function Features() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative overflow-hidden py-20 sm:py-28" id="features">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-14 max-w-3xl text-center sm:mb-16"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
            <Fingerprint className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-300">One privacy ethos</span>
          </div>

          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            VPN protection and Drop transfers,{" "}
            <span className="erebrus-gradient-text">built for agency</span>
          </h2>

          <p className="text-lg leading-8 text-slate-400">
            Erebrus combines private network access with practical local
            sharing, so everyday movement of data does not always have to route
            through another cloud account.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-cyan-300" />
            No Drop analytics identifiers
          </div>
          <div className="flex items-center gap-3">
            <Library className="h-5 w-5 text-emerald-300" />
            Received files stay manageable
          </div>
          <div className="flex items-center gap-3">
            <CloudOff className="h-5 w-5 text-amber-300" />
            Local-first by default
          </div>
        </div>
      </div>
    </section>
  );
}
