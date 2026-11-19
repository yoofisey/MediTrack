import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.useadhera.com"),
  title: {
    default: "Adherly",
    template: "%s | Adherly",
  },
  description: "Your Personal Treatment Companion — Track medications, get smart alarm reminders, and stay on top of your health.",
  applicationName: "Adherly",
  keywords: ["medication tracker", "dose reminder", "health dashboard", "Adherly"],
  authors: [{ name: "Adherly" }],
  creator: "Adherly",
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
    title: "Adherly",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Adherly — Your Personal Treatment Companion",
    description: "Track medications, get smart alarm reminders, and stay on top of your health.",
    url: "https://www.useadhera.com",
    siteName: "Adherly",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adherly — Your Personal Treatment Companion",
    description: "Track medications, get smart alarm reminders, and stay on top of your health.",
  },
};

export const viewport: Viewport = {
  themeColor: "#007AFF",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <meta name="apple-mobile-web-app-title" content="Adherly" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={jakarta.variable} suppressHydrationWarning>{children}</body>
    </html>
  );
}
