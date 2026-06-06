const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await ctx.newPage();
  
  console.log('1. Ko-fi signup...');
  await page.goto('https://ko-fi.com/signup', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  
  // Click "Developers" category
  const devBtn = await page.$('button:has-text("Developers")');
  if (devBtn) {
    await devBtn.click();
    console.log('Clicked Developers');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/kofi-2.png' });
  }
  
  // Fill handle
  const handleInput = await page.$('#txtHandle');
  if (handleInput) {
    await handleInput.fill('devsnap');
    console.log('Handle filled');
  }
  
  // Look for next/continue button
  const nextBtns = await page.$$('button');
  for (const btn of nextBtns) {
    const t = await btn.textContent();
    if (t && (t.toLowerCase().includes('next') || t.toLowerCase().includes('continue') || t.toLowerCase().includes('done'))) {
      await btn.click();
      console.log('Clicked:', t.trim());
      await page.waitForTimeout(2000);
      break;
    }
  }
  
  await page.screenshot({ path: '/tmp/kofi-3.png' });
  console.log('URL:', page.url());
  
  // Look for email/password signup form
  const inputs = await page.$$('input');
  for (const inp of inputs) {
    const type = await inp.getAttribute('type');
    const name = await inp.getAttribute('name');
    const ph = await inp.getAttribute('placeholder');
    if (type === 'email' || type === 'password' || type === 'text') {
      console.log(`Found: type=${type} name=${name} ph=${ph}`);
    }
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
