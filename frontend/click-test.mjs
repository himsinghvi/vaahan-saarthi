import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

await page.goto("http://localhost:5199/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const before = page.url();
await page.click('text=Launch App', { timeout: 5000 }).catch((e) => console.log("CLICK FAIL:", e.message));
await page.waitForTimeout(1000);
const after = page.url();

console.log("URL before:", before);
console.log("URL after:", after);
console.log("Nav worked:", after.includes("/dashboard"));
console.log("JS errors:", errors.length ? errors : "none");

await browser.close();
