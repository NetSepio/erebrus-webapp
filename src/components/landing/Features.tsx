"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Globe,
  Lock,
  Zap,
  Wallet,
  Clock,
  Fingerprint,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Military-Grade Encryption",
    description:
      "AES-256 encryption protects your data with the same standard used by government agencies. Your traffic is unreadable to anyone intercepting it.",
    gradient: "from-cyan-500 to-blue-500",
    borderColor: "border-cyan-500/20",
  },
  {
    icon: Globe,
    title: "Global Node Network",
    description:
      "Access VPN nodes in 50+ countries. Choose the optimal location for speed or bypass geo-restrictions with a single click.",
    gradient: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/20",
  },
  {
    icon: Lock,
    title: "Zero-Log Policy",
    description:
      "We don't track, store, or share your browsing data. Your online activities remain completely private and anonymous.",
    gradient: "from-green-500 to-emerald-500",
    borderColor: "border-green-500/20",
  },
  {
    icon: Zap,
    title: "Lightning Fast Speeds",
    description:
      "Optimized server infrastructure delivers gigabit speeds. Stream 4K content, game online, and download without buffering.",
    gradient: "from-yellow-500 to-orange-500",
    borderColor: "border-yellow-500/20",
  },
  {
    icon: Wallet,
    title: "Web3 Native",
    description:
      "Connect with your crypto wallet. No email required, no personal information collected. Pure decentralized authentication.",
    gradient: "from-blue-500 to-indigo-500",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Clock,
    title: "Instant Access",
    description:
      "Get connected in seconds. No lengthy registration process—just connect your wallet and start browsing securely.",
    gradient: "from-red-500 to-rose-500",
    borderColor: "border-red-500/20",
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
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`group relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border ${feature.borderColor} backdrop-blur-sm overflow-hidden transition-all duration-500 hover:bg-white/[0.05] hover:scale-[1.02] hover:shadow-2xl`}
    >
      {/* Glow Effect */}
      <div
        className={`absolute -inset-px bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl`}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}
        >
          <div className="w-full h-full rounded-xl bg-[#020417] flex items-center justify-center">
            <feature.icon className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Text */}
        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors">
          {feature.title}
        </h3>
        <p className="text-slate-400 leading-relaxed">{feature.description}</p>
      </div>

      {/* Corner Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-tr-2xl" />
    </motion.div>
  );
}

export function Features() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden" id="features">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] -translate-y-1/2" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-300">Why Choose Erebrus</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Privacy Without
            <span className="erebrus-gradient-text"> Compromise</span>
          </h2>

          <p className="text-lg text-slate-400">
            Experience the perfect blend of security, speed, and simplicity.
            Our decentralized infrastructure ensures your data stays yours.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
