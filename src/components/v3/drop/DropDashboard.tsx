"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, AccentButton, MonoLabel } from "@/components/v3/ui";
import { DropUsageCard } from "./DropUsageCard";
import { DropNodePicker } from "./DropNodePicker";
import { DropUploadPanel } from "./DropUploadPanel";
import { DropFileList } from "./DropFileList";
import { DropVaultPanel } from "./DropVaultPanel";
import { DropWebuiLauncher } from "./DropWebuiLauncher";
import { useWalletAuth } from "@/context/appkit";
import { fetchOrgs, GatewayApiError } from "@/lib/gateway/client";
import { resolveEffectiveEntitlement } from "@/lib/entitlements";
import { canManageOrgNodes } from "@/lib/gateway/org-permissions";
import {
  fetchDropNodes,
  fetchDropUsage,
  fetchDropFiles,
  deleteDropFile,
  createDropWebuiSession,
} from "@/lib/drop/client";
import { downloadDropFile } from "@/lib/drop/download";
import { useDropUploads, type PrepareContent } from "@/hooks/use-drop-uploads";
import { useDropVault } from "@/hooks/use-drop-vault";
import { makeDecryptor, makeEncryptingPrepare } from "@/lib/drop/encrypt-upload";
import { hashFileInWorker } from "@/lib/drop/crypto-worker-client";
import type { GatewayOrg } from "@/lib/gateway/types";
import type {
  DropFile,
  DropNode,
  DropScope,
  DropUsage,
  DropVisibility,
} from "@/lib/drop/types";

interface ScopeChoice {
  key: string;
  label: string;
  scope: DropScope;
  orgId: string | null;
}

