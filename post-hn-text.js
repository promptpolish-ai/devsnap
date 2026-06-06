const https = require('https');

const COOKIE = 'user=gitscope_ai&n1N7cZz35bFCOnzQGs8I1pfxbtDotAZF';

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: opts.method || 'GET',
      headers: {
        'Cookie': COOKIE,
        'User-Agent': 'Mozilla/5.0',
        ...(opts.headers || {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode }));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function main() {
  // Get submit page
  console.log('1. Getting submit page...');
  const page = await fetch('https://news.ycombinator.com/submit');
  
  const fnidMatch = page.data.match(/name="fnid"[^>]*value="([^"]+)"/);
  const fnopMatch = page.data.match(/name="fnop"[^>]*value="([^"]+)"/);
  
  if (!fnidMatch) {
    console.log('✗ No fnid. Checking error...');
    const err = page.data.match(/<font[^>]*color="[^"]*red"[^>]*>([^<]+)/i);
    console.log('Error:', err ? err[1] : 'none');
    console.log('Snippet:', page.data.substring(800, 1200));
    return;
  }
  
  const fnid = fnidMatch[1];
  const fnop = fnopMatch ? fnopMatch[1] : 'submit-page';
  
  // Try text-only submission (no URL, just text with link)
  const title = 'Show HN: DevSnap – Premium UI Components (free to use)';
  const text = `I built a collection of 10 premium UI components with pure HTML/CSS. Dark mode, responsive, no framework needed. Check it out: https://devsnap-zeta.vercel.app\n\nWould love feedback from the community!`;
  
  console.log(`\n2. Submitting text post...`);
  console.log(`Title (${title.length} chars): ${title}`);
  console.log(`Text: ${text.substring(0, 80)}...`);
  
  const body = new URLSearchParams({
    fnid: fnid,
    fnop: fnop,
    title: title,
    url: '',
    text: text
  }).toString();
  
  const result = await fetch('https://news.ycombinator.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body).toString()
    },
    body: body
  });
  
  console.log(`Status: ${result.status}`);
  
  if (result.data.includes('item?id=')) {
    const m = result.data.match(/item\?id=(\d+)/);
    console.log(`✓ POSTED! ID: ${m[1]}`);
    console.log(`URL: https://news.ycombinator.com/item?id=${m[1]}`);
  } else if (result.data.includes('Unknown or expired')) {
    console.log('✗ Expired link');
  } else if (result.data.includes('too fast')) {
    console.log('✗ Too fast');
  } else {
    const titleMatch = result.data.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) console.log('Page:', titleMatch[1]);
    
    const err = result.data.match(/<font[^>]*color="[^"]*red"[^>]*>([^<]+)/i);
    if (err) console.log('Error:', err[1]);
    else console.log('Unknown result');
  }
}

main().catch(console.error);
