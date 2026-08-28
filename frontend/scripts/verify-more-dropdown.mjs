/**
 * UI smoke test: More dropdown shows 4 nav links after demo login.
 * Run: node scripts/verify-more-dropdown.mjs
 */
import { chromium } from "playwright";

const BASE = "http://localhost:5199";
const EXPECTED = ["Buy", "RTO Services", "RTO Agents", "Maintenance"];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Continue with demo account/i }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });

  const moreBtn = page.getByRole("button", { name: "More ▾" });
  await moreBtn.waitFor({ state: "visible", timeout: 10000 });
  await moreBtn.click();

  const menu = page.locator(".nav__dropdown");
  await menu.waitFor({ state: "visible", timeout: 5000 });

  const found = [];
  for (const label of EXPECTED) {
    const link = menu.getByRole("menuitem", { name: label });
    await link.waitFor({ state: "visible", timeout: 3000 });
    found.push(label);
  }

  console.log("PASS: More dropdown visible with links:", found.join(", "));
  process.exit(0);
} catch (err) {
  console.error("FAIL:", err.message);
  await page.screenshot({ path: "scripts/more-dropdown-fail.png", fullPage: true });
  console.error("Screenshot saved to scripts/more-dropdown-fail.png");
  process.exit(1);
} finally {
  await browser.close();
}
