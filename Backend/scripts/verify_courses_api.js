const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function verifyAll() {
  for (let c = 1; c <= 6; c++) {
    const topics = await get(`http://localhost:5000/api/content/courses/${c}/topics`);
    console.log(`Course ${c}: ${topics.length} topics ->`, topics.map(t => t.name).join(' | '));
  }
}

verifyAll().catch(console.error);
