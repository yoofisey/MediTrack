import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Adhera",
    template: "%s | Adhera",
  },
  description: "Your Personal Treatment Companion — Track medications, get smart alarm reminders, and stay on top of your health.",
  applicationName: "Adhera",
  keywords: ["medication tracker", "dose reminder", "health dashboard", "Adhera"],
  authors: [{ name: "Adhera" }],
  creator: "Adhera",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "Adhera",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#007AFF",
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
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-title" content="Adhera" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.variable} suppressHydrationWarning>{children}</body>
    </html>
  );
}
