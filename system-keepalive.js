/**
 * 系统级防休眠脚本
 * 在 sandbox 环境下，每隔一段时间访问外部网站，防止自动休眠
 */

const https = require('https');
const http = require('http');

// 定期访问的外部网站列表
const externalUrls = [
  'https://www.baidu.com',
  'https://www.google.com',
  'https://cloudflare.com',
  'https://github.com'
];

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// 访问外部网站
function visitUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve('OK');
        } else {
          reject(new Error('Status: ' + res.statusCode));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// 随机选择一个 URL 访问
async function keepAlive() {
  const url = externalUrls[Math.floor(Math.random() * externalUrls.length)];
  try {
    await visitUrl(url);
    log(`✓ 系统防休眠: 访问 ${url} 成功`);
  } catch (e) {
    log(`✗ 系统防休眠: 访问 ${url} 失败 - ${e.message}`);
  }
}

log('系统级防休眠脚本已启动，每 3 分钟访问外部网站防止 sandbox 休眠');

// 立即执行一次
keepAlive();

// 每 3 分钟执行一次
setInterval(keepAlive, 3 * 60 * 1000);