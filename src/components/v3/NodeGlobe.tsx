"use client";

import { useEffect, useMemo, useRef } from "react";
import { createNodeGlobe } from "@/lib/erebrus-globe";
import type { GatewayNode } from "@/lib/gateway/types";
import { toGlobeNodes } from "@/lib/globe-nodes";
import landDots from "@/data/land-dots.json";

export function NodeGlobe({
  nodes,
  selectedId,
  onSelect,
  onHover,
  className = "h-[470px]",
}: {
  nodes: GatewayNode[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ReturnType<typeof createNodeGlobe> | null>(null);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);

  const globeNodes = useMemo(() => toGlobeNodes(nodes), [nodes]);
  const nodesKey = useMemo(
    () => globeNodes.map((n) => `${n.id}:${n.lat}:${n.lng}`).join("|"),
    [globeNodes]
  );

  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;
  onHoverRef.current = onHover;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const globe = createNodeGlobe(canvas, {
      nodes: globeNodes,
      selectedId,
      getSelectedId: () => selectedRef.current,
      onSelect: (id) => onSelectRef.current?.(id),
      onHover: (id) => onHoverRef.current?.(id),
      landDots: landDots as Array<[number, number]>,
    });
    controllerRef.current = globe;

    return () => {
      globe.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init canvas once
  }, []);

  useEffect(() => {
    controllerRef.current?.setNodes(globeNodes);
  }, [nodesKey, globeNodes]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#0B0B0E] ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 60% at 50% 45%, rgba(255,107,53,0.06), transparent 70%)",
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {globeNodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-xl border border-white/[0.08] bg-black/40 px-4 py-2 font-mono text-[11px] text-[var(--text-3)] backdrop-blur-sm">
            Waiting for nodes to come online…
          </p>
        </div>
      )}
    </div>
  );
}