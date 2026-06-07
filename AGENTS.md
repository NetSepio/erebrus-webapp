# Erebrus - Agent Documentation

## Project Overview

Erebrus is a **Decentralized VPN (dVPN) platform** built on DePIN (Decentralized Physical Infrastructure Network) principles. It allows users to:

- **Create VPN configurations** by selecting from a global network of nodes
- **Connect wallets** for authentication (EVM, Solana, Aptos)
- **Mint VPN access NFTs** (currently non-functional)
- **Get free trial access** upon wallet sign-in

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Animation**: Framer Motion, Three.js (Globe), GSAP-ready
- **Web3**: 
  - Reown AppKit (WalletConnect)
  - Wagmi/Viem (EVM)
  - Solana Wallet Adapter
  - Aptos Wallet Adapter

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── monad-nfts/    # Monad NFT fetching
│   │   ├── nfts/          # NFT metadata
│   │   └── uploadToIPFS/  # IPFS upload endpoint
│   ├── contact/           # Contact page
│   ├── dashboard/         # VPN dashboard (main app)
│   ├── explorer/          # Network explorer
│   ├── mint/              # NFT minting page
│   ├── profile/           # User profile
│   └── usernode/[id]/     # Individual node details
├── components/
│   ├── ui/                # shadcn/ui components (100+ components)
│   ├── login/             # Wallet connection components
│   ├── profile/           # Profile components
│   └── *.tsx              # Page-specific components
├── context/               # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── appkit.tsx         # Web3 modal configuration
├── config/                # Static configurations
│   ├── globe-config.ts    # 3D globe settings
│   └── gradient-config.ts # Background gradients
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   └── utils.ts           # cn() and helpers
└── utils/                 # Static data
    └── countries.json     # Country data for nodes
```

## Key Features

### 1. Authentication Flow
- Users connect wallet via Reown AppKit
- Backend verifies wallet signature
- Free trial granted upon first sign-in
- JWT stored in cookies via `js-cookie`

### 2. VPN Configuration
- Fetch available nodes from `/api/nodes`
- Filter by location, latency, uptime
- Generate WireGuard config client-side
- Download `.conf` file

### 3. Network Visualization
- Interactive 3D globe showing active nodes
- Real-time connection arcs
- Dotted world map for node density

### 4. Dashboard
- User's active VPN configurations
- Node status monitoring
- Subscription management

## Coding Standards

### Component Structure
```typescript
"use client"; // if client-side needed

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ComponentProps {
  // Always define interfaces
}

export function ComponentName({ prop }: ComponentProps) {
  // Component logic
}
```

### Styling Guidelines
- Use **Tailwind CSS** exclusively
- Use `cn()` utility for conditional classes
- Follow **mobile-first** responsive design
- Use CSS variables for theming
- Dark mode is default

### Animation Standards
- Use `framer-motion` for React animations
- Use `motion` from "motion" for simple animations
- Keep animations under 500ms for UI interactions
- Use `will-change` sparingly for performance

## Environment Variables

Required `.env.local`:
```bash
# API
NEXT_PUBLIC_API_URL=https://api.erebrus.io

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
NEXT_PUBLIC_ALCHEMY_KEY=xxx

# IPFS
NEXT_PUBLIC_PINATA_API_KEY=xxx
NEXT_PUBLIC_PINATA_SECRET=xxx
```

## Common Issues & Solutions

### 1. Hydration Mismatch
Always use `mounted` pattern for client components:
```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### 2. Wallet Connection
- Always wrap with `AppWalletProvider`
- Use `useAccount()` from wagmi for EVM
- Use `useWallet()` from @solana for Solana

### 3. Globe Performance
- Globe is heavy - lazy load with `dynamic()`
- Disable SSR for Three.js components
- Use `Suspense` boundaries

## API Endpoints

### External APIs Used
- `https://gateway.pinata.cloud` - IPFS
- `https://api.erebrus.io` - Node data
- Alchemy - NFT data
- Monad blockchain - NFT minting

### Internal APIs
- `/api/nfts` - Fetch user NFTs
- `/api/monad-nfts` - Monad chain NFTs
- `/api/uploadToIPFS` - Upload metadata

## Future Improvements (10xdev Branch Goals)

1. ✅ **Clean up duplicate components** (HeroSection vs hero-section)
2. ✅ **Create futuristic landing page** with cyberpunk aesthetics
3. ⏳ **Fix NFT minting functionality**
4. ⏳ **Add node status indicators**
5. ⏳ **Implement real-time notifications**
6. ⏳ **Optimize bundle size**
7. ⏳ **Add comprehensive error boundaries**

## Important Notes

- This codebase has been worked on by multiple developers - be cautious of legacy patterns
- Many shadcn/ui components are pre-installed but unused
- The NFT mint feature exists but is non-functional
- Node offline status is not gracefully handled in UI
- Mobile responsiveness needs attention in several areas
