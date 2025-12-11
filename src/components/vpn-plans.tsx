import { Lock, Zap, Shield, Database, Smartphone } from "lucide-react";
import AnimatedHeader from "./ui/animated-header";

export default function VPNPlans() {
  return (
    <section className='grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto my-18 px-4 relative'>
      {/* Grid 1 - Smaller */}
      <div className='md:col-span-2 p-4'>
        <AnimatedHeader
          title='OUR PLAN'
          highlightClassName='text-[#2283F6]'
          className='text-2xl md:text-3xl mb-2 text-left'
        />
      </div>

      {/* Grid 2 - Larger */}
      <div className='md:col-span-5 p-6 font-sans border-t-2 border-[#2283F6]'>
        <span className='text-xs text-[#2283F6]'>PREMIUM</span>
        <div className='space-y-2'>
          <h3 className='text-xl'>Quantum Tier Subscription</h3>
          <p className='text-sm text-[#99A1AF]'>
            Advanced security & networking features
          </p>
        </div>
        <div className='flex items-end gap-8 my-4'>
          <h4 className='text-3xl font-bold'>
            $5.99
            <span className='text-base text-[#6A7282] font-normal'>/month</span>
          </h4>
          <p className='p-2 text-xs bg-[#1449E71F] text-[#2283F6]'>SAVE 40%</p>
        </div>
        <button className='bg-linear-to-r from-[#315FC4] to-[#012D8A] text-white text-sm rounded w-full py-4 my-8'>
          Start 7-Day Free Trial
        </button>
        <div className='space-y-4'>
          <div className='flex gap-4'>
            <span className='flex items-center justify-center p-1 rounded-full bg-[#1C398E4D]'>
              <Lock color='#2283F6' className='size-4' />
            </span>
            <p className='text-[#99A1AF]'>Decentralized Zero-Trust Network</p>
          </div>
          <div className='flex gap-4'>
            <span className='flex items-center justify-center p-1 rounded-full bg-[#1C398E4D]'>
              <Shield color='#2283F6' className='size-4' />
            </span>
            <p className='text-[#99A1AF]'>Multi-layer Quantum Encryption</p>
          </div>
          <div className='flex gap-4'>
            <span className='flex items-center justify-center p-1 rounded-full bg-[#1C398E4D]'>
              <Database color='#2283F6' className='size-4' />
            </span>
            <p className='text-[#99A1AF]'>
              Real-time Threat Analysis & Prevention
            </p>
          </div>
          <div className='flex gap-4'>
            <span className='flex items-center justify-center p-1 rounded-full bg-[#1C398E4D]'>
              <Zap color='#2283F6' className='size-4' />
            </span>
            <p className='text-[#99A1AF]'>AI-powered Security Insights</p>
          </div>
          <div className='flex gap-4'>
            <span className='flex items-center justify-center p-1 rounded-full bg-[#1C398E4D]'>
              <Smartphone color='#2283F6' className='size-4' />
            </span>
            <p className='text-[#99A1AF]'>Cross-platform Secure Access</p>
          </div>
        </div>
      </div>

      {/* Grid 3 - Larger */}
      <div className='md:col-span-5 p-4 md:p-6 font-sans border-t-2 border-[#2283F6]'>
        <div className='flex gap-4'>
          <div className='bg-[#2283F6] rounded w-1 h-6'></div>
          <h3 className='text-lg md:text-xl'>Advanced Features</h3>
        </div>
        <div className='border-b border-[#1E2939] py-6 md:py-8 flex gap-4 text-sm md:text-base'>
          <span className='text-[#2283F6] shrink-0'>01</span>
          <div>
            <h4 className='text-[#F3F4F6]'>Military-Grade Security</h4>
            <p className='text-[#6A7282] text-xs md:text-sm'>
              256-bit AES encryption with perfect forward secrecy
            </p>
          </div>
        </div>
        <div className='border-b border-[#1E2939] py-6 md:py-8 flex gap-4 text-sm md:text-base'>
          <span className='text-[#2283F6] shrink-0'>02</span>
          <div>
            <h4 className='text-[#F3F4F6]'>Enhanced Privacy Protocol</h4>
            <p className='text-[#6A7282] text-xs md:text-sm'>
              Distributed node architecture with zero-knowledge validation
            </p>
          </div>
        </div>
        <div className='border-b border-[#1E2939] py-6 md:py-8 flex gap-4 text-sm md:text-base'>
          <span className='text-[#2283F6] shrink-0'>03</span>
          <div>
            <h4 className='text-[#F3F4F6]'>Complete Data Sovereignty</h4>
            <p className='text-[#6A7282] text-xs md:text-sm'>
              Full control over your digital footprint with no logging policy
            </p>
          </div>
        </div>
        <div className='border-b border-[#1E2939] py-6 md:py-8 flex gap-4 text-sm md:text-base'>
          <span className='text-[#2283F6] shrink-0'>04</span>
          <div>
            <h4 className='text-[#F3F4F6]'>Optimized Connection Routing</h4>
            <p className='text-[#6A7282] text-xs md:text-sm'>
              AI-driven path optimization for minimal latency
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
