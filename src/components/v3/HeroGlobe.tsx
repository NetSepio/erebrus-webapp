"use client";

import { useEffect, useMemo, useRef } from "react";
import { createHeroGlobe } from "@/lib/erebrus-globe";
import type { GatewayNode } from "@/lib/gateway/types";
import { toGlobeNodes } from "@/lib/globe-nodes";

export function HeroGlobe({
  nodes,
  hubId,
  className = "h-full",
}: {
  nodes: GatewayNode[];
  hubId?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<ReturnType<typeof createHeroGlobe> | null>(null);

  const globeNodes = useMemo(() => toGlobeNodes(nodes), [nodes]);
  const nodesKey = useMemo(
    () => globeNodes.map((n) => `${n.id}:${n.lat}:${n.lng}`).join("|"),
    [globeNodes]
  );
  const resolvedHubId = hubId ?? globeNodes[0]?.id;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const globe = createHeroGlobe(canvas, {
      nodes: globeNodes,
      hubId: resolvedHubId,
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
      className={`relative w-full overflow-hidden bg-[#0A0A0C] ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 60% at 50% 45%, rgba(255,107,53,0.06), transparent 70%)",
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}