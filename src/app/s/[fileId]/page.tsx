"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, ExternalLink, File, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuroraBackground } from "@/components/v3/AuroraBackground";
import { AccentButton, Card, MonoLabel } from "@/components/v3/ui";
import { directGatewayUrl, fetchPublicDropFile } from "@/lib/drop/client";
import { downloadPublicRef } from "@/lib/drop/download";
import { formatBytes } from "@/lib/format";
import type { DropPublicFile } from "@/lib/drop/types";

export default function PublicDropSharePage() {
  const params = useParams<{ fileId: string }>();
  const fileId = params.fileId;
  const [file, setFile] = useState<DropPublicFile | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPublicDropFile(fileId)
      .then((value) => active && setFile(value))
      .catch(() => active && setError("This public Drop file is unavailable."));
    return () => {
      active = false;
    };
  }, [fileId]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-12 text-[var(--text)]">
      <AuroraBackground />
      <Card className="relative z-[2] w-full max-w-xl p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent-hi)]">
            <File size={20} />
          </span>
          <div>
            <MonoLabel>Erebrus Drop</MonoLabel>
            <h1 className="mt-1 text-xl font-semibold">Public file share</h1>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-[var(--text-2)]">
            {error}
          </p>
        ) : !file ? (
          <p className="mt-6 text-sm text-[var(--text-3)]">Loading file…</p>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="break-words font-medium">{file.filename}</p>
              <p className="mt-1 font-mono text-xs text-[var(--text-3)]">
                {formatBytes(file.size_bytes)} · {file.content_type}
              </p>
            </div>
            <AccentButton
              className="mt-4 w-full"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await downloadPublicRef(file);
                } catch {
                  toast.error("Could not fetch this file from any node right now.");
                } finally {
                  setDownloading(false);
                }
              }}
            >
              <Download size={15} />
              {downloading ? "Downloading…" : "Download"}
            </AccentButton>

            {(() => {
              const gatewayLink = directGatewayUrl(
                file.gateway_url ?? file.gateway_urls?.[0],
                file.cid
              );
              return gatewayLink ? (
                <a
                  href={gatewayLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block"
                >
                  <AccentButton variant="ghost" className="w-full">
                    <ExternalLink size={15} />
                    Open on IPFS gateway
                  </AccentButton>
                </a>
              ) : null;
            })()}
            <div className="mt-4 flex gap-2 text-xs leading-relaxed text-[var(--text-3)]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-hi)]" />
              Public Drop files are plaintext. Anyone with this opaque link may download
              the file, and anyone who learns its IPFS CID may retrieve it independently.
            </div>
          </>
        )}

        <Link href="/drop" className="mt-6 inline-block text-xs text-[var(--accent-hi)]">
          Learn about Erebrus Drop
        </Link>
      </Card>
    </main>
  );
}
