"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { GatewayNode } from "@/lib/gateway/types";
import { hexToRgb } from "@/lib/color";
import type { GlobeMarker, GlobeRing } from "@/components/ui/globe";

const World = dynamic(() => import("@/components/ui/globe").then((m) => m.World), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#08080A]">
      <div className="h-28 w-28 animate-pulse rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 shadow-[0_0_60px_rgba(255,107,53,0.15)]" />
    </div>
  ),
});

const accentRgb = hexToRgb("#FF6B35");
const successColor = "#36D399";

/** Decorative arc targets when only one node is online — keeps the globe visually alive. */
const NETWORK_HUBS = [
  { lat: 40.71, lng: -74.01 },
  { lat: 51.51, lng: -0.13 },
  { lat: 35.68, lng: 139.69 },
  { lat: 1.35, lng: 103.82 },
];

type Arc = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

function positioned(nodes: GatewayNode[]) {
  return nodes.filter((n) => n.latitude != null && n.longitude != null);
}

function buildMarkers(nodes: GatewayNode[], selectedId?: string): GlobeMarker[] {
  return positioned(nodes).map((node) => {
    const selected = node.id === selectedId;
    return {
      lat: node.latitude!,
      lng: node.longitude!,
      size: selected ? 1.4 : 1,
      color: selected ? successColor : `rgba(${accentRgb?.r},${accentRgb?.g},${accentRgb?.b},0.95)`,
    };
  });
}

function buildRings(nodes: GatewayNode[], selectedId?: string): GlobeRing[] {
  return positioned(nodes).map((node) => ({
    lat: node.latitude!,
    lng: node.longitude!,
    color: node.id === selectedId ? successColor : `rgba(${accentRgb?.r},${accentRgb?.g},${accentRgb?.b},0.55)`,
  }));
}

function buildArcs(nodes: GatewayNode[], selectedId?: string): Arc[] {
  const online = positioned(nodes);
  if (online.length === 0) return [];

  if (online.length === 1) {
    const node = online[0]!;
    return NETWORK_HUBS.map((hub, i) => ({
      order: (i % 3) + 1,
      startLat: node.latitude!,
      startLng: node.longitude!,
      endLat: hub.lat,
      endLng: hub.lng,
      arcAlt: 0.22 + (i % 3) * 0.06,
      color:
        node.id === selectedId
          ? successColor
          : `rgba(${accentRgb?.r},${accentRgb?.g},${accentRgb?.b},0.55)`,
    }));
  }

  const hub = selectedId
    ? online.find((n) => n.id === selectedId) ?? online[0]
    : online[0];

  const arcs: Arc[] = [];
  for (const node of online) {
    if (node.id === hub?.id) continue;
    arcs.push({
      order: (arcs.length % 3) + 1,
      startLat: hub!.latitude!,
      startLng: hub!.longitude!,
      endLat: node.latitude!,
      endLng: node.longitude!,
      arcAlt: 0.18 + (arcs.length % 4) * 0.05,
      color:
        node.id === selectedId
          ? successColor
          : `rgba(${accentRgb?.r},${accentRgb?.g},${accentRgb?.b},0.7)`,
    });
  }

  if (arcs.length === 0 && hub) {
    return NETWORK_HUBS.slice(0, 3).map((target, i) => ({
      order: i + 1,
      startLat: hub.latitude!,
      startLng: hub.longitude!,
      endLat: target.lat,
      endLng: target.lng,
      arcAlt: 0.2,
      color: `rgba(${accentRgb?.r},${accentRgb?.g},${accentRgb?.b},0.6)`,
    }));
  }

  return arcs.slice(0, 24);
}

export function NodeGlobe({
  nodes,
  selectedId,
  className = "h-[280px] md:h-[470px]",
}: {
  nodes: GatewayNode[];
  selectedId?: string;
  className?: string;
}) {
  const arcs = useMemo(() => buildArcs(nodes, selectedId), [nodes, selectedId]);
  const markers = useMemo(() => buildMarkers(nodes, selectedId), [nodes, selectedId]);
  const rings = useMemo(() => buildRings(nodes, selectedId), [nodes, selectedId]);

  const globeConfig = useMemo(
    () => ({
      pointSize: 1.2,
      globeColor: "#0A0A0C",
      showAtmosphere: true,
      atmosphereColor: "#FF6B35",
      atmosphereAltitude: 0.18,
      emissive: "#FF6B35",
      emissiveIntensity: 0.22,
      shininess: 0.9,
      polygonColor: "rgba(255,255,255,0.05)",
      ambientLight: "#FF7E44",
      directionalLeftLight: "#F4F3F0",
      directionalTopLight: "#FF6B35",
      pointLight: "#FF6B35",
      arcTime: 1400,
      arcLength: 0.82,
      rings: 2,
      maxRings: 3,
      autoRotate: true,
      autoRotateSpeed: 0.45,
    }),
    []
  );

  return (
    <div className={`relative w-full overflow-hidden bg-[#08080A] ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,107,53,0.12), transparent 65%)",
        }}
      />
      <World globeConfig={globeConfig} data={arcs} markers={markers} rings={rings} />
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
          <p className="rounded-xl border border-white/[0.08] bg-black/40 px-4 py-2 font-mono text-[11px] text-[var(--text-3)] backdrop-blur-sm">
            Waiting for nodes to come online…
          </p>
        </div>
      )}
    </div>
  );
}