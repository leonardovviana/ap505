import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Junto$",
    template: "%s | Junto$",
  },
  description: "Junto$, finanças em dupla sem drama.",
  applicationName: "Junto$",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Junto$",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/logo.png",
    apple: "/icons/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1DB954",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
