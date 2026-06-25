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
  themeColor: "#0F6E56",
  colorScheme: "light",
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
      <body>{children}</body>
    </html>
  );
}
