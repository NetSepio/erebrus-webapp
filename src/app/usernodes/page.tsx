"use client";
import React from "react";
import NodeDwifiStreamUser from "@/components/nodedataDwifiUser";
import NodesDataStreamDvpn from "@/components/NodesDataDvpnUser";
import { motion } from "framer-motion";
import { useWalletAuth } from "@/context/appkit";

const Dwifi = () => {
  const { isConnected, isAuthenticating } = useWalletAuth();
  const canView = isConnected;

  if (!canView) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-[#040819] via-[#092187] to-[#20253A] px-4 font-sans">
        <div className="text-center text-gray-300">
          <h2 className="text-2xl font-semibold">
            {isAuthenticating ? "Signing message…" : "Connect Your Wallet"}
          </h2>
          <p className="mt-2 text-sm">
            {isAuthenticating
              ? "Please approve the signature in your wallet to continue."
              : "Please use the Connect / Sign In button in the navbar to access your nodes."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-b from-[#040819] via-[#092187] to-[#20253A] font-sans">
      <div
        className="flex flex-col items-center justify-center lg:h-[40vw] mb-36 lg:mb-0 w-full h-full"
        style={{
          backgroundImage: 'url("/explorerhero.webp")',
          backgroundSize: "cover",
          backgroundBlendMode: "overlay",
        }}
      >
        <motion.h1
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-4xl font-another-xanadu text-gray-300 mb-8 text-center w-full lg:w-3/5"
        >
          Manage Your ÐVPN & ÐWi-Fi Nodes
        </motion.h1>
        <motion.h1
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-2xl text-white text-center"
        >
          <p>Discover data across your ÐWi-Fi network</p>
        </motion.h1>
      </div>
      <NodeDwifiStreamUser />
      <NodesDataStreamDvpn />
    </div>
  );
};

export default Dwifi;
