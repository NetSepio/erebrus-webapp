import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "font-mono text-xs tracking-[0.15em] uppercase text-[var(--accent-hi)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-white/[0.02]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AccentButton({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
}) {
  const styles = {
    primary:
      "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-hi)] shadow-[0_10px_34px_rgba(255,107,53,0.32)]",
    ghost:
      "border border-[var(--accent)]/50 bg-[var(--accent)]/14 text-[var(--accent-hi)] hover:bg-[var(--accent)]/22 hover:border-[var(--accent)]/65",
    outline:
      "border border-[var(--accent)]/55 bg-[var(--accent)]/12 text-[var(--accent-hi)] hover:bg-[var(--accent)]/20",
    danger:
      "border border-[var(--danger)]/35 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/16",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[13px] px-5 py-3 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusDot({
  color = "var(--success)",
  className,
}: {
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", className)}
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono text-[10.5px] tracking-wide uppercase text-[var(--text-3)]",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Always-visible secondary control — not hover-dependent. */
export function ActionButton({
  children,
  className,
  variant = "accent",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "accent" | "neutral" | "danger";
}) {
  const styles = {
    accent:
      "border border-[var(--accent)]/30 bg-[var(--accent)]/14 text-[var(--accent-hi)] hover:bg-[var(--accent)]/22",
    neutral:
      "border border-white/[0.12] bg-white/[0.05] text-[var(--text)] hover:bg-white/[0.09]",
    danger:
      "border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/16",
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Always-visible icon control for nav drawers and toolbars. */
export const iconButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.05] p-2 text-[var(--text-2)] transition-colors hover:border-[var(--accent)]/35 hover:bg-[var(--accent)]/10 hover:text-[var(--accent-hi)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40";

export const v3TabsListClass =
  "flex h-auto flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.04] p-1 text-[var(--text-2)]";

export const v3TabsTriggerClass =
  "rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-[var(--text-2)] transition-colors hover:border-[var(--accent)]/25 hover:text-[var(--accent-hi)] data-[state=active]:border-[var(--accent)]/35 data-[state=active]:bg-[var(--accent)]/15 data-[state=active]:text-[var(--accent-hi)] data-[state=active]:shadow-none";

export function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <Card className="p-5">
      <MonoLabel>{label}</MonoLabel>
      <div
        className="mt-2 text-[27px] font-bold tracking-tight"
        style={{ color: valueColor ?? "var(--text)" }}
      >
        {value}
      </div>
      {sub && <p className="mt-1 text-xs text-[var(--text-3)]">{sub}</p>}
    </Card>
  );
}