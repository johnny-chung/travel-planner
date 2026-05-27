import "server-only";

import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium, type Browser } from "playwright-core";

let browserPromise: Promise<Browser> | null = null;

function getChromiumPackUrl() {
  const explicitUrl = process.env.SPARTICUZ_CHROMIUM_REMOTE_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.${arch}.tar`;
}

async function getChromiumExecutablePath() {
  if (process.env.VERCEL || process.env.AWS_REGION) {
    return chromium.executablePath(getChromiumPackUrl());
  }

  return chromium.executablePath();
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      try {
        const launchOptions =
          process.env.VERCEL || process.env.AWS_REGION
            ? {
                args: chromium.args,
                executablePath: await getChromiumExecutablePath(),
                headless: true,
              }
            : {
                headless: true,
              };

        const browser = await playwrightChromium.launch(launchOptions);
        browser.on("disconnected", () => {
          browserPromise = null;
        });
        return browser;
      } catch (error) {
        browserPromise = null;
        throw error;
      }
    })();
  }

  return browserPromise;
}

export async function renderPlannerPdf(input: {
  origin: string;
  printPath: string;
  cookieHeader?: string;
}) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    extraHTTPHeaders: input.cookieHeader
      ? {
          cookie: input.cookieHeader,
        }
      : undefined,
  });

  try {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(45_000);
    page.setDefaultTimeout(20_000);
    await page.goto(`${input.origin}${input.printPath}`, {
      waitUntil: "domcontentloaded",
    });
    await page.emulateMedia({ media: "print" });
    await page.waitForLoadState("load");
    await page
      .waitForFunction(() => {
        return typeof document !== "undefined" &&
          typeof document.fonts !== "undefined"
          ? document.fonts.status === "loaded"
          : true;
      })
      .catch(() => {});
    await page.waitForTimeout(300);
    await page.waitForLoadState("networkidle", { timeout: 3_000 }).catch(() => {});

    return await page.pdf({
      format: "A5",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    });
  } finally {
    await context.close();
  }
}
