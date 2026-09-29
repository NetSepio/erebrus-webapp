# Erebrus - Agent Documentation

## Project Overview

Erebrus is a **Decentralized VPN (dVPN) platform** built on DePIN (Decentralized Physical Infrastructure Network) principles. It allows users to:

- **Create VPN configurations** by selecting from a global network of nodes
- **Connect wallets** for authentication (EVM, Solana, Aptos)
- **Store and share files** on the decentralized Drop (IPFS) network
- **Participate in Genesis Season rewards** by operating VPN/AI nodes

## Architecture

### Tech Stack
- **Framework**: Next.js 16.2.9 with App Router
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Animation**: Framer Motion, Three.js (Globe)
- **State / Data**: TanStack React Query, js-cookie
- **Web3**: 
  - Reown AppKit (WalletConnect)
  - Wagmi/Viem (EVM)
  - Solana Wallet Adapter
  - Aptos Wallet Adapter

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated app shell
│   │   ├── admin/                # Admin console
│   │   ├── billing/              # Dodo billing return/status
│   │   ├── connect/              # VPN node picker / connect flow
│   │   ├── dashboard/            # Main VPN dashboard
│   │   ├── notifications/        # Org invite landing
│   │   ├── profile/              # User profile + activity
│   │   ├── storage/              # Drop file storage dashboard
│   │   ├── subscribe/            # Plan checkout
│   │   └── workspace/            # Org/workspace management
│   ├── (marketing)/              # Public marketing pages
│   │   ├── ai/                   # Erebrus AI landing
│   │   ├── drop/                 # Drop landing
│   │   ├── vpn/                  # VPN landing
│   │   ├── pricing/              # Plan pricing
│   │   ├── rewards/              # Genesis rewards landing
│   │   └── ...                   # business, families, firewall, etc.
│   ├── api/                      # Next.js API routes
│   │   ├── gateway/[...path]/    # Proxy to Erebrus gateway /api/v2
│   │   ├── nfts/                 # Solana NFT metadata (Helius)
│   │   ├── profile-image/        # IPFS profile image upload
│   │   └── v0/[...path]/         # Kubo WebUI proxy for Drop
│   ├── auth/                     # Wallet/OIDC callback landing
│   ├── orgs/[slug]/              # Public org profile
│   └── s/[fileId]/               # Opaque public Drop share
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── v3/                       # Page/feature components
│   │   ├── app/                  # App shell, VPN, wallet, activity
│   │   ├── admin/                # Admin console
│   │   ├── billing/              # Billing UI
│   │   ├── drop/                 # Drop dashboard
│   │   ├── marketing/            # Marketing page sections
│   │   ├── rewards/              # Genesis rewards UI
│   │   └── workspace/            # Org/node/firewall UI
│   └── layout/                   # App chrome, theme provider
├── context/                      # React contexts
│   └── appkit.tsx                # Web3 modal configuration
├── lib/                          # Utility functions
│   ├── gateway/                  # Gateway API client + types
│   ├── drop/                     # Drop client, crypto, normalize
│   ├── env.ts                    # Required env validation
│   └── utils.ts                  # cn() and helpers
├── config/                       # Static configurations
│   ├── globe-config.ts           # 3D globe settings
│   └── gradient-config.ts        # Background gradients
├── hooks/                        # Custom React hooks
└── utils/                        # Static data
    └── countries.json            # Country data for nodes
```

## Key Features

### 1. Authentication Flow
- Users connect wallet via Reown AppKit
- Backend verifies wallet signature
- Every account gets a free Basic workspace at first sign-in (no trials; access comes only from workspace plans)
- JWT stored in cookies via `js-cookie`

### Plans & limits (gateway is the source of truth)
- The gateway enforces every limit; the webapp only displays `GET /subscriptions` → `usage` and maps error `code`s via `src/lib/gateway-errors.ts`.
- VPN devices count on public nodes only: Basic 1, Starter 3 (`VPN_DEVICE_LIMIT` 409). Paused devices (`suspended_plan_limit`) still count.
- The header workspace switcher (`src/context/workspace.tsx`) is context only — it never changes limits, which come from the user's best workspace.

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

Required `.env.local` (see `src/lib/env.ts`):
```bash
# Reown AppKit project ID — https://dashboard.reown.com
NEXT_PUBLIC_PROJECT_ID=xxx

