// External evidence_runner executes this file; no paid APIs or native mocks.
import { chromium } from '../../../app-studio/quality/persona/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../www/', import.meta.url));
const out = fileURLToPath(new URL('../../../chief/task_runs/app-studio/scratch/out/quran-pronunciation-ui/', import.meta.url));
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
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:360,height:800}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}`;
  await page.addInitScript(()=>localStorage.setItem('pron','1'));
  for(const [sura,ayah,expected] of [[83,5,'লিয়াওমিন ‘আযীম্'],[83,11,'আল্লাযীনা ইয়ুকায্যিবূনা বিয়াওমিদ্দীন্'],[89,25,'ফায়াওমা’ইযিল্লা ইয়ু‘আয্যিবু ‘আযাবাহূ আহাদ্']]) {
    await page.goto(url); await page.waitForLoadState('networkidle');
    await page.locator('#sura-'+sura).click();
    const note=page.locator('.pronnote').filter({hasText:'‘ = আইন (ع)'});
    assert.equal(await note.count(),1,'ayn legend visible with pronunciation');
    assert((await note.innerText()).includes('’ = হামযা (ء)'), 'hamza distinguished from ayn');
    for (const width of [320,412]) {
      await page.setViewportSize({width,height:800});
      await note.scrollIntoViewIfNeeded();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),'legend fits narrow phone');
      await page.screenshot({path:path.join(out,`legend-${sura}-${width}.png`)});
    }
    const row=page.locator('.ayah').nth(ayah-1);
    await row.scrollIntoViewIfNeeded();
    assert.equal(await row.locator('.pron').textContent(),expected);
    await page.screenshot({path:path.join(out,`pron-${sura}-${ayah}.png`)});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: three expert-reported medial-ya lines render corrected pronunciation; ayn/hamza legend visible at two phone widths');
} finally {
  if(browser) await browser.close();
  await new Promise(ok=>server.close(ok));
}
