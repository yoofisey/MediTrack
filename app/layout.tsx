import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.useadhera.com"),
  title: {
    default: "Adhera",
    template: "%s | Adhera",
  },
  description: "Your Personal Treatment Companion — Track medications, get smart alarm reminders, and stay on top of your health.",
  applicationName: "Adhera",
  keywords: ["medication tracker", "dose reminder", "health dashboard", "Adhera"],
  authors: [{ name: "Adhera" }],
  creator: "Adhera",
  alternates: {
    canonical: "/",
  },
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
  openGraph: {
    title: "Adhera — Your Personal Treatment Companion",
    description: "Track medications, get smart alarm reminders, and stay on top of your health.",
    url: "https://www.useadhera.com",
    siteName: "Adhera",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adhera — Your Personal Treatment Companion",
    description: "Track medications, get smart alarm reminders, and stay on top of your health.",
  },
};

export const viewport: Viewport = {
  themeColor: "#007AFF",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Adhera" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.variable} suppressHydrationWarning>{children}</body>
    </html>
  );
}
