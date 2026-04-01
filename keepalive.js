/**
 * 防休眠脚本
 * 每3分钟执行一次操作，保持 sandbox 活跃
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const ACCESS_FILE = path.join(DATA_DIR, 'access.json');
const LOG_FILE = path.join(DATA_DIR, 'keepalive.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [INFO] ${msg}`;
  console.log(logLine);
  try {
    fs.appendFileSync(LOG_FILE, logLine + '\n');
  } catch (e) {}
}

// 加载访问信息
function loadAccessInfo() {
  try {
    return JSON.parse(fs.readFileSync(ACCESS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

// 调用本地 API（带 API Key）
function callLocalAPI() {
  return new Promise((resolve, reject) => {
    const access = loadAccessInfo();
    const apiKey = access.api_key || '';
    
    const req = http.get('http://localhost:3001/v1/models', { 
      timeout: 5000,
      headers: { 'Authorization': 'Bearer ' + apiKey }
    }, (res) => {
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

// 调用外网 API
function callExternalAPI() {
  return new Promise((resolve, reject) => {
    const access = loadAccessInfo();
    if (!access.external_url) {
      reject(new Error('No external URL'));
      return;
    }
    
    const urlObj = new URL(access.external_url + '/v1/models');
    const req = https.request(urlObj.host, {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 10000
    }, (res) => {
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
    req.end();
  });
}

// 每3分钟执行一次
async function keepAlive() {
  log('=== 保活检测开始 ===');
  
  try {
    // 1. 调用本地 API
    await callLocalAPI();
    log('本地 API: OK');
  } catch (e) {
    log('本地 API 失败: ' + e.message);
  }
  
  try {
    // 2. 调用外网 API（如果有）
    await callExternalAPI();
    log('外网 API: OK');
  } catch (e) {
    log('外网 API 失败: ' + e.message + ' (可能隧道未启动)');
  }
  
  // 3. 读取系统信息，保持活跃
  try {
    const stats = fs.statSync(__filename);
    log('文件系统访问: OK');
  } catch (e) {}
  
  log('=== 保活检测完成 ===');
}

// 立即执行一次
keepAlive();

// 每5分钟执行一次 (5 * 60 * 1000 = 300000ms)
setInterval(keepAlive, 5 * 60 * 1000);

log('防休眠脚本已启动，每3分钟执行一次保活检测');