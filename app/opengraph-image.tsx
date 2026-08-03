import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B1220 0%, #0E1E3D 55%, #123C7E 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: 28,
            background: "#007AFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: 34,
            boxShadow: "0 12px 48px rgba(0, 122, 255, 0.35)",
          }}
        >
          <div style={{ width: 48, height: 14, borderRadius: 8, background: "white", position: "absolute" }} />
          <div style={{ width: 14, height: 48, borderRadius: 8, background: "white", position: "absolute" }} />
        </div>
        <div style={{ color: "white", fontSize: 76, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1 }}>
          Adhera
        </div>
        <div
          style={{
            color: "rgba(255, 255, 255, 0.72)",
            fontSize: 30,
            marginTop: 16,
            letterSpacing: "-0.5px",
          }}
        >
          Your personal treatment companion
        </div>
      </div>
    ),
    { ...size }
  );
}
