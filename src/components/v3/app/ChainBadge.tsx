import { cn } from "@/lib/utils";
import type { GatewayChain } from "@/lib/gateway/types";

function SolanaIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="solGrad" x1="4" y1="4" x2="20" y2="20">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#solGrad)" />
      <path
        d="M7 15.5h10l-1.2 1.2H5.8L7 15.5Zm10-4.2H7l1.2-1.2h10l-1.2 1.2ZM7 7.1h10L15.8 8.3H5.8L7 7.1Z"
        fill="white"
      />
    </svg>
  );
}

function EthereumIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#627EEA" />
      <path d="M12 4.5 7.5 12.2 12 10.2l4.5 2-4.5-7.7Z" fill="white" fillOpacity="0.95" />
      <path d="M7.5 12.2 12 19.5l4.5-7.3L12 14.2l-4.5-2Z" fill="white" fillOpacity="0.75" />
    </svg>
  );
}

export function ChainBadge({
  chain,
  className,
  size = "sm",
}: {
  chain?: GatewayChain | string | null;
  className?: string;
  size?: "sm" | "md";
}) {
  const isEvm = chain === "evm";
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