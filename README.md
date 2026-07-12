# Erebrus

**The sovereign internet** — built by [NetSepio](https://netsepio.com).

[Erebrus](https://erebrus.io) is for people who want connectivity without surrendering ownership of their data, identity, or infrastructure. No single company should decide who gets online, what gets logged, or what gets sold.

---

## What NetSepio stands for

NetSepio builds open, community-run networks — not another walled garden.

We believe the internet should be **private by default**, **portable across devices**, and **owned by the people who use and operate it**. Erebrus is the consumer face of that idea: software that connects you to a global mesh of independent operators instead of routing everything through a handful of centralized providers.

---

## What you can do on erebrus.io today

### Erebrus VPN

Connect through a worldwide network of community-operated nodes — not a corporate VPN farm.

- Sign in with your **Solana or EVM wallet** (no passwords stored)
- Every account starts on the **Free** tier; upgrade a **workspace plan** for more access and seats
- Choose a node, get a **WireGuard** config, and use it on phone, laptop, or desktop
- Browse a **live network map** — see where nodes are and how the mesh is doing
- Manage your **profile**, devices, and workspace plan from one place

### Erebrus Drop

**Decentralized file storage on IPFS**, served by community-run Erebrus nodes. Store on the public network or on private nodes your organization operates. Private files are **encrypted in your browser** before upload, so node operators can never read them; public files can be shared by opaque link or by CID. Open it in the app at **/storage**.

- **Scopes** — upload to the **public network** or to a **private organization** node. Storage quota comes from your effective workspace plan.
- **Visibility** — files default to **private**. Private files are encrypted client-side; public files are stored as plaintext for open sharing.
- **Transfers** — drag-and-drop or pick multiple files; uploads stream with progress and can be cancelled or retried. Downloads stream back to your device.
- **Sharing** — public files get an **opaque share link** (`/s/<id>`). The link — not the raw CID — is the thing you hand out. You can still copy the CID for anyone who wants to fetch it directly over IPFS.
- **Resilient retrieval** — public downloads try the **hosting node's IPFS gateway first**, then fall back to the **Erebrus gateway proxy**. Because content is addressed by CID, if a node is down the same bytes are fetched from any other node that has pinned it.

#### Encryption & recovery

Private files are protected by an **account encryption vault**:

- The first time you use private storage, Drop generates a vault key **in your browser** and shows you a one-time **recovery secret**. Save it in a password manager — it is the only way to decrypt your files on a new device or after signing out, and **it cannot be reset or recovered for you**.
- Each file gets a fresh random key; the file is encrypted with **AES-256-GCM** in a Web Worker. Only the *wrapped* (re-encrypted) file key is stored alongside the file. Plaintext keys and your recovery secret never leave your browser and are never logged or persisted.
- On another device, open Drop and **unlock the vault** with your recovery secret to upload or download private files.

#### Public files & CIDs

> **A CID is an identifier, not a password.** Anyone who learns a public file's CID or share link can download it. Public files are **not encrypted** — never put sensitive content in a public file. Deleting a file removes it from your account and unpins it from managed nodes, but content already copied off the network cannot be recalled.

#### Node operators (Drop)

Operators of a **private organization node** (owner or node-operator role) can open the node's **Kubo WebUI** from the Drop dashboard. It launches through a short-lived, same-origin proxy session — the raw Kubo RPC endpoint is never exposed. Note that pinning content directly in the WebUI creates **unmanaged** pins that Drop does not track for quota, encryption, or sharing.

Public storage is allocated per user from the highest active organization
plan/seat: Free 500 MB, Starter 1 GB, Pro 5 GB, and Business 10 GB. Private
organization nodes use their own configured capacity. The account recovery
secret for private files is shown once and never sent to the gateway; losing it
can make encrypted files permanently unreadable.

### For operators & teams

- **Run a node** — contribute capacity, track uptime, earn rewards
- **Workspaces** — group nodes for your org, invite members, issue API keys
- **Admin tools** — platform operators can monitor network health and usage

---

## How it works (in plain terms)

1. **Connect your wallet** — that’s your account.
2. **Get access** — every account starts free; upgrade a workspace plan for more.
3. **Pick a node & connect** — we provision a secure tunnel to your device.
4. **Go** — use the VPN client you already trust (WireGuard).

Your traffic is meant to flow through independent operators. We don’t build a business model on logging or reselling your activity.

---

## Links

| | |
|---|---|
| **App** | [erebrus.io](https://erebrus.io) |
| **VPN** | [erebrus.io/vpn](https://erebrus.io/vpn) |
| **Drop** | [erebrus.io/drop](https://erebrus.io/drop) |
| **NetSepio** | [netsepio.com](https://netsepio.com) |
| **X** | [@netsepio](https://x.com/netsepio) |

---

## For developers

This repository powers the Erebrus website and web app. Branch flow: changes land on `main` (development deploy), then promote to `prod` for production.

The authenticated Drop dashboard is `/storage`; `/drop` remains the public
product page, and `/s/{file_id}` is the opaque public-share route. Upload and
download bodies stream through the same-origin gateway proxy. Browsers with the
File System Access API stream public downloads directly to disk; other browsers
fall back to an in-memory Blob. Private downloads are decrypted in 1 MiB
authenticated chunks in a worker, but the compatibility fallback assembles the
result before saving, so available browser memory still limits very large
encrypted downloads.

Organization owners and node operators can open a five-minute, gateway-proxied
Kubo WebUI session for private nodes. Raw Kubo RPC addresses are never displayed.
Pins made directly in Kubo are unmanaged: they do not create Drop file metadata,
consume managed quota, or appear in the Drop dashboard.

Proprietary — © NetSepio. All rights reserved.