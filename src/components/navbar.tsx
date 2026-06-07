"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  WalletMinimal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import UserDropdown from "@/components/login/UserDropdown";
import { AuthButton } from "./AuthButton";
import { useWalletAuth } from "@/context/appkit";

const ErebrusNavbar = () => {
  // Use the updated authentication hook
  const { isConnected, isAuthenticated, isVerified } = useWalletAuth();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Helper function to get the correct authentication token
  const getAuthToken = () => {
    const solanaToken = Cookies.get("erebrus_token_solana");
    const evmToken = Cookies.get("erebrus_token_evm");
    return solanaToken || evmToken || null;
  };

  const token = getAuthToken();
  useEffect(() => {
    if (token && isAuthenticated) {
      const getRandomNumber = () => Math.floor(Math.random() * 1000);
      const imageUrl = `https://robohash.org/${getRandomNumber()}`;
      setAvatarUrl(imageUrl);
    }
  }, [token, isAuthenticated]);

  const handlePasetoClick = () => {
    // Handle paseto QR code display
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine if we're scrolling up or down
      if (currentScrollY > lastScrollY) {
        // Scrolling down
        setScrolled(true);
      } else {
        // Scrolling up
        if (currentScrollY < 50) {
          setScrolled(false);
        } else {
          setScrolled(false);
        }
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { name: "Drop", link: "/#drop" },
    { name: "Explorer", link: "/explorer" },
    {
      name: "Docs",
      link: "https://docs.netsepio.com/erebrus/",
      external: true,
    },
    { name: "Dashboard", link: "/dashboard" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: scrolled ? -100 : 0,
          opacity: scrolled ? 0 : 1,
        }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "pointer-events-none" : "pointer-events-auto"
        } ${
          lastScrollY > 50
            ? "bg-black/80 backdrop-blur-md py-3 shadow-lg"
            : "bg-transparent py-5"
        }`}
      >
        <div className='container mx-auto px-8 py-4 bg-black/30 backdrop-blur-md'>
          <div className='flex items-center justify-between'>
            {/* Logo */}
            <Link href='/' className='flex items-center'>
              <Image
                src='/images/Erebrus_logo_wordmark.webp'
                alt='Erebrus'
                width={150}
                height={40}
                className='block'
                sizes='100vw'
              />
            </Link>

            <div className='flex space-x-8'>
              {/* Desktop Navigation */}
              <div className='hidden md:flex items-center space-x-8'>
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.link}
                    className='text-white hover:text-blue-300 transition-colors duration-300 text-sm font-medium'
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              {/* Login & Verify Button Component */}
              <div className='flex items-center'>
                {isConnected && isAuthenticated && isVerified && token ? (
                  <UserDropdown
                    avatarUrl={avatarUrl}
                    handlePasetoClick={handlePasetoClick}
                    paseto={token}
                  />
                ) : (
                  <div className='hidden md:flex items-center gap-3'>
                    <div className='appkit-button-wrapper relative'>
                      <appkit-button />
                      {!isConnected && (
                        <WalletMinimal className='absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none z-10' />
                      )}
                    </div>
                    <AuthButton />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className='md:hidden'>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className='text-white focus:outline-none'
                aria-label={
                  isOpen
                    ? "Close mobile navigation menu"
                    : "Open mobile navigation menu"
                }
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className='md:hidden absolute w-full bg-black/95 backdrop-blur-md'
            >
              <div className='container mx-auto px-6 flex flex-col space-y-4 py-6'>
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.link}
                    className='text-white hover:text-blue-300 transition-colors duration-300 py-2 text-lg'
                    onClick={() => setIsOpen(false)}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className='flex flex-col space-y-3 pt-4 border-t border-white/10'>
                  {/* Mobile login buttons could go here if needed */}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default ErebrusNavbar;
