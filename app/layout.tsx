import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MediTrack",
    template: "%s | MediTrack",
  },
  description: "Track medications, doses, course progress, and medication history in a simple private dashboard.",
  applicationName: "MediTrack",
  keywords: ["medication tracker", "dose reminder", "health dashboard", "MediTrack"],
  authors: [{ name: "MediTrack" }],
  creator: "MediTrack",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "MediTrack",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A84FF",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-title" content="MediTrack" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
