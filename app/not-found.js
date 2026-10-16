import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        background: "linear-gradient(180deg,#EDF4FF 0%,#F7F8FC 38%,#F2F2F7 100%)",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif",
        color: "#0f172a",
      }}
    >
      <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }} aria-hidden="true">
        💊
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>Page not found</h1>
      <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 24px", maxWidth: 360 }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          background: "#007AFF",
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          padding: "12px 24px",
          borderRadius: 12,
          textDecoration: "none",
        }}
      >
        Back to Adhera
      </Link>
    </div>
  );
}
