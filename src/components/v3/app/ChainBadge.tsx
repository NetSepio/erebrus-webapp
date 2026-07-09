import { useId } from "react";
import { cn } from "@/lib/utils";
import type { GatewayChain } from "@/lib/gateway/types";

/** Official Solana mark — three skewed bars, brand gradient, on a dark tile. */
function SolanaIcon({ size }: { size: number }) {
  const gradId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="311.7"
          x2="397.7"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="#0B0B0E" stroke="rgba(255,255,255,0.14)" />
      <g transform="translate(4.5 6.12) scale(0.0377)" fill={`url(#${gradId})`}>
        <path d="M64.6 3.8C67 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
        <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
      </g>
    </svg>
  );
}

/** Classic faceted Ethereum diamond, white on the brand indigo tile. */
function EthereumIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="#627EEA" stroke="rgba(255,255,255,0.14)" />
      <g transform="translate(7.08 4) scale(0.0384)" fill="#fff">
        <path d="M127.9 0l-2.8 9.5v275.7l2.8 2.8 128-75.7L127.9 0z" fillOpacity="0.62" />
        <path d="M127.9 0L0 212.3l127.9 75.7V0z" />
        <path d="M127.9 312.4l-1.6 1.9v98.1l1.6 4.6 128-180.3-128 75.7z" fillOpacity="0.62" />
        <path d="M127.9 417V312.4L0 236.7 127.9 417z" />
        <path d="M127.9 288l128-75.7-128-58.2V288z" fillOpacity="0.2" />
        <path d="M0 212.3l127.9 75.7V154.1L0 212.3z" fillOpacity="0.62" />
      </g>
    </svg>
  );
}

/**
 * Chain identity badge. Renders nothing when the chain is unknown — wallet-less
 * accounts (email / Google / Apple) have no chain and must not be labeled
 * Solana by default.
 */
export function ChainBadge({
  chain,
  className,
  size = "sm",
}: {
  chain?: GatewayChain | string | null;
  className?: string;
  size?: "sm" | "md";
}) {
  const known = chain === "evm" || chain === "sol" ? chain : null;
  if (!known) return null;

  const isEvm = known === "evm";
  const label = isEvm ? "ETHEREUM" : "SOLANA";
  const iconSize = size === "md" ? 20 : 16;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono uppercase tracking-wide text-[var(--text-2)]",
        size === "md" ? "text-xs" : "text-[10px]",
        className
      )}
    >
      {isEvm ? <EthereumIcon size={iconSize} /> : <SolanaIcon size={iconSize} />}
      {label}
    </span>
  );
}
