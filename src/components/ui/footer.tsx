"use client";
import type React from "react";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { ChevronUp, Send, Github, Linkedin, MessageSquare } from "lucide-react";
import Image from "next/image";
import { Vortex } from "./vortex";

interface ExpandedSections {
  explore: boolean;
  getErebrus: boolean;
}

const DarkFooter: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<ExpandedSections>({
    explore: false,
    getErebrus: false,
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const toggleSection = (section: keyof ExpandedSections): void => {
    setExpanded({
      ...expanded,
      [section]: !expanded[section],
    });
  };

  return (
    <footer className='bg-black border-t font-sans border-gray-800 relative z-10'>
      {/* Make sure the footer content is above the Vortex */}
      <div className='relative z-10 max-w-6xl mx-auto px-6 py-16'>
        {/* Main footer content */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-10'>
          {/* Brand column */}
          <div className='space-y-6'>
            <div className='flex items-center'>
              <Image
                src='/images/Erebrus_logo_wordmark.webp'
                alt='Erebrus Logo'
                width={150}
                height={40}
                className='h-auto'
                sizes='100vw'
              />
            </div>
            <p className='text-sm text-gray-300'>
              Redefining digital connectivity by unlocking a secure, private,
              and globally accessible internet through the power of DePIN.
            </p>
            <div className='flex space-x-5'>
              <a
                href='https://www.linkedin.com/company/netsepio/'
                className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                aria-label='LinkedIn'
              >
                <Linkedin size={20} />
              </a>
              <a
                href='https://discordapp.com/invite/5uaFhNpRF6'
                className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                aria-label='Discord'
              >
                <MessageSquare size={20} />
              </a>
              <a
                href='https://x.com/netsepio'
                className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                aria-label='X (Twitter)'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M10.5 4.5h3v3h-3z'></path>
                  <path d='M14.5 4.5h3v3h-3z'></path>
                  <path d='M14.5 8.5h3v3h-3z'></path>
                  <path d='M10.5 8.5h3v3h-3z'></path>
                  <path d='M6.5 8.5h3v3h-3z'></path>
                  <path d='M6.5 12.5h3v3h-3z'></path>
                  <path d='M10.5 12.5h3v3h-3z'></path>
                  <path d='M14.5 12.5h3v3h-3z'></path>
                  <path d='M18.5 8.5h3v3h-3z'></path>
                </svg>
              </a>
              <a
                href='https://t.me/NetSepio'
                className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                aria-label='Telegram'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M22 3L2 10l9 3 3 9 8-19z'></path>
                  <path d='M22 3L13 13'></path>
                </svg>
              </a>
              <a
                href='https://github.com/Netsepio'
                className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                aria-label='GitHub'
              >
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Explore Column */}
          <div>
            <div
              className='flex justify-between items-center cursor-pointer mb-6 md:cursor-default'
              onClick={() => toggleSection("explore")}
            >
              <h3 className='text-white font-semibold text-lg'>Explore</h3>
              <ChevronUp
                className={`md:hidden transition-transform duration-300 ${
                  expanded.explore ? "transform rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            <ul
              className={`space-y-4 overflow-hidden transition-all duration-300 ${
                expanded.explore ? "max-h-60" : "max-h-0 md:max-h-60"
              }`}
            >
              <li>
                <a
                  href='https://netsepio.com/'
                  className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                >
                  About NetSepio ↗
                </a>
              </li>
              <li>
                <a
                  href='https://www.cyreneai.com/'
                  className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                >
                  Meet CyreneAI ↗
                </a>
              </li>
              <li>
                <a
                  href='https://erebrus.io/terms'
                  className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                >
                  Terms and Conditions ↗
                </a>
              </li>
              <li>
                <a
                  href='https://erebrus.io/privacy'
                  className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                >
                  Privacy Policy ↗
                </a>
              </li>
              <li>
                <a
                  href='https://erebrus.io/contact'
                  className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                >
                  Contact Us ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Get Erebrus Column */}
          <div>
            <div
              className='flex justify-between items-center cursor-pointer mb-6 md:cursor-default'
              onClick={() => toggleSection("getErebrus")}
            >
              <h3 className='text-white font-semibold text-lg'>Get Erebrus</h3>
              <ChevronUp
                className={`md:hidden transition-transform duration-300 ${
                  expanded.getErebrus ? "transform rotate-180" : ""
                }`}
                size={18}
              />
            </div>
            <ul
              className={`space-y-4 overflow-hidden transition-all duration-300 ${
                expanded.getErebrus ? "max-h-60" : "max-h-0 md:max-h-60"
              }`}
            >
              <li>
                <a
                  href='https://play.google.com/store/apps/details?id=com.erebrus.app'
                  className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                >
                  Play Store ↗
                </a>
              </li>
              {/* <li>
                  <a
                    href="https://testflight.apple.com/join/BvdARC75"
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-300"
                  >
                    App Store ↗
                  </a>
                </li> */}
              <li>
                <a
                  href='#'
                  className='text-gray-400 hover:text-blue-400 transition-colors duration-300'
                >
                  WebApp ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className='text-white font-semibold text-lg mb-6'>
              Stay Updated
            </h3>
            <p className='text-gray-300 text-sm mb-5'>
              Subscribe to our newsletter for the latest updates and insights.
            </p>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='relative'>
                <label htmlFor='newsletter-email' className='sr-only'>
                  Email address for newsletter subscription
                </label>
                <input
                  id='newsletter-email'
                  type='email'
                  value={email}
                  onChange={handleEmailChange}
                  placeholder='your@email.com'
                  className='w-full bg-gray-900/70 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                />
                <button
                  type='submit'
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-400 transition-colors duration-300'
                  aria-label='Subscribe'
                >
                  <Send size={18} />
                </button>
              </div>
              {subscribed && (
                <div className='text-green-400 text-sm'>
                  Thanks for subscribing!
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DarkFooter;
