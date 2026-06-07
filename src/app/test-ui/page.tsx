"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { globeConfig, sampleArcs } from "@/config/globe-config";
import GradientBlinds from "@/components/ui/gradient-blinds";
import { Scroll } from "lucide-react";
import {ScrollVelocity} from "@/components/ui/scroll-velocity";

const World = dynamic(
  () => import("@/components/ui/globe").then((m) => m.World),
  {
    ssr: false,
    loading: () => (
      <div className='flex items-center justify-center min-h-screen bg-black'>
        <div className='text-white'>Loading Globe...</div>
      </div>
    ),
  }
);

export default function TestUIPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-black'>
        <div className='text-white'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='h-screen w-full bg-black overflow-hidden'>
      <div style={{ width: "100%", height: "600px", position: "absolute" }}>
        <GradientBlinds
          gradientColors={["#FF9FFC", "#5227FF"]}
          angle={0}
          noise={0.3}
          blindCount={12}
          blindMinWidth={50}
          spotlightRadius={0.5}
          spotlightSoftness={1}
          spotlightOpacity={1}
          mouseDampening={0.15}
          distortAmount={0}
          shineDirection='left'
          mixBlendMode='lighten'
        />
      </div>
      <ScrollVelocity texts={['DECENTRALIZED']} velocity={50} className="custom-scroll-text" />
      {/* <div className='size-11/12 mx-auto'>
        <World data={sampleArcs} globeConfig={globeConfig} />
      </div> */}
    </div>
  );
}
