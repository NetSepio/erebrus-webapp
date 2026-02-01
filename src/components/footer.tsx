"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Linkedin,
  Github,
  MessageSquare,
  Send,
  ArrowUpRight,
  Twitter,
  Shield,
  Globe,
} from "lucide-react";

const footerLinks = {
  explore: [
    { label: "About NetSepio", href: "https://netsepio.com/", external: true },
    { label: "Meet Cyrene", href: "https://www.cyreneai.com/", external: true },
    { label: "Terms & Conditions", href: "/terms", external: false },
    { label: "Privacy Policy", href: "/privacy", external: false },
    { label: "Contact Us", href: "/contact", external: false },
  ],
  getErebrus: [
    {
      label: "Play Store",
      href: "https://play.google.com/store/apps/details?id=com.erebrus.app",
      external: true,
    },
    { label: "Web App", href: "/dashboard", external: false },
    { label: "Explorer", href: "/explorer", external: false },
    { label: "Documentation", href: "https://docs.erebrus.io", external: true },
  ],
  social: [
    { icon: Twitter, href: "https://twitter.com/erebrus", label: "Twitter" },
    {
      icon: Linkedin,
      href: "https://linkedin.com/company/erebrus",
      label: "LinkedIn",
    },
    {
      icon: MessageSquare,
      href: "https://discord.gg/erebrus",
      label: "Discord",
    },
    { icon: Send, href: "https://t.me/erebrus", label: "Telegram" },
    { icon: Github, href: "https://github.com/erebrus", label: "GitHub" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative w-full py-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold erebrus-gradient-text">
                EREBRUS
              </span>
            </Link>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Redefining digital connectivity by unlocking a secure, private,
              and globally accessible internet through the power of DePIN and
              Web3.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {footerLinks.social.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Explore */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Explore
                </h3>
                <ul className="space-y-3">
                  {footerLinks.explore.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        <span>{link.label}</span>
                        {link.external && (
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Get Erebrus */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-400" />
                  Get Erebrus
                </h3>
                <ul className="space-y-3">
                  {footerLinks.getErebrus.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors"
                      >
                        <span>{link.label}</span>
                        {link.external && (
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Stay Updated</h3>
                <p className="text-slate-400 text-sm">
                  Subscribe to our newsletter for the latest updates and
                  insights.
                </p>
                <form
                  className="space-y-3"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Erebrus. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link
                href="/privacy"
                className="hover:text-slate-300 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-slate-300 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="hover:text-slate-300 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
