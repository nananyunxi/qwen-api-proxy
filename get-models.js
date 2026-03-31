/**
 * 获取可用模型
 */
const fs = require('fs');
const https = require('https');

const COOKIE_FILE = '/workspace/zai-cli/data/qwen-state.json';

function getCookie() {
  const data = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
  return data.cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

async function getModels() {
  const cookie = getCookie();
  
  const response = await new Promise((resolve, reject) => {
    const req = https.request('https://chat.qwen.ai/api/models', {
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'Origin': 'https://chat.qwen.ai',
        'Referer': 'https://chat.qwen.ai/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
  
  console.log('Models Response:');
  console.log(response);
}

getModels().catch(console.error);