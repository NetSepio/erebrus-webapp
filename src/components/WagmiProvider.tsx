"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, optimism } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";
import { ReactNode } from "react";

// Type assertion to fix version incompatibility between wagmi and viem
const chains: any = [mainnet, polygon, arbitrum, optimism];

const config = createConfig({
  chains,
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Erebrus",
        url: "https://erebrus.io",
        iconUrl: "https://erebrus.io/favicon.ico",
      },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
});

const CustomWagmiProvider = ({ children }: { children: ReactNode }) => {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
};

export default CustomWagmiProvider;
