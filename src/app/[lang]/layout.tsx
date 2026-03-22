import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import {
  IBM_Plex_Mono,
  Manrope,
  Poiret_One,
} from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import ThemeProvider from "@/components/layout/ThemeProvider";
import AppNav from "@/components/layout/AppNav";
import AppFooter from "@/components/layout/AppFooter";
import { BRAND_LOGO_SRC } from "@/components/layout/brand-assets";
import { Analytics } from "@vercel/analytics/next";
import { locales, isSupportedLocale, toHtmlLang } from "@/features/i18n/config";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  buildAbsoluteUrl,
  getSiteUrl,
} from "@/features/seo/metadata";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const poiretOne = Poiret_One({
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
    icon: BRAND_LOGO_SRC,
    shortcut: BRAND_LOGO_SRC,
    apple: BRAND_LOGO_SRC,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: buildAbsoluteUrl("/"),
    images: [
      {
        url: BRAND_LOGO_SRC,
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
    images: [BRAND_LOGO_SRC],
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
  themeColor: "#2f6e62",
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  if (!isSupportedLocale(lang)) {
    notFound();
  }

  return (
    <html lang={toHtmlLang(lang)} suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${ibmPlexMono.variable} ${poiretOne.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <AppFooter />
          </div>
          <AppNav />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
