const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  });
  const page = await ctx.newPage();
  
  const code = '1CC4-089F';
  
  console.log('1. Opening device verification...');
  await page.goto('https://github.com/login/device', { waitUntil: 'networkidle', timeout: 15000 });
  console.log('Title:', await page.title());
  await page.waitForTimeout(1000);
  
  console.log('2. Entering code:', code);
  const input = await page.$('input');
  if (input) {
    await input.fill(code);
    console.log('Code entered');
    await page.screenshot({ path: '/tmp/gh-auth-1.png' });
    
    // Click continue
    const continueBtn = await page.$('button[type="submit"]');
    if (continueBtn) {
      await continueBtn.click();
      console.log('Clicked Continue');
      await page.waitForTimeout(3000);
      console.log('URL:', page.url());
      await page.screenshot({ path: '/tmp/gh-auth-2.png' });
    }
  }
  
  // Handle login if needed
  const body = await page.textContent('body').catch(() => '');
  if (body.includes('Sign in') || page.url().includes('login')) {
    console.log('3. Login page...');
    await page.fill('input[name="login"]', 'promptpolish-ai');
    await page.fill('input[name="password"]', 'AI-PromptPolish-2024!');
    await page.click('input[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('After login:', page.url());
    await page.screenshot({ path: '/tmp/gh-auth-3.png' });
  }
  
  // Handle 2FA
  const body2 = await page.textContent('body').catch(() => '');
  if (body2.includes('two-factor') || body2.includes('OTP') || body2.includes('authentication code')) {
    console.log('4. 2FA page. Trying code 343355...');
    const otpInput = await page.$('#otp');
    if (otpInput) {
      await otpInput.fill('343355');
      await page.click('button:has-text("Verify")');
      await page.waitForTimeout(3000);
      console.log('After 2FA:', page.url());
      await page.screenshot({ path: '/tmp/gh-auth-4.png' });
      
      // If still on 2FA, try second code
      const body3 = await page.textContent('body').catch(() => '');
      if (body3.includes('OTP') || body3.includes('code')) {
        console.log('Trying second code: 111246');
        const otpInput2 = await page.$('#otp');
        if (otpInput2) {
          await otpInput2.fill('111246');
          await page.click('button:has-text("Verify")');
          await page.waitForTimeout(3000);
          console.log('After 2FA2:', page.url());
          await page.screenshot({ path: '/tmp/gh-auth-5.png' });
        }
      }
    }
  }
  
  // Handle authorization
  const body4 = await page.textContent('body').catch(() => '');
  if (body4.includes('Authorize') || body4.includes('authorization')) {
    console.log('5. Authorization page...');
    const authBtn = await page.$('button:has-text("Authorize")');
    if (authBtn) {
      await authBtn.click();
      await page.waitForTimeout(2000);
      console.log('Authorized! URL:', page.url());
      await page.screenshot({ path: '/tmp/gh-auth-6.png' });
    }
  }
  
  console.log('\n6. Final URL:', page.url());
  console.log('Done. Check if token was received.');
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
