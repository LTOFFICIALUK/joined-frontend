import { ImageResponse } from "next/og"

export const ogSize = { width: 1200, height: 630 }

export const ogCard = (title: string, line: string) =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          color: "#F2F2F0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "72px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 48, left: 72, width: 180, height: 180, borderRadius: 999, background: "#50D2C1" }} />
        <div style={{ position: "absolute", top: 150, left: 210, width: 110, height: 110, borderRadius: 999, background: "#2EAA98" }} />
        <div style={{ position: "absolute", right: 80, bottom: 180, width: 240, height: 240, borderRadius: 999, background: "#143F39" }} />
        <div style={{ fontSize: 28, color: "#50D2C1", marginBottom: 12 }}>joined</div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>{title}</div>
        <div style={{ fontSize: 28, marginTop: 18, color: "#9B9B97", maxWidth: 860 }}>{line}</div>
      </div>
    ),
    ogSize,
  )
