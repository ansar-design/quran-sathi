// External evidence_runner executes this file; no paid APIs or native mocks.
import { chromium } from '../../../app-studio/quality/persona/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../www/', import.meta.url));
const out = fileURLToPath(new URL('../../../chief/task_runs/app-studio/scratch/out/quran-iqlab-ui/', import.meta.url));
fs.mkdirSync(out, { recursive: true });
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const server = http.createServer((req,res) => {
  const name = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404);res.end();return; }
  res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
let browser;
try {
  await new Promise(ok => server.listen(0,'127.0.0.1',ok));
  browser = await chromium.launch({ headless:true });
  const page = await browser.newPage({viewport:{width:360,height:800}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const ready = page.waitForResponse(r=>r.url().endsWith('/data/words_husary.json') && r.ok());
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await ready;
  await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'শিখি',exact:true}).click();
  for (const [sura,ayah,expected] of [
    ['81','9','নূন-ছোট মীম (মিলিয়ে পড়লে নূনের বদলে মীমের ধ্বনি গুন্নাহসহ পড়ুন)'],
    ['80','27','নূনের বদলে মীমের ধ্বনি'],
    ['80','19','নূন-এর সঙ্গে মিশিয়ে পড়ুন; গুন্নাহসহ'],
    ['83','15','রা-এর সঙ্গে মিশিয়ে পড়ুন; গুন্নাহ ছাড়া'],
    ['84','14','লাম-এর সঙ্গে মিশিয়ে পড়ুন; গুন্নাহ ছাড়া'],
    ['79','14','পরের বা-এর আগে মীমের ধ্বনি আড়াল করে গুন্নাহসহ পড়ুন']
  ]) {
    await page.getByLabel('শেখার সূরা',{exact:true}).selectOption(sura);
    await page.getByLabel('শেখার আয়াত',{exact:true}).selectOption(String(Number(ayah)-1));
    await page.getByRole('button',{name:'3 · বানান',exact:true}).click();
    await page.locator('.learn-cards').waitFor();
    assert((await page.locator('.learn-cards').innerText()).includes(expected),`${sura}:${ayah} guidance visible`);

    for(const width of [320,412]) {
      await page.setViewportSize({width,height:800});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),`overflow ${sura}:${ayah} width ${width}`);
      await page.locator('.learn-cards').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,`${sura}-${ayah}-${width}.png`),fullPage:true});
    }
  }
  assert.deepEqual(errors,[],'no uncaught JavaScript errors');
  console.log('PASS: iqlab/idgham/ikhfa guidance in six real ayahs at two phone widths; no JS errors');
} finally {
  if(browser) await browser.close();
  await new Promise(ok=>server.close(ok));
}
