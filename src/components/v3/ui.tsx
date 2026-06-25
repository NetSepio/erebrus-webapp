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
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-hi)] shadow-[0_10px_34px_rgba(255,107,53,0.32)]",
    ghost:
      "bg-white/[0.04] text-[var(--text)] border border-white/[0.12] hover:bg-white/[0.08]",
    danger: "bg-transparent text-[var(--danger)] hover:bg-[var(--danger)]/10",
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