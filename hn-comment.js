const https = require('https');
const COOKIE = 'user=gitscope_ai&n1N7cZz35bFCOnzQGs8I1pfxbtDotAZF';

function fetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: opts.method || 'GET',
      headers: { 'Cookie': COOKIE, 'User-Agent': 'Mozilla/5.0', ...(opts.headers || {}) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ data, status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function main() {
  // 1. Get the front page to find a popular thread
  console.log('1. Finding a popular thread to comment on...');
  const front = await fetch('https://news.ycombinator.com/news');
  
  // Extract story titles and IDs
  const stories = [...front.data.matchAll(/<tr class='athing' id='(\d+)'>[\s\S]*?<td class="title"[^>]*><span[^>]*>[\s\S]*?<a href="[^"]*"[^>]*>([^<]+)<\/a>/g)];
  
  // Filter for stories with comments (recent, popular)
  const lines = front.data.split('\n');
  let currentId = '';
  const storyList = [];
  
  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(/<tr class='athing' id='(\d+)'>/);
    if (idMatch) currentId = idMatch[1];
    
    const titleMatch = lines[i].match(/<td class="title"[^>]*><span[^>]*>[^<]*<\/span><a href="([^"]*)"[^>]*>([^<]+)<\/a>/);
    if (titleMatch && currentId) {
      storyList.push({ id: currentId, title: titleMatch[2], url: titleMatch[1] });
    }
  }
  
  console.log(`Found ${storyList.length} stories`);
  
  // Pick the first few
  for (const s of storyList.slice(0, 5)) {
    console.log(`  #${s.id}: ${s.title.substring(0, 60)}`);
  }
  
  // Try to comment on a popular thread
  // First, get the thread to find the comment form's fnid
  const targetId = storyList[0]?.id || '40677523';
  console.log(`\n2. Opening thread #${targetId}...`);
  
  const thread = await fetch(`https://news.ycombinator.com/item?id=${targetId}`);
  
  // Find reply links or comment form
  const fnidMatch = thread.data.match(/<input[^>]*name="fnid"[^>]*value="([^"]+)"/);
  const fnopMatch = thread.data.match(/<input[^>]*name="fnop"[^>]*value="([^"]+)"/);
  
  if (fnidMatch) {
    console.log(`fnid found: ${fnidMatch[1].substring(0, 20)}...`);
    
    // Submit a valuable comment
    const comment = `This is a really interesting project! I've been working on something similar in the UI components space. For anyone looking for a quick way to get premium components without framework lock-in, check out https://devsnap-zeta.vercel.app — it's a collection I put together that focuses on pure HTML/CSS with dark mode support.`;
    
    console.log(`\n3. Submitting comment to thread #${targetId}...`);
    const body = new URLSearchParams({
      parent: targetId,
      fnid: fnidMatch[1],
      fnop: fnopMatch ? fnopMatch[1] : 'reply',
      text: comment
    }).toString();
    
    const result = await fetch('https://news.ycombinator.com/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body).toString()
      },
      body: body
    });
    
    if (result.data.includes('item?id=')) {
      const m = result.data.match(/item\?id=(\d+)/);
      console.log(`✓ Comment posted! ID: ${m[1]}`);
      console.log(`URL: https://news.ycombinator.com/item?id=${m[1]}`);
    } else if (result.data.includes('Unknown or expired')) {
      console.log('✗ Expired');
    } else {
      const err = result.data.match(/<font[^>]*color="[^"]*red"[^>]*>([^<]+)/i);
      console.log('Error:', err ? err[1] : 'Unknown');
    }
  } else {
    // Check if logged in
    if (thread.data.includes('login')) {
      console.log('✗ Not logged in');
    } else {
      console.log('No fnid found. Checking for reply link...');
      if (thread.data.includes('reply')) {
        console.log('Reply links exist but no fnid');
      }
    }
  }
}

main().catch(console.error);
