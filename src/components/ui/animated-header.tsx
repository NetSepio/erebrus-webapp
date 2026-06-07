"use client";

import { useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect } from "react";

interface AnimatedHeaderProps {
  title: string;
  highlight?: string;
  className?: string;
  highlightClassName?: string;
}

export default function AnimatedHeader({
  title,
  highlight = "/",
  className = "text-4xl font-bold text-center bg-white bg-clip-text text-transparent",
  highlightClassName = "text-blue-500",
}: AnimatedHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  return (
    <div ref={containerRef}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={controls}
        variants={{
          visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        }}
        className={className}
      >
        <span className={highlightClassName}>{highlight}</span>
        {title}
      </motion.h2>
    </div>
  );
}
