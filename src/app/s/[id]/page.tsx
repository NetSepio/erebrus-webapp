"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, AccentButton, MonoLabel } from "@/components/v3/ui";
import { formatBytes } from "@/lib/format";
import { Download, FileWarning } from "lucide-react";
import { fetchPublicDropFile, publicDropContentUrl } from "@/lib/drop/client";
import { GatewayApiError } from "@/lib/gateway/client";
import type { DropPublicFile } from "@/lib/drop/types";

/**
 * Opaque public share landing page. The share link is keyed by an opaque file
 * id — never the raw CID — so the CID is not used as an access-control token.
 */
export default function PublicSharePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [file, setFile] = useState<DropPublicFile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    if (!id) return;
    let active = true;
    setStatus("loading");
    fetchPublicDropFile(id)
      .then((f) => {
        if (!active) return;
        setFile(f);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setStatus(err instanceof GatewayApiError && err.status === 404 ? "notfound" : "notfound");
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[560px] flex-col justify-center px-4 py-16">
      <Card className="p-8">
        <MonoLabel>Erebrus Drop</MonoLabel>

        {status === "loading" && (
          <p className="mt-4 text-sm text-[var(--text-3)]">Loading shared file…</p>
        )}

        {status === "notfound" && (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <FileWarning size={18} className="text-[var(--warn)]" />
              <h1 className="text-lg font-semibold">File not available</h1>
            </div>
            <p className="mt-2 text-sm text-[var(--text-2)]">
              This share link is invalid or the file has been removed.
            </p>
            <Link href="/" className="mt-4 inline-block">
              <AccentButton variant="ghost">Go to Erebrus</AccentButton>
            </Link>
          </div>
        )}

        {status === "ready" && file && (
          <div className="mt-4">
            <h1 className="truncate text-xl font-bold">{file.filename}</h1>
            <p className="mt-1 font-mono text-[12px] text-[var(--text-3)]">
              {formatBytes(file.size_bytes)} · {file.content_type}
            </p>

            <a href={publicDropContentUrl(file.id)} download={file.filename} className="mt-6 block">
              <AccentButton className="w-full">
                <Download size={15} />
                Download
              </AccentButton>
            </a>

            <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-3)]">
              This is a public file served from the IPFS network. Anyone with this link can
              download it. Public files are not encrypted — don&apos;t share sensitive content
              this way.
            </p>
          </div>
        )}
      </Card>
    </main>
  );
}
