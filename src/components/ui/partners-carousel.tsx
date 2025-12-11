"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AnimatedHeader from "./animated-header";

interface PartnersCarouselProps {
  images: string[];
  title?: string;
  speed?: number;
}

export default function PartnersCarousel({
  images,
  title = "Our Partners",
  speed = 30,
}: PartnersCarouselProps) {
  const [duplicatedImages, setDuplicatedImages] = useState<string[]>([]);

  // Duplicate images to create seamless loop
  useEffect(() => {
    setDuplicatedImages([...images, ...images]);
  }, [images]);

  return (
    <div className='relative'>
      <div className='container mx-auto px-6 mb-12'>
        <AnimatedHeader title={title} />
      </div>

      {/* Main carousel container */}
      <div
        className='relative overflow-hidden rounded-3xl w-11/12 md:w-5/6  mx-auto py-8'
        style={{ backgroundImage: "url(/carousel-bg.png)" }}
      >
        {/* First row - left to right */}
        <div className='relative'>
          <div
            className='flex items-center space-x-12 animate-marquee'
            style={{ animationDuration: `${speed}s` }}
          >
            {duplicatedImages.map((src, index) => (
              <div
                key={`partner-1-${index}`}
                className='shrink-0 w-[180px] h-[100px] relative group'
              >
                <div className=' transition-all duration-300 w-full h-full flex items-center justify-center'>
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Partner logo ${index + 1}`}
                    width={120}
                    height={50}
                    className='object-contain max-h-12 transition-all duration-300 group-hover:scale-110'
                    sizes='100vw'
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Second row - right to left */}
        {/* <div className="relative mt-10">
          <div
        className="flex items-center space-x-12 animate-marquee-reverse"
        style={{ animationDuration: `${speed * 1.2}s` }}
          >
        {duplicatedImages.reverse().map((src, index) => (
          <div key={`partner-2-${index}`} className="flex-shrink-0 w-[180px] h-[100px] relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="bg-gray-800/50 p-4 rounded-xl hover:bg-gray-700/50 transition-all duration-300 w-full h-full flex items-center justify-center border border-gray-700/30 group-hover:border-blue-500/30 shadow-lg">
          <Image
            src={src || "/placeholder.svg"}
            alt={`Partner logo ${index + duplicatedImages.length / 2 + 1}`}
            width={120}
            height={50}
            className="object-contain max-h-12 transition-all duration-300 group-hover:scale-110"
             sizes='100vw'
          />
            </div>
          </div>
        ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
