const https = require('https');

const COOKIE = 'user=gitscope_ai&n1N7cZz35bFCOnzQGs8I1pfxbtDotAZF';
const SITE = 'https://devsnap-zeta.vercel.app';

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: opts.method || 'GET',
      headers: {
        'Cookie': COOKIE,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ...(opts.headers || {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function main() {
  // 1. Get the submit page to extract fnid
  console.log('1. Getting submit page...');
  const submitPage = await fetch('https://news.ycombinator.com/submit');
  
  const fnidMatch = submitPage.data.match(/name="fnid"[^>]*value="([^"]+)"/);
  const fnopMatch = submitPage.data.match(/name="fnop"[^>]*value="([^"]+)"/);
  
  if (!fnidMatch) {
    console.log('✗ No fnid found');
    console.log('Response snippet:', submitPage.data.substring(0, 1000));
    return;
  }
  
  const fnid = fnidMatch[1];
  const fnop = fnopMatch ? fnopMatch[1] : '';
  console.log(`fnid: ${fnid.substring(0, 20)}...`);
  console.log(`fnop: ${fnop.substring(0, 20)}...`);
  
  // 2. Submit the post
  // Title MUST be <= 80 chars
  const title = 'DevSnap – Premium UI Components, no framework required';
  const url = SITE;
  
  console.log(`\n2. Submitting post...`);
  console.log(`Title (${title.length} chars): ${title}`);
  console.log(`URL: ${url}`);
  
  const body = new URLSearchParams({
    fnid: fnid,
    fnop: fnop,
    title: title,
    url: url,
    text: ''
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
  
  if (result.status === 200) {
    if (result.data.includes('Unknown or expired link')) {
      console.log('✗ Unknown or expired link - need to retry');
    } else if (result.data.includes('karma') || result.data.includes('too fast')) {
      console.log('✗ Rate limited or karma too low');
      console.log('Snippet:', result.data.substring(0, 500));
    } else if (result.data.includes('item?id=') || result.data.includes('Thanks for submitting')) {
      const itemMatch = result.data.match(/item\?id=(\d+)/);
      if (itemMatch) {
        console.log(`✓ SUBMITTED! Item ID: ${itemMatch[1]}`);
        console.log(`URL: https://news.ycombinator.com/item?id=${itemMatch[1]}`);
      } else {
        console.log('✓ Submitted! (but no ID found)');
      }
    } else {
      console.log('Response:', result.data.substring(0, 500));
    }
  } else {
    console.log('Response:', result.data.substring(0, 500));
  }
}

main().catch(console.error);
