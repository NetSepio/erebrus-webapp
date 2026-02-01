"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Main Card */}
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20" />
            <div className="absolute inset-0 backdrop-blur-xl bg-[#020417]/80" />

            {/* Animated Border */}
            <div className="absolute inset-0 rounded-3xl p-px bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-purple-500/50" />

            {/* Content */}
            <div className="relative px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24 text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white font-medium">
                  Free Trial Available
                </span>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              >
                Ready to Take Back
                <br />
                <span className="erebrus-gradient-text">Your Privacy?</span>
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
              >
                Join the decentralized revolution. Experience unrestricted,
                private internet access with the power of Web3.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="erebrus-button px-8 py-6 text-lg rounded-xl group"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/explorer">
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-6 text-lg rounded-xl text-white border-white/20 hover:bg-white/5"
                  >
                    Explore Network
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>24/7 Support</span>
                </div>
              </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
