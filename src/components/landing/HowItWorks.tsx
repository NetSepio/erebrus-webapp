"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Wallet, Globe, Shield, Download } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description:
      "Link your crypto wallet in seconds. We support MetaMask, Phantom, Petra, and 100+ other wallets.",
    color: "cyan",
  },
  {
    icon: Globe,
    title: "Choose Location",
    description:
      "Select from our global network of nodes. Pick the optimal location for speed or specific geo-access.",
    color: "purple",
  },
  {
    icon: Shield,
    title: "Get Protected",
    description:
      "Generate your unique VPN configuration with one click. Military-grade encryption activated instantly.",
    color: "green",
  },
  {
    icon: Download,
    title: "Connect & Browse",
    description:
      "Download your config file, import to WireGuard, and enjoy unrestricted, private internet access.",
    color: "blue",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-400" },
  purple: { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400" },
  green: { bg: "bg-green-500/20", border: "border-green-500/30", text: "text-green-400" },
  blue: { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400" },
};

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const colors = colorMap[step.color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative"
    >
      {/* Step Number */}
      <div className="absolute -left-4 -top-4 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg z-10">
        {index + 1}
      </div>

      {/* Card */}
      <div className="pl-8">
        <div
          className={`relative p-6 sm:p-8 rounded-2xl ${colors.bg} border ${colors.border} backdrop-blur-sm group hover:scale-[1.02] transition-all duration-500`}
        >
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
          >
            <step.icon className={`w-7 h-7 ${colors.text}`} />
          </div>

          {/* Content */}
          <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
          <p className="text-slate-400 leading-relaxed">{step.description}</p>

          {/* Hover Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>

      {/* Connector Line (except last) */}
      {index < steps.length - 1 && (
        <div className="absolute left-0 top-full h-16 w-px bg-gradient-to-b from-cyan-500/50 to-transparent hidden lg:block" />
      )}
    </motion.div>
  );
}

export function HowItWorks() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden" id="how-it-works">
      {/* Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-300">Simple & Fast</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Get Started in{" "}
            <span className="erebrus-gradient-text">4 Easy Steps</span>
          </h2>

          <p className="text-lg text-slate-400">
            No complicated setup. Connect your wallet and start browsing securely
            within minutes.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
