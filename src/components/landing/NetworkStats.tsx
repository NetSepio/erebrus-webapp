"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Globe, Users, Server, Activity } from "lucide-react";

interface StatItemProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

function AnimatedCounter({
  value,
  suffix,
  delay,
}: {
  value: number;
  suffix: string;
  delay: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function StatItem({ icon: Icon, value, suffix, label, delay }: StatItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      className="relative group"
    >
      <div className="flex flex-col items-center text-center p-6 sm:p-8">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
          <Icon className="w-8 h-8 text-cyan-400" />
        </div>

        {/* Value */}
        <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">
          <AnimatedCounter value={value} suffix={suffix} delay={delay} />
        </div>

        {/* Label */}
        <div className="text-slate-400 text-lg">{label}</div>
      </div>
    </motion.div>
  );
}

export function NetworkStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const stats = [
    { icon: Globe, value: 50, suffix: "+", label: "Countries Covered" },
    { icon: Server, value: 120, suffix: "+", label: "Active Nodes" },
    { icon: Users, value: 25000, suffix: "+", label: "Users Protected" },
    { icon: Activity, value: 99, suffix: "%", label: "Uptime SLA" },
  ];

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Glass Container */}
          <div className="erebrus-glass rounded-3xl border border-white/10 p-8 sm:p-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Network at a{" "}
                <span className="erebrus-gradient-text">Glance</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Join thousands of users already protecting their privacy on our
                decentralized network
              </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <StatItem
                  key={index}
                  icon={stat.icon}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  delay={index * 150}
                />
              ))}
            </div>

            {/* Decorative Line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
