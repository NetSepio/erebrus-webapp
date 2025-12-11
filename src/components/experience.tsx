import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import AnimatedHeader from "./ui/animated-header";

export function Experience() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section className='relative z-20 md:py-30'>
      <div className='text-center px-4'>
        <AnimatedHeader
          title='Your Content Delivery, Uninterrupted!'
          className='text-2xl md:text-3xl font-bold bg-white bg-clip-text text-transparent'
        />
        <p className='text-sm md:text-base font-sans mt-4'>
          Launch your own VPN for sovereign and private experience
        </p>
      </div>

      <div className='flex md:grid md:grid-cols-5 mx-auto gap-x-10 max-w-300 my-24 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none px-4 md:px-0'>
        {/* Card 1 */}
        <motion.div
          className='relative card pt-16 shrink-0 snap-center md:snap-align-none'
          onHoverStart={() => setHoveredCard(1)}
          onHoverEnd={() => setHoveredCard(null)}
        >
          {/* Flag image positioned outside the card */}
          <motion.div
            className='absolute z-20 size-48 left-1/2 -translate-x-1/2 flex items-center justify-center'
            initial={{ y: -60 }}
            animate={{
              y: hoveredCard === 1 ? -80 : -60,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Image src='/images/flag.png' alt='Flag' width={180} height={180} />
          </motion.div>

          {/* Flag shadow positioned inside the card */}
          <Image
            src='/images/flag-shadow.png'
            alt='Flag Shadow'
            width={200}
            height={200}
            className='absolute z-10 left-1/2 transform -translate-x-1/2'
          />

          <div
            className='rounded-3xl relative grid place-items-center p-4 space-y-6 h-80 w-56 bg-linear-to-b from-black to-[#1D4AAE]'
            style={{
              clipPath:
                "polygon(0% 0%, 100% 0%, 100% calc(100% - 60px), calc(100% - 60px) 100%, 0% 100%)",
            }}
          >
            <div className='font-sans space-y-2 self-end mb-6'>
              <h3 className='text-base text-white'>Last Mile Safe Internet</h3>
              <p className='text-sm text-[#99A1AF]'>
                No censorship or geo-restrictions with enhanced security and
                privacy.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          className='relative card pt-16 shrink-0 snap-center md:snap-align-none'
          onHoverStart={() => setHoveredCard(2)}
          onHoverEnd={() => setHoveredCard(null)}
        >
          {/* Shield image positioned outside the card */}
          <motion.div
            className='absolute z-20 size-48 left-1/2 -translate-x-1/2 flex items-center justify-center'
            initial={{ y: -60 }}
            animate={{
              y: hoveredCard === 2 ? -80 : -60,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Image
              src='/images/shield.png'
              alt='Shield'
              width={180}
              height={180}
            />
          </motion.div>

          {/* Shield shadow positioned inside the card */}
          <Image
            src='/images/shield-shadow.png'
            alt='Shield Shadow'
            width={200}
            height={200}
            className='absolute z-10 left-1/2 transform -translate-x-1/2'
          />

          <div
            className='rounded-3xl relative grid place-items-center p-4 space-y-6 h-80 w-56 bg-linear-to-b from-black to-[#1D4AAE]'
            style={{
              clipPath:
                "polygon(0% 0%, 100% 0%, 100% calc(100% - 60px), calc(100% - 60px) 100%, 0% 100%)",
            }}
          >
            <div className='font-sans space-y-2 self-end mb-6'>
              <h3 className='text-base text-white'>DNS Firewall</h3>
              <p className='text-sm text-[#99A1AF]'>
                Block adware, spyware and malware with targeted network
                protection.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          className='relative card pt-16 shrink-0 snap-center md:snap-align-none'
          onHoverStart={() => setHoveredCard(3)}
          onHoverEnd={() => setHoveredCard(null)}
        >
          {/* Map pin image positioned outside the card */}
          <motion.div
            className='absolute z-20 size-48 left-1/2 -translate-x-1/2 flex items-center justify-center'
            initial={{ y: -60 }}
            animate={{
              y: hoveredCard === 3 ? -80 : -60,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Image
              src='/images/map-pin.png'
              alt='Map pin'
              width={180}
              height={180}
            />
          </motion.div>

          {/* Map pin shadow positioned inside the card */}
          <Image
            src='/images/map-pin-shadow.png'
            alt='Map pin Shadow'
            width={200}
            height={200}
            className='absolute z-10 left-1/2 transform -translate-x-1/2'
          />

          <div
            className='rounded-3xl relative grid place-items-center p-4 space-y-6 h-80 w-56 bg-linear-to-b from-black to-[#1D4AAE]'
            style={{
              clipPath:
                "polygon(0% 0%, 100% 0%, 100% calc(100% - 60px), calc(100% - 60px) 100%, 0% 100%)",
            }}
          >
            <div className='font-sans space-y-2 self-end mb-6'>
              <h3 className='text-base text-white'>Global Coverage</h3>
              <p className='text-sm text-[#99A1AF]'>
                Access content from anywhere with our worldwide node network.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 4 */}
        <motion.div
          className='relative card pt-16 shrink-0 snap-center md:snap-align-none'
          onHoverStart={() => setHoveredCard(4)}
          onHoverEnd={() => setHoveredCard(null)}
        >
          {/* Flash image positioned outside the card */}
          <motion.div
            className='absolute z-20 size-48 left-1/2 -translate-x-1/2 flex items-center justify-center'
            initial={{ y: -60 }}
            animate={{
              y: hoveredCard === 4 ? -80 : -60,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Image
              src='/images/flash.png'
              alt='Flash'
              width={180}
              height={180}
            />
          </motion.div>

          {/* Flash shadow positioned inside the card */}
          <Image
            src='/images/flash-shadow.png'
            alt='Flash Shadow'
            width={200}
            height={200}
            className='absolute z-10 left-1/2 transform -translate-x-1/2'
          />

          <div
            className='rounded-3xl relative grid place-items-center p-4 space-y-6 h-80 w-56 bg-linear-to-b from-black to-[#1D4AAE]'
            style={{
              clipPath:
                "polygon(0% 0%, 100% 0%, 100% calc(100% - 60px), calc(100% - 60px) 100%, 0% 100%)",
            }}
          >
            <div className='font-sans space-y-2 self-end mb-6'>
              <h3 className='text-base text-white'>Lightning Fast Speeds</h3>
              <p className='text-sm text-[#99A1AF]'>
                Optimized routing and high-performance nodes ensure minimal
                latency.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card 5 */}
        <motion.div
          className='relative card pt-16 shrink-0 snap-center md:snap-align-none'
          onHoverStart={() => setHoveredCard(5)}
          onHoverEnd={() => setHoveredCard(null)}
        >
          {/* Lock image positioned outside the card */}
          <motion.div
            className='absolute z-20 size-48 left-1/2 -translate-x-1/2 flex items-center justify-center'
            initial={{ y: -60 }}
            animate={{
              y: hoveredCard === 5 ? -80 : -60,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Image src='/images/lock.png' alt='Lock' width={200} height={200} />
          </motion.div>

          {/* Lock shadow positioned inside the card */}
          <Image
            src='/images/lock-shadow.png'
            alt='Lock Shadow'
            width={200}
            height={200}
            className='absolute z-10 left-1/2 transform -translate-x-1/2'
          />

          <div
            className='rounded-3xl relative grid place-items-center p-4 space-y-6 h-80 w-56 bg-linear-to-b from-black to-[#1D4AAE]'
            style={{
              clipPath:
                "polygon(0% 0%, 100% 0%, 100% calc(100% - 60px), calc(100% - 60px) 100%, 0% 100%)",
            }}
          >
            <div className='font-sans space-y-2 self-end mb-6'>
              <h3 className='text-base text-white'>
                Military-Grade Encryption
              </h3>
              <p className='text-sm text-[#99A1AF]'>
                Your data is protected with the highest level of encryption
                available.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
