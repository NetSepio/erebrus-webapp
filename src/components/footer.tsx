import Image from "next/image";
import {
  Linkedin,
  Github,
  MessageSquare,
  Send,
  ArrowUpRight,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className='w-full flex justify-center py-8 font-sans'>
      <div
        className='w-[90%] p-8 md:p-12 rounded-3xl bg-linear-to-br from-[#010a27e0] to-[#022d8be1] backdrop-blur-xs'
        style={{
          clipPath:
            "polygon(0% 0%, calc(100% - 80px) 0%, 100% 80px, 100% 100%, 0% 100%)",
        }}
      >
        <div className='grid grid-cols-1 md:grid-cols-[1.5fr_2fr] gap-8 md:gap-12 py-12'>
          {/* Left Grid - Logo, Description, Social Icons */}
          <div className='space-y-4 md:space-y-6 md:pr-12'>
            <div className='space-y-4'>
              <Image
                src='/images/logo.png'
                alt='Erebrus Logo'
                width={50}
                height={50}
              />
              <p className='text-[#D1D5DC] leading-relaxed text-sm md:text-base'>
                Redefining digital connectivity by unlocking a secure, private,
                and globally accessible internet through the power of DePIN.
              </p>
            </div>

            {/* Social Icons */}
            <div className='flex gap-3 md:gap-4 justify-center md:justify-start'>
              <a href='#'>
                <Linkedin className='w-4 h-4 md:w-5 md:h-5 text-white' />
              </a>
              <a href='#'>
                <MessageSquare className='w-4 h-4 md:w-5 md:h-5 text-white' />
              </a>
              <a href='#'>
                <Send className='w-4 h-4 md:w-5 md:h-5 text-white' />
              </a>
              <a href='#'>
                <Github className='w-4 h-4 md:w-5 md:h-5 text-white' />
              </a>
            </div>
          </div>

          {/* Right Grid - Link Categories */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8'>
            {/* Category 1 - Explore */}
            <div className='space-y-4'>
              <h3 className='text-white font-semibold text-lg'>Explore</h3>
              <div className='space-y-2'>
                <a
                  href='https://netsepio.com/'
                  className='text-[#99A1AF] flex items-center gap-2'
                >
                  <span>About NetSepio</span>
                  <ArrowUpRight />
                </a>
                <a
                  href='https://www.cyreneai.com/'
                  className='text-[#99A1AF] flex items-center gap-2'
                >
                  <span>Meet Cyrene</span>
                  <ArrowUpRight />
                </a>
                <a
                  href='/terms'
                  className='text-[#99A1AF] flex items-center gap-2'
                >
                  <span>Terms and Conditions</span>
                  <ArrowUpRight />
                </a>
                <a
                  href='/privacy'
                  className='text-[#99A1AF] flex items-center gap-2'
                >
                  <span>Privacy Policy</span>
                  <ArrowUpRight />
                </a>
                <a
                  href='/contact'
                  className='text-[#99A1AF] flex items-center gap-2'
                >
                  <span>Contact Us</span>
                  <ArrowUpRight />
                </a>
              </div>
            </div>

            {/* Category 2 - Get Erebrus */}
            <div className='space-y-4'>
              <h3 className='text-white font-semibold text-lg'>Get Erebrus</h3>
              <div className='space-y-2'>
                <a
                  href='https://play.google.com/store/apps/details?id=com.erebrus.app'
                  className='text-[#99A1AF] flex items-center gap-2'
                >
                  <span>Play Store</span>
                  <ArrowUpRight />
                </a>
                {/* <a
                  href='https://testflight.apple.com/join/BvdARC75'
                  className='text-[#99A1AF] flex items-center gap-2'
                >
                  <span>App Store</span>
                  <ArrowUpRight />
                </a> */}
                <a
                  href='/dashboard'
                  className='text-[#99A1AF] flex items-center gap-2'
                >
                  <span>Web App</span>
                  <ArrowUpRight />
                </a>
              </div>
            </div>

            {/* Category 3 - Newsletter */}
            <div className='space-y-4'>
              <h3 className='text-white font-semibold text-lg'>Stay Updated</h3>
              <div className='space-y-3'>
                <p className='text-gray-300 text-sm'>
                  Subscribe to our newsletter for the latest updates and
                  insights.
                </p>
                <form className='space-y-3 relative'>
                  <input
                    type='email'
                    placeholder='your@email.com'
                    className='w-full px-4 py-2 bg-[#070111A6] text-[#99A1AF] rounded-lg  focus:outline-none'
                  />
                  <Send className='absolute right-3 top-3 size-4 text-white cursor-pointer' />
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