export function DropDashboard() {
  const { isAuthenticated } = useWalletAuth();

  const [orgs, setOrgs] = useState<GatewayOrg[]>([]);
  const [scopeKey, setScopeKey] = useState("public");

  const [nodes, setNodes] = useState<DropNode[]>([]);
  const [nodesLoading, setNodesLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<DropNode | null>(null);

  const [usage, setUsage] = useState<DropUsage | null>(null);
  const [files, setFiles] = useState<DropFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [visibility, setVisibility] = useState<DropVisibility>("private");
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const [webuiBusy, setWebuiBusy] = useState(false);

  const scopeChoices = useMemo<ScopeChoice[]>(() => {
    const choices: ScopeChoice[] = [
      { key: "public", label: "Public network", scope: "public", orgId: null },
    ];
    for (const org of orgs) {
      choices.push({
        key: `org:${org.id}`,
        label: org.name,
        scope: "private",
        orgId: org.id,
      });
    }
    return choices;
  }, [orgs]);

  const activeScope = useMemo(
    () => scopeChoices.find((c) => c.key === scopeKey) ?? scopeChoices[0],
    [scopeChoices, scopeKey]
  );

  const entitlement = useMemo(() => resolveEffectiveEntitlement(orgs), [orgs]);
  const activeOrg = useMemo(
    () => orgs.find((org) => org.id === activeScope?.orgId) ?? null,
    [orgs, activeScope]
  );
  const canOpenWebui =
    activeScope?.scope === "private" &&
    (activeOrg?.role === "owner" || activeOrg?.role === "node_operator");

  const activeOrg = useMemo(
    () => (activeScope?.orgId ? orgs.find((o) => o.id === activeScope.orgId) ?? null : null),
    [orgs, activeScope]
  );
  const canOperateNodes = !!activeOrg && canManageOrgNodes(activeOrg);

  const vault = useDropVault();
  const { getVaultKey } = vault;

  const refreshFiles = useCallback(async () => {
    if (!isAuthenticated || !activeScope) return;
    setFilesLoading(true);
    try {
      const [f, u] = await Promise.all([
        fetchDropFiles(activeScope.orgId ?? undefined).catch(() => []),
        fetchDropUsage(activeScope.orgId ?? undefined).catch(() => null),
      ]);
      setFiles(f);
      setUsage(u);
    } finally {
      setFilesLoading(false);
    }
  }, [isAuthenticated, activeScope]);

  // Private files are encrypted client-side before upload; public files are
  // sent as-is. The encryptor requires an unlocked vault.
  const prepare = useMemo<PrepareContent>(() => {
    const encrypt = makeEncryptingPrepare(getVaultKey);
    return async (item, signal) => {
      if (item.visibility === "private") return encrypt(item, signal);
      return {
        blob: item.file,
        contentType: item.file.type || "application/octet-stream",
        encrypted: false,
        sha256: await hashFileInWorker(item.file),
      };
    };
  }, [getVaultKey]);

  const decryptor = useMemo(() => makeDecryptor(getVaultKey), [getVaultKey]);

  const uploads = useDropUploads({ prepare, onComplete: refreshFiles });

  // Load the caller's organizations once authenticated.
  useEffect(() => {
    if (!isAuthenticated) {
      setOrgs([]);
      return;
    }
    let active = true;
    fetchOrgs()
      .then((o) => active && setOrgs(o))
      .catch(() => active && setOrgs([]));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Load eligible nodes whenever the scope changes.
  useEffect(() => {
    if (!isAuthenticated || !activeScope) return;
    let active = true;
    setNodesLoading(true);
    setSelectedNode(null);
    fetchDropNodes(activeScope.scope, activeScope.orgId ?? undefined)
      .then((list) => {
        if (!active) return;
        setNodes(list);
        const firstEligible = list.find(
          (n) => n.online && n.accepting && n.capacity !== "full"
        );
        setSelectedNode(firstEligible ?? null);
      })
      .catch(() => active && setNodes([]))
      .finally(() => active && setNodesLoading(false));
    return () => {
      active = false;
    };
  }, [isAuthenticated, activeScope]);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  // Private org nodes default to private; a public node's first-use default is
  // also private so a file is never made public by accident.
  useEffect(() => {
    if (activeScope?.scope === "private") setVisibility("private");
  }, [activeScope]);

  const vaultLockedForPrivate = visibility === "private" && vault.status !== "unlocked";
  const uploadDisabled = !selectedNode || vaultLockedForPrivate;
  const uploadDisabledReason = nodesLoading
    ? "Loading nodes…"
    : nodes.length === 0
      ? "No eligible nodes available in this scope."
      : !selectedNode
        ? "Select an online node to upload."
        : vaultLockedForPrivate
          ? "Unlock your encryption vault to upload private files."
          : undefined;

  const handleFiles = useCallback(
    (picked: File[]) => {
      if (!selectedNode || !activeScope) return;
      uploads.enqueue(
        picked.map((file) => ({
          file,
          scope: activeScope.scope,
          orgId: activeScope.orgId,
          nodeId: selectedNode.id,
          visibility,
        }))
      );
    },
    [selectedNode, activeScope, visibility, uploads]
  );

  const handleDownload = useCallback(
    async (file: DropFile) => {
      if (file.encrypted && vault.status !== "unlocked") {
        toast.error("Unlock your encryption vault to download this file.");
        return;
      }
      setBusyFileId(file.id);
      try {
        await downloadDropFile(file, { decrypt: decryptor });
        toast.success(`Downloaded ${file.filename}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : `Could not download ${file.filename}`
        );
      } finally {
        setBusyFileId(null);
      }
    },
    [decryptor, vault.status]
  );

  const handleDelete = useCallback(
    async (file: DropFile) => {
      setBusyFileId(file.id);
      try {
        await deleteDropFile(file.id);
        toast.success("File deleted");
        await refreshFiles();
      } catch (err) {
        toast.error(err instanceof GatewayApiError ? err.message : "Delete failed");
      } finally {
        setBusyFileId(null);
      }
    },
    [refreshFiles]
  );

  const handleShare = useCallback(async (file: DropFile) => {
    // Public share uses an opaque, app-hosted link keyed by file id — never the
    // raw CID, which is not an access-control mechanism.
    const url = `${window.location.origin}/s/${file.id}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  }, []);

  const handleOpenWebui = useCallback(async () => {
    if (!activeScope?.orgId || !selectedNode) return;
    const popup = window.open("about:blank", "_blank");
    setWebuiBusy(true);
    try {
      const session = await createDropWebuiSession(activeScope.orgId, selectedNode.id);
      document.cookie = [
        `erebrus_drop_webui=${encodeURIComponent(session.session_id)}`,
        "Path=/api/v0",
        `Max-Age=${session.expires_in}`,
        "SameSite=Strict",
        "Secure",
      ].join("; ");
      if (popup) {
        popup.opener = null;
        popup.location.replace(session.url);
      } else {
        window.location.assign(session.url);
      }
    } catch (err) {
      popup?.close();
      toast.error(err instanceof Error ? err.message : "Could not open Kubo WebUI");
    } finally {
      setWebuiBusy(false);
    }
  }, [activeScope, selectedNode]);

  if (!isAuthenticated) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-[var(--text-2)]">Connect your wallet to use Drop.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <MonoLabel>Storage scope</MonoLabel>
            <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Storage scope">
              {scopeChoices.map((choice) => (
                <button
                  key={choice.key}
                  type="button"
                  role="tab"
                  aria-selected={choice.key === scopeKey}
                  onClick={() => setScopeKey(choice.key)}
                  className={cn(
                    "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                    choice.key === scopeKey
                      ? "border-[var(--accent)]/45 bg-[var(--accent)]/12 text-[var(--accent-hi)]"
                      : "border-white/[0.08] text-[var(--text-2)] hover:bg-white/[0.04]"
                  )}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </Card>

          <DropNodePicker
            nodes={nodes}
            selectedId={selectedNode?.id ?? null}
            onSelect={setSelectedNode}
            loading={nodesLoading}
          />

          {canOpenWebui && selectedNode?.webui_available && (
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <MonoLabel>Node WebUI</MonoLabel>
                  <p className="mt-2 max-w-xl text-xs leading-relaxed text-[var(--text-3)]">
                    Opens a five-minute gateway-proxied Kubo session. Pins created
                    directly in Kubo are unmanaged and do not appear in Drop usage or files.
                  </p>
                </div>
                <AccentButton
                  disabled={webuiBusy}
                  onClick={handleOpenWebui}
                  className="!py-2 !text-[13px]"
                >
                  {webuiBusy ? "Opening…" : "Open Kubo WebUI"}
                </AccentButton>
              </div>
            </Card>
          )}

          <DropUploadPanel
            disabled={uploadDisabled}
            disabledReason={uploadDisabledReason}
            visibility={visibility}
            publicAllowed={activeScope?.scope === "public"}
            onVisibilityChange={setVisibility}
            onFiles={handleFiles}
            items={uploads.items}
            onCancel={uploads.cancel}
            onRetry={uploads.retry}
            onRemove={uploads.remove}
            onClearFinished={uploads.clearFinished}
          />
        </div>

        <div className="space-y-5">
          <DropVaultPanel
            status={vault.status}
            onSetup={vault.setupVault}
            onUnlock={vault.unlockVault}
            onLock={vault.lockVault}
          />
          <DropUsageCard usage={usage} orgName={entitlement.org?.name} />
          {activeScope?.scope === "private" && activeOrg && canOperateNodes && (
            <DropWebuiLauncher orgId={activeOrg.id} nodes={nodes} />
          )}
          {entitlement.tier === "free" && (
            <Card className="p-5">
              <p className="text-sm text-[var(--text-2)]">
                More storage and private organization nodes come with a paid workspace plan.
              </p>
              <Link href="/subscribe" className="mt-3 block">
                <AccentButton className="w-full !py-2 !text-[13px]">View plans</AccentButton>
              </Link>
            </Card>
          )}
        </div>
      </div>

      <DropFileList
        files={files}
        loading={filesLoading}
        busyId={busyFileId}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onShare={handleShare}
      />
    </div>
  );
}