# Erebrus gateway base URL (no /api/v2 suffix; the proxy prepends it)
NEXT_PUBLIC_GATEWAY_URL=https://gateway.erebrus.io

# Helius API key — Solana NFT metadata (profile & subscribe pages)
NEXT_PUBLIC_HELIUS_API_KEY=xxx
```

Optional `.env.local`:
```bash
# Google / Apple OIDC (must also be configured in the gateway)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
NEXT_PUBLIC_APPLE_CLIENT_ID=xxx

# IPFS profile image upload / display (defaults to local Kubo)
IPFS_API_URL=http://127.0.0.1:5001
NEXT_PUBLIC_IPFS_GATEWAY_URL=http://127.0.0.1:8080/ipfs/

# Desktop app deep-link redirect URIs for /auth
NEXT_PUBLIC_ALLOWED_DESKTOP_AUTH_REDIRECT_URIS=erebrusai://auth,erebrusdrop://auth,erebrusvpn://auth
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
- `https://gateway.erebrus.io` - Erebrus gateway (`/api/v2`)
- `https://mainnet.helius-rpc.com` - Solana NFT metadata
- `https://api.ipfs.io` / local Kubo - IPFS fetch
- Alchemy - NFT data (legacy/optional)

### Internal APIs
- `/api/gateway/[...path]` - Proxy to Erebrus gateway `/api/v2`
- `/api/v0/[...path]` - Proxy to Kubo WebUI for private Drop nodes
- `/api/nfts?wallet=...` - Fetch Solana NFTs via Helius
- `/api/profile-image` - Upload profile image to IPFS

## Future Improvements

1. ✅ App Router migration and marketing/app route split
2. ✅ Gateway-aligned operator, billing, and rewards flows
3. ⏳ Add node status indicators and graceful offline handling
4. ⏳ Implement real-time notifications
5. ⏳ Optimize bundle size
6. ⏳ Add comprehensive error boundaries

## Important Notes

- This codebase has been worked on by multiple developers — be cautious of legacy patterns
- Many shadcn/ui components are pre-installed but unused
- NFT minting is no longer a standalone feature; `/mint` redirects to `/`
- Node offline status is not always gracefully handled in UI
- Mobile responsiveness needs attention in several areas

## Frontend Verification

- Run `pnpm type-check`, `pnpm lint`, and `pnpm test` from this repository.
- `pnpm test --maxWorkers=2` limits test concurrency on memory-constrained development machines.
- `pnpm exec next build --webpack` verifies the production build without running the `prebuild` installer-download script. `pnpm build` also refreshes `public/install.sh` from the upstream repository.
- Vitest uses the Node environment. Mock browser APIs and external wallet/payment services in tests; do not use real sessions or perform real payments.
- Browser wallet initialization is skipped during SSR and when the Reown project ID is missing or malformed. This does not disable email/social sign-in or replace a valid Reown project configuration.

## Browser Session Conventions

- `src/lib/auth-session.ts` owns cookie selection, shared session validation, expiry, and cross-tab notifications. API clients import it directly rather than importing the wallet SDK through `context/appkit`.
- A wallet connection is required for signing/linking, not for retaining an Erebrus session. Do not clear session cookies on wallet disconnect or add route-specific authentication exceptions.
- Stored sessions are validated through `GET /api/gateway/account/profile`. Only a 401 for the current request token invalidates the session; connectivity failures and permission errors must not log users out.
- Successful login replaces previous session cookies. Ambiguous cookies belonging to multiple accounts require explicit sign-in. Cross-tab notifications contain no credentials.
- Session regression tests run in Vitest's Node environment with mocked cookies, wallet adapters, browser events, and gateway responses; no live checkout is needed.
