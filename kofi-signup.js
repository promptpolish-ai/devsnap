const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  });
  const page = await ctx.newPage();
  
  console.log('1. Opening Ko-fi signup...');
  await page.goto('https://ko-fi.com/signup', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('Title:', await page.title());
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/kofi-1.png' });
  
  const inputs = await page.$$('input');
  console.log('Inputs:', inputs.length);
  for (const inp of inputs) {
    const type = await inp.getAttribute('type');
    const name = await inp.getAttribute('name');
    const ph = await inp.getAttribute('placeholder');
    const id = await inp.getAttribute('id');
    console.log(`  type=${type} name=${name} id=${id} ph=${ph}`);
  }
  
  const btns = await page.$$('button');
  console.log('Buttons:', btns.length);
  for (const btn of btns) {
    const t = await btn.textContent();
    console.log(`  Button: "${t?.trim()}"`);
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
