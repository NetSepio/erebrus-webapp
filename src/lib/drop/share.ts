import type { DropFile } from "@/lib/drop/types";

/**
 * Mirrors the gateway share rule: only public-network, public, plaintext
 * files have a working `/s/[fileId]` link. Workspace files are never shared
 * publicly (the gateway returns 404 for them).
 */
export function isShareable(file: Pick<DropFile, "scope" | "visibility" | "encrypted">): boolean {
  return file.scope === "public" && file.visibility === "public" && !file.encrypted;
}

export function shareLabel(file: Pick<DropFile, "scope" | "visibility" | "encrypted">): string {
  if (isShareable(file)) return "Anyone with the link";
  if (file.scope === "private") return "Workspace only — not shareable";
  return "Only you";
}

export function shareLabelTitle(file: Pick<DropFile, "scope" | "visibility" | "encrypted">): string {
  if (isShareable(file)) return "Plaintext file on the public network; anyone with the share link can download it.";
  if (file.scope === "private") return "Stored on your workspace's own node. Workspace owners and managers can see it; it has no public link.";
  return "Encrypted before upload; only you can decrypt it.";
}
