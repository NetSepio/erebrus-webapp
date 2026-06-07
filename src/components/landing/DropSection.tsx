"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  CloudOff,
  Files,
  Library,
  Link2,
  QrCode,
  ScanLine,
  Share2,
  Smartphone,
  TextCursorInput,
  Trash2,
  Wifi,
} from "lucide-react";

const dropCapabilities = [
  {
    icon: Files,
    title: "Files and photos",
    description: "Share documents, media, screenshots, and camera roll items.",
  },
  {
    icon: TextCursorInput,
    title: "Pasted text",
    description: "Move snippets, notes, links, and one-off text between devices.",
  },
  {
    icon: ScanLine,
    title: "QR room join",
    description: "Scan the room code from a nearby device to connect quickly.",
  },
  {
    icon: Wifi,
    title: "Wi-Fi or hotspot",
    description: "Transfer over the local network you already control.",
  },
  {
    icon: Library,
    title: "Local Library",
    description: "View, share, or delete received files from the device Library.",
  },
  {
    icon: Link2,
    title: "Browser Drop link",
    description: "Use a lightweight web link for simple browser-based transfers.",
  },
];

const noCollection = [
  "No file uploads to NetSepio servers for Drop Room transfers",
  "No analytics collection for Erebrus Drop usage",
  "No advertising identifiers, contact lists, account profiles, or location history",
];

const roomSteps = [
  "Create a Drop Room on the sending or receiving device.",
  "Scan the QR code or open the local browser Drop link from another device.",
  "Transfer files, photos, or text directly across Wi-Fi or hotspot.",
  "Manage received files from the Library when the transfer is complete.",
];

export function DropSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section
      id="drop"
      className="relative overflow-hidden py-20 sm:py-28"
      aria-labelledby="drop-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,185,129,0.06),transparent_42%,rgba(14,165,233,0.05))]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              <Smartphone className="h-4 w-4" />
              Erebrus Drop
            </div>

            <h2
              id="drop-heading"
              className="mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl"
            >
              Move data between nearby devices without making the cloud the
              middleman.
            </h2>

            <p className="mb-8 text-lg leading-8 text-slate-300">
              Erebrus Drop helps you move files, photos, and text between
              nearby devices using a local Drop Room over Wi-Fi or hotspot.
              Create a room, scan the QR code from another device, and transfer
              directly through your local network.
            </p>

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {noCollection.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4"
                >
                  <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <span className="text-sm leading-6 text-slate-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <QrCode className="h-5 w-5 text-cyan-300" />
                How a Drop Room works
              </h3>
              <ol className="space-y-3">
                {roomSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-slate-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-semibold text-cyan-200">
                      {index + 1}
                    </span>
                    <span className="leading-6">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#05091f] p-4 shadow-2xl shadow-black/30">
              <div className="mb-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Drop Room</p>
                  <p className="text-xs text-slate-400">Local network ready</p>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  <Wifi className="h-3.5 w-3.5" />
                  Nearby
                </div>
              </div>

              <Image
                src="/devices.png"
                alt="Erebrus mobile and desktop devices"
                width={912}
                height={752}
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="h-auto w-full rounded-lg border border-white/10 bg-black/20 object-contain"
              />

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-center">
                  <Share2 className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
                  <p className="text-xs text-slate-300">Share</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-center">
                  <Library className="mx-auto mb-2 h-5 w-5 text-emerald-300" />
                  <p className="text-xs text-slate-300">Library</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-center">
                  <Trash2 className="mx-auto mb-2 h-5 w-5 text-rose-300" />
                  <p className="text-xs text-slate-300">Delete</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {dropCapabilities.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              <item.icon className="mb-4 h-6 w-6 text-cyan-300" />
              <h3 className="mb-2 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="leading-7 text-slate-400">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-3 text-xl font-semibold text-white">
            Why Erebrus Drop matters
          </h3>
          <p className="max-w-4xl leading-8 text-slate-300">
            Erebrus Drop is built for people who want practical digital agency.
            It gives you a simple way to move data between your own devices or
            trusted nearby users without routing every transfer through a cloud
            service. Like Erebrus VPN, it reflects the NetSepio ethos of
            sovereignty, privacy, and helping people operate with more
            individual agency in a digitally surveilled world.
          </p>
        </div>
      </div>
    </section>
  );
}
