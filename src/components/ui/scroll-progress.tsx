"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

interface ScrollProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top" | "bottom";
  color?: string;
  height?: number;
  opacity?: number;
  className?: string;
}

export const ScrollProgress = ({
  position = "top",
  color = "#3b82f6",
  height = 4,
  opacity = 0.8,
  className,
  ...props
}: ScrollProgressProps) => {
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className={className}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          [position]: 0,
          height,
          background: color,
          opacity: 0,
          transformOrigin: "0%",
          zIndex: 50,
        }}
        {...(props as React.ComponentPropsWithoutRef<"div">)}
      />
    );
  }

  return (
    <motion.div
      className={className}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        [position]: 0,
        height,
        background: color,
        opacity,
        transformOrigin: "0%",
        zIndex: 50,
        scaleX,
      }}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.div>)}
    />
  );
};
