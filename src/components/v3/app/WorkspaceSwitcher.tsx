"use client";

import Link from "next/link";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/context/workspace";
import { memberRoleLabel } from "@/lib/gateway/member-labels";
import { orgPlanLabel } from "@/lib/org-plans";
import { cn } from "@/lib/utils";

/**
 * Header workspace switcher. Switching changes which workspace the app shows
 * and manages (nodes, files, members, billing) — never the plan limits, which
 * always come from the user's best workspace.
 */
export function WorkspaceSwitcher() {
  const { orgs, selectedOrg, selectOrg, usage, entitlement } = useWorkspace();
  const workspaces = orgs.filter((o) => o.id);
  if (workspaces.length === 0 || !selectedOrg) return null;

  const planSource = usage?.entitlement_org?.name ?? entitlement.org?.name;
  const planLabel = orgPlanLabel(usage?.entitlement_org?.plan ?? entitlement.org?.plan ?? "personal.basic");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex max-w-[220px] items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--accent)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        aria-label={`Workspace: ${selectedOrg.name}. Switch workspace`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{selectedOrg.name}</span>
          <span className="block truncate text-[11px] text-[var(--text-3)]">{orgPlanLabel(selectedOrg.plan)}</span>
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-[var(--text-3)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 border-white/10 bg-[#14110F] text-[var(--text)]">
        <DropdownMenuLabel className="text-xs font-normal text-[var(--text-3)]">
          Your plan: <span className="text-[var(--accent-hi)]">{planLabel}</span>
          {planSource ? ` · from ${planSource}` : ""}
          <span className="mt-1 block">Switching changes what you view and manage, not your limits.</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        {workspaces.map((org) => {
          const active = org.id === selectedOrg.id;
          return (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => selectOrg(org.id)}
              className={cn("flex cursor-pointer items-start gap-2 py-2", active && "bg-white/[0.04]")}
            >
              <Check size={14} className={cn("mt-0.5 shrink-0", active ? "text-[var(--accent-hi)]" : "opacity-0")} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{org.name}</span>
                <span className="block truncate text-[11px] text-[var(--text-3)]">
                  {orgPlanLabel(org.plan)}
                  {org.role ? ` · ${memberRoleLabel(org.role)}` : ""}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem asChild className="cursor-pointer text-sm text-[var(--accent-hi)]">
          <Link href="/workspace">Manage workspaces</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
