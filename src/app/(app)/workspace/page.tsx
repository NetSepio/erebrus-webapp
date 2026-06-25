"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createOrg, fetchOrgs } from "@/lib/gateway/client";
import type { GatewayOrg } from "@/lib/gateway/types";
import { AccentButton, Card } from "@/components/v3/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function WorkspacePage() {
  const [orgs, setOrgs] = useState<GatewayOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GatewayOrg["kind"]>("team");
  const [creating, setCreating] = useState(false);

  const load = () => {
    fetchOrgs()
      .then(setOrgs)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      await createOrg({ name: name.trim(), kind, slug });
      toast.success("Workspace created");
      setOpen(false);
      setName("");
      load();
    } catch {
      toast.error("Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-[var(--text-2)]">Loading workspaces…</div>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[540px] text-sm leading-relaxed text-[var(--text-2)]">
          Workspaces group the nodes you run. Open one to manage its nodes, members and
          enrollment. Operators work inside a workspace.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <AccentButton className="whitespace-nowrap">+ New workspace</AccentButton>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[var(--elevated)] text-[var(--text)]">
            <DialogHeader>
              <DialogTitle>Create workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ws-name">Name</Label>
                <Input
                  id="ws-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 border-white/10 bg-[var(--surface-2)]"
                />
              </div>
              <div>
                <Label>Kind</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as GatewayOrg["kind"])}>
                  <SelectTrigger className="mt-1 border-white/10 bg-[var(--surface-2)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AccentButton className="w-full" onClick={handleCreate} disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </AccentButton>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {orgs.map((org) => (
          <Link key={org.id} href={`/workspace/${org.id}`}>
            <Card className="h-full p-5 transition-colors hover:border-[var(--accent)]/25">
              <div className="mb-4 flex items-center gap-3.5">
                <div
                  className="h-11 w-11 shrink-0 rounded-[13px]"
                  style={{ background: "linear-gradient(135deg, #9945FF44, #FF6B3544)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-semibold">{org.name}</div>
                  <div className="text-xs capitalize text-[var(--text-3)]">{org.kind}</div>
                </div>
                {org.role && (
                  <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-[10px] uppercase text-[var(--text-2)]">
                    {org.role}
                  </span>
                )}
              </div>
              <div className="flex gap-7 border-t border-white/[0.05] pt-4">
                <div>
                  <div className="text-lg font-bold">
                    <span className="text-[var(--success)]">{org.online_nodes ?? 0}</span>
                    <span className="text-[var(--text-3)]">/{org.node_count ?? 0}</span>
                  </div>
                  <div className="font-mono text-[10.5px] uppercase text-[var(--text-3)]">
                    Nodes online
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">{org.member_count ?? 0}</div>
                  <div className="font-mono text-[10.5px] uppercase text-[var(--text-3)]">
                    Members
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {orgs.length === 0 && (
        <Card className="p-10 text-center text-[var(--text-2)]">
          No workspaces yet. Create one to start operating nodes.
        </Card>
      )}
    </div>
  );
}