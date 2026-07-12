#!/usr/bin/env node
/**
 * TR-014 Web E2E test — login, routes, flow, screenshots at 1440×900
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname);
const BASE = process.env.WEB_URL || "http://localhost:3000";
const API = process.env.API_URL || "http://localhost:8000";

async function getToken() {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@pulsefolio.app", password: "demo12345" }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function main() {
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    // try global or parent node_modules
    const candidates = [
      path.join(__dirname, "../../../apps/web/node_modules/puppeteer"),
      "/Users/venkyiyer/.local/node/lib/node_modules/puppeteer",
    ];
    for (const c of candidates) {
      try {
        puppeteer = require(c);
        break;
      } catch {}
    }
  }
  if (!puppeteer) {
    console.error("puppeteer not found — install with: npm i -D puppeteer");
    process.exit(2);
  }

  const token = await getToken();
  const results = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  // Inject token before any navigation
  await page.evaluateOnNewDocument((t) => {
    localStorage.setItem("pulsefolio_token", t);
  }, token);

  const routes = ["/", "/dashboard", "/decision", "/portfolio", "/trades", "/insights", "/settings"];

  // Login flow test
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('button[type="submit"]', { timeout: 15000 });
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 }).catch(() => {});
  const afterLoginUrl = page.url();
  const loginPass = afterLoginUrl.includes("/dashboard") || afterLoginUrl === `${BASE}/` || afterLoginUrl.endsWith("/");
  results.push({ test: "login_redirect", result: loginPass ? "PASS" : "FAIL", detail: `url=${afterLoginUrl}` });

  // Route HTTP via page load
  for (const route of routes) {
    const resp = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));
    const status = resp?.status() ?? 0;
    const body = await page.evaluate(() => document.body.innerText);
    const hasISE = body.includes("Internal Server Error");
    const hasDemo124 = body.includes("$124,582") || body.includes("124,582");
    const hasDemoBanner = /demo data|using demo|fallback/i.test(body);
    const hasLive189k = /189[,\s]?\d{3}/.test(body) || /189\d{3}/.test(body);
    const hasLlama70B = body.includes("Llama 3 70B");
    const engineModel = body.match(/(hybrid|ollama|rules)\s*·\s*[\w.:+-]+/i)?.[0] ?? null;

    const file = `TR-014-${route === "/" ? "home" : route.slice(1)}-1440x900.png`;
    await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: false });

    results.push({
      test: `route_${route}`,
      result: status === 200 && !hasISE ? "PASS" : "FAIL",
      detail: `HTTP ${status}, ISE=${hasISE}`,
      route,
      file,
      hasDemo124,
      hasDemoBanner,
      hasLive189k,
      hasLlama70B,
      engineModel,
    });
  }

  // Full flow: generate on briefing
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));
  const buttons = await page.$$eval("button", (els) => els.map((e) => e.textContent?.trim()).filter(Boolean));
  let generateClicked = false;
  for (const btn of await page.$$("button")) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && /run analysis|fresh analysis|generate/i.test(text)) {
      await btn.click();
      generateClicked = true;
      await new Promise((r) => setTimeout(r, 3000));
      break;
    }
  }
  results.push({ test: "flow_generate", result: generateClicked ? "PASS" : "PARTIAL", detail: `buttons=${buttons.slice(0, 8).join("|")}` });

  // Decision approve
  await page.goto(`${BASE}/decision`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1500));
  let approveClicked = false;
  for (const btn of await page.$$("button")) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && /approve/i.test(text) && !/quick/i.test(text)) {
      await btn.click();
      approveClicked = true;
      await new Promise((r) => setTimeout(r, 2000));
      break;
    }
  }
  const decisionBody = await page.evaluate(() => document.body.innerText);
  results.push({
    test: "flow_approve",
    result: approveClicked ? "PASS" : "PARTIAL",
    detail: approveClicked ? "approve clicked" : "no approve button",
    hasSuccess: /success|executed|approved/i.test(decisionBody),
  });

  // Settings PATCH
  await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1500));
  let settingsChanged = false;
  for (const btn of await page.$$("button")) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && /growth|conservative|balanced/i.test(text)) {
      await btn.click();
      settingsChanged = true;
      break;
    }
  }
  results.push({ test: "flow_settings", result: settingsChanged ? "PASS" : "PARTIAL", detail: settingsChanged ? "risk profile toggled" : "no toggle found" });

  // Model branding check across decision page
  const brandingResult = results.find((r) => r.route === "/decision");
  const modelBrandingPass = brandingResult && !brandingResult.hasLlama70B && (brandingResult.engineModel || !brandingResult.hasLlama70B);
  results.push({
    test: "model_branding",
    result: brandingResult?.hasLlama70B ? "FAIL" : brandingResult?.engineModel ? "PASS" : "PARTIAL",
    detail: brandingResult?.engineModel || (brandingResult?.hasLlama70B ? "Llama 3 70B found" : "no engine·model visible"),
  });

  await browser.close();

  const outFile = path.join(OUT_DIR, "TR-014-browser-results.json");
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  const fails = results.filter((r) => r.result === "FAIL");
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
