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
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  buildAbsoluteUrl,
  getSiteUrl,
} from "@/features/seo/metadata";

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
  metadataBase: getSiteUrl(),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "travel planner",
    "trip itinerary",
    "trip planner",
    "travel itinerary app",
    "route planner",
    "travel expense tracker",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/material/Logo.png",
    shortcut: "/material/Logo.png",
    apple: "/material/Logo.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: buildAbsoluteUrl("/"),
    images: [
      {
        url: "/material/Logo.png",
        width: 512,
        height: 512,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/material/Logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6d4323",
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
