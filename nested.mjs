import { createRequire } from 'node:module';
const require = createRequire('/Users/vithu/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 600).replace(/\n/g, ' ⏎ ')); });
await page.goto('http://localhost:8099/account', { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.getByText('ភាសា', { exact: true }).waitFor({ timeout: 180000 });
await page.waitForTimeout(500);
const info = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('button button, [role="button"] [role="button"]').forEach((inner) => {
    const outer = inner.parentElement.closest('button, [role="button"]');
    out.push({ inner: inner.textContent.slice(0, 40), outer: outer?.textContent.slice(0, 60), innerTag: inner.tagName, outerTag: outer?.tagName });
  });
  return out;
});
console.log('nested buttons:', JSON.stringify(info, null, 1));
await browser.close();
