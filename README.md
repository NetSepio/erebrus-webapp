# 🌐 Erebrus - Decentralized VPN Network

> Redefining digital connectivity and unleashing the future of internet with globally accessible, secure and private network through the power of DePIN.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)](https://tailwindcss.com)
[![Web3](https://img.shields.io/badge/Web3-Ready-3C3C3D)](https://web3js.org)

## ✨ Features

- 🔐 **Decentralized VPN** - Connect to a global network of community-operated nodes
- 💼 **Web3 Authentication** - Sign in with EVM, Solana, or Aptos wallets
- 🎁 **Free Trial** - Get instant VPN access upon wallet connection
- 🌍 **Global Node Network** - Choose from nodes across 30+ countries
- 🖼️ **NFT Access Pass** - Mint VPN access as NFTs (coming soon)
- 📊 **Network Explorer** - Real-time visualization of active nodes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/erebrus-webapp.git
cd erebrus-webapp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🏗️ Architecture

```
erebrus-webapp/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── dashboard/    # VPN configuration dashboard
│   │   ├── explorer/     # Network node explorer
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── login/       # Wallet connection
│   ├── context/         # React contexts
│   └── lib/             # Utilities
├── public/              # Static assets
└── tailwind.config.ts   # Theme configuration
```

## 🔧 Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.erebrus.io

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key

# IPFS (for NFT metadata)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_key
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret
```

## 📝 Development

### Branch Strategy
- `main` - Production branch
- `10xdev` - Active development branch

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Tailwind CSS for styling
- Framer Motion for animations

### Key Commands
```bash
npm run dev      # Start dev server with Turbo
npm run build    # Production build
npm run lint     # Run ESLint
```

## 🌟 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Components**: [shadcn/ui](https://ui.shadcn.com)
- **Animation**: [Framer Motion](https://www.framer.com/motion)
- **3D Graphics**: [Three.js](https://threejs.org) + React Three Fiber
- **Web3**: 
  - [Reown AppKit](https://reown.com/appkit) - Wallet connection
  - [Wagmi](https://wagmi.sh) - EVM interactions
  - [Solana Wallet Adapter](https://github.com/anza-xyz/wallet-adapter)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🔗 Links

- [Website](https://erebrus.io)
- [Documentation](https://docs.netsepio.com)
- [Twitter](https://x.com/netsepio)

---

<p align="center">Built with ❤️ by the NetSepio Team</p>
