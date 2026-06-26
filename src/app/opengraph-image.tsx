import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Erebrus — The sovereign internet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(145deg, #0A0A0C 0%, #131318 45%, #1a1210 100%)",
          color: "#F4F3F0",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,107,53,0.35) 0%, transparent 70%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(135deg, #FF7E44, #E0531F)",
              boxShadow: "0 12px 40px rgba(255,107,53,0.45)",
            }}
          />
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em" }}>Erebrus</div>
        </div>
        <div style={{ position: "relative", maxWidth: 900 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: 24,
            }}
          >
            The sovereign internet
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.45, color: "#9A9AA2" }}>
            Decentralized VPN + local-first Drop. Privacy infrastructure owned by the people who run
            it.
          </div>
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: 16,
            fontSize: 22,
            color: "#FF7E44",
            fontFamily: "monospace",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>VPN</span>
          <span style={{ color: "#6A6A72" }}>·</span>
          <span>Drop</span>
          <span style={{ color: "#6A6A72" }}>·</span>
          <span>erebrus.io</span>
        </div>
      </div>
    ),
    { ...size }
  );
}