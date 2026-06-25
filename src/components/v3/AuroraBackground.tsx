"use client";

import { auroraBg } from "@/lib/design";

export function AuroraBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: auroraBg }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 90% 20%, rgba(255,107,53,0.08), transparent 55%)",
        }}
      />
    </>
  );
}