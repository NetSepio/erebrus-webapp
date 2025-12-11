"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export const Banner = () => {
  const containerRef = useRef(null);

  // Track scroll progress of this specific section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"], // Animation starts when section enters viewport, ends when it leaves
  });

  // Map scroll progress to x position: starts at right (200), ends far left (-1000)
  const x = useTransform(scrollYProgress, [0, .5, 1], [500, -1000, -2000]);

  return (
    <div ref={containerRef} className='relative overflow-hidden'>
      <motion.h1
        style={{ x }}
        className='text-[18rem] py-0 leading-none whitespace-nowrap'
      >
        DECENTRALIZED
      </motion.h1>
    </div>
  );
};
