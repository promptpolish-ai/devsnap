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
  // 1. Get submit page, extract fnid
  console.log('1. Getting fresh submit page...');
  const page1 = await fetch('https://news.ycombinator.com/submit');
  
  // Extract ALL fnid/fnop pairs
  const fnids = [...page1.data.matchAll(/name="fnid"[^>]*value="([^"]+)"/g)].map(m => m[1]);
  const fnops = [...page1.data.matchAll(/name="fnop"[^>]*value="([^"]+)"/g)].map(m => m[1]);
  
  console.log(`Found ${fnids.length} fnids, ${fnops.length} fnops`);
  
  if (fnids.length === 0) {
    // Check if there's an error message
    const errorMatch = page1.data.match(/<font[^>]*color="[^"]*red[^"]*"[^>]*>([^<]+)</i);
    if (errorMatch) {
      console.log('Error:', errorMatch[1]);
    }
    // Check if user is logged in
    if (page1.data.includes('login')) {
      console.log('User not logged in!');
    }
    console.log('Snippet:', page1.data.substring(0, 1500));
    return;
  }
  
  const fnid = fnids[0];
  const fnop = fnops[0] || 'submit-page';
  
  console.log(`fnid: ${fnid.substring(0, 25)}...`);
  console.log(`fnop: ${fnop}`);
  
  // 2. Check account info first
  console.log('\n2. Checking account info...');
  const profile = await fetch('https://news.ycombinator.com/user?id=gitscope_ai');
  const karmaMatch = profile.data.match(/karma:\s*(\d+)/i);
  const createdMatch = profile.data.match(/created:\s*(\d+)/i);
  console.log(`Karma: ${karmaMatch ? karmaMatch[1] : 'unknown'}`);
  console.log(`Created: ${createdMatch ? createdMatch[1] : 'unknown'}`);
  
  // 3. Check submitting requirements
  console.log('\n3. Checking if can submit...');
  if (page1.data.includes('karma') && page1.data.includes('enough')) {
    console.log('Need more karma to submit');
    return;
  }
  
  // 4. Try submitting with the fresh fnid
  const title = 'DevSnap – Premium UI Components (no framework)';
  const url = SITE;
  
  console.log(`\n4. Submitting...`);
  console.log(`Title (${title.length} chars): ${title}`);
  
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
  
  // Check result
  if (result.data.includes('Unknown or expired link')) {
    console.log('✗ Expired link - try again faster');
  } else if (result.data.includes('submissing')) {
    console.log('✗ Submitting too fast');
    console.log('Snippet:', result.data.substring(800, 1200));
  } else if (result.data.includes('item?id=')) {
    const m = result.data.match(/item\?id=(\d+)/);
    console.log(`✓ POSTED! ID: ${m[1]}`);
    console.log(`URL: https://news.ycombinator.com/item?id=${m[1]}`);
  } else {
    // Check for error
    const errMatch = result.data.match(/<font[^>]*color="[^"]*red"[^>]*>([^<]+)/i);
    if (errMatch) {
      console.log('Error:', errMatch[1]);
    } else {
      console.log('Response page title check...');
      const titleMatch = result.data.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) {
        console.log('Title:', titleMatch[1]);
        if (titleMatch[1] === 'Submit | Hacker News') {
          console.log('✗ Still on submit page - submission may have failed silently');
          // Check for rate limit
          if (result.data.includes('too fast')) {
            console.log('Rate limited');
          }
        }
      }
    }
  }
}

main().catch(console.error);
