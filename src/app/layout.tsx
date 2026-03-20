import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Mono,
  Instrument_Sans,
  Shadows_Into_Light,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ThemeProvider from "@/components/layout/ThemeProvider";
import AppNav from "@/components/layout/AppNav";
import { Analytics } from "@vercel/analytics/next";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const shadowsIntoLight = Shadows_Into_Light({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roamer's Ledger — Travel Planner",
  description: "Plan your travels with ease",
  manifest: "/manifest.json",
  icons: {
    icon: "/material/Logo.png",
    shortcut: "/material/Logo.png",
    apple: "/material/Logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Roamer's Ledger",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${ibmPlexMono.variable} ${shadowsIntoLight.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <AppNav />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
