"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ChevronRight,
  CloudOff,
  QrCode,
  Shield,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 18000);

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          size: Math.random() * 1.8 + 0.8,
          opacity: Math.random() * 0.45 + 0.15,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 102, 255, ${0.14 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      resize();
      createParticles();
    };

    resize();
    createParticles();
    draw();

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ opacity: 0.55 }}
    />
  );
}

const productSignals = [
  {
    icon: Shield,
    title: "Erebrus VPN",
    description: "Wallet-authenticated access to decentralized VPN nodes.",
  },
  {
    icon: QrCode,
    title: "Erebrus Drop",
    description: "Local Drop Rooms for nearby file, photo, and text transfer.",
  },
  {
    icon: CloudOff,
    title: "Local-first",
    description: "Drop transfers do not upload files to NetSepio servers.",
  },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const { scrollYProgress } = useScroll(
    mounted && containerRef.current
      ? {
          target: containerRef,
          offset: ["start start", "end start"],
        }
      : undefined,
  );

  const opacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.55], [1, 0.94]);
  const y = useTransform(scrollYProgress, [0, 0.55], [0, 80]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section
        ref={containerRef}
        className="relative flex min-h-[92svh] items-center justify-center overflow-hidden bg-[#020417] px-4 pt-28 pb-16"
      >
        <div className="relative z-10 w-full max-w-4xl text-center">
          <div className="mx-auto mb-6 h-20 w-3/4 animate-pulse rounded-lg bg-white/10" />
          <div className="mx-auto h-8 w-1/2 animate-pulse rounded-lg bg-white/10" />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[92svh] items-center justify-center overflow-hidden px-4 pt-28 pb-16 sm:px-6 lg:px-8"
    >
      <Image
        src="/background.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="z-0 object-cover opacity-25"
      />
      <div className="absolute inset-0 z-0 bg-[#020417]/75" />
      <ParticleField />

      <div
        className="absolute inset-0 z-[1] opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      />

      <motion.div
        style={{ opacity, scale, y }}
        className="relative z-10 mx-auto w-full max-w-6xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm"
        >
          <span className="flex items-center gap-2 rounded-md bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-200">
            <Shield className="h-4 w-4" />
            VPN
          </span>
          <span className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200">
            <Wifi className="h-4 w-4" />
            Drop
          </span>
          <span className="text-sm text-slate-300">
            Sovereign tools for private access and local transfer
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mx-auto mb-6 max-w-5xl text-6xl font-bold tracking-normal text-white sm:text-7xl md:text-8xl lg:text-9xl"
        >
          <span className="erebrus-gradient-text">Erebrus</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl md:text-2xl"
        >
          A privacy stack from NetSepio for decentralized VPN access and
          local-first sharing between nearby devices over Wi-Fi or hotspot.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/dashboard">
            <Button
              size="lg"
              className="erebrus-button rounded-lg px-7 py-6 text-base sm:text-lg"
            >
              <Shield className="mr-2 h-5 w-5" />
              Open VPN Dashboard
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#drop">
            <Button
              size="lg"
              variant="outline"
              className="rounded-lg border-white/20 px-7 py-6 text-base text-white hover:bg-white/5 sm:text-lg"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Explore Erebrus Drop
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {productSignals.map((signal) => (
            <div
              key={signal.title}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-sm"
            >
              <signal.icon className="mb-4 h-6 w-6 text-cyan-300" />
              <h2 className="mb-2 text-base font-semibold text-white">
                {signal.title}
              </h2>
              <p className="text-sm leading-6 text-slate-400">
                {signal.description}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-[#020417] to-transparent" />
    </section>
  );
}
