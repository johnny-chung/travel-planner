import "server-only";

import { chromium, type Browser } from "playwright";

let browserPromise: Promise<Browser> | null = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
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
    await page.goto(`${input.origin}${input.printPath}`, {
      waitUntil: "networkidle",
    });

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
