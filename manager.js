/**
 * Qwen API 自动管理服务
 * - 自动检测并更新外网地址
 * - 自动验证登录凭证有效性
 * - 自动重连服务
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const net = require('net');

const PROJECT_DIR = '/workspace/zai-cli';
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const COOKIE_FILE = path.join(DATA_DIR, 'qwen-state.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const ACCESS_FILE = path.join(DATA_DIR, 'access.json');
const LOG_FILE = path.join(DATA_DIR, 'service.log');

const SERVER_PORT = 3001;

// 日志
function log(msg, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${msg}`;
  console.log(logLine);
  fs.appendFileSync(LOG_FILE, logLine + '\n');
}

// 工具函数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function generateAPIKey() {
  return 'qk_' + crypto.randomBytes(24).toString('hex');
}

// 读取/保存配置
function loadConfig() {
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {}
  if (!config.apiKey) {
    config.apiKey = generateAPIKey();
    saveConfig(config);
    log('生成新 API Key: ' + config.apiKey);
  }
  return config;
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadAccessInfo() {
  try {
    return JSON.parse(fs.readFileSync(ACCESS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveAccessInfo(info) {
  info.updated_at = new Date().toISOString();
  fs.writeFileSync(ACCESS_FILE, JSON.stringify(info, null, 2));
  log('保存访问信息: ' + info.external_url);
}

function getCookie() {
  try {
    const data = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
    return data.cookies.map(c => `${c.name}=${c.value}`).join('; ');
  } catch (e) {
    return '';
  }
}

// ─── 验证登录凭证 ─────────────────────────────────────────────────
async function validateCookie() {
  const cookie = getCookie();
  if (!cookie) {
    return { valid: false, reason: '无登录凭证' };
  }
  
  try {
    // 尝试访问用户状态 API
    const response = await fetch('https://chat.qwen.ai/api/v2/users/status', {
      headers: {
        'Cookie': cookie,
        'Origin': 'https://chat.qwen.ai',
        'Referer': 'https://chat.qwen.ai/'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      log('登录凭证有效');
      return { valid: true };
    } else {
      log('登录凭证已失效: ' + data.message);
      return { valid: false, reason: data.message };
    }
  } catch (e) {
    log('验证登录凭证失败: ' + e.message);
    return { valid: false, reason: e.message };
  }
}

// ─── 重新登录（需要手动扫码或验证码） ─────────────────────────────
async function reLogin() {
  log('尝试重新登录...');
  // 这里可以添加自动登录逻辑，如果 Qwen 支持的话
  // 目前需要手动登录，保存凭证
  log('请手动登录，凭证会自动保存到: ' + COOKIE_FILE);
}

// ─── 检查服务状态 ─────────────────────────────────────────────────
function isServiceRunning(port) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => resolve(false));
    socket.connect(port, '127.0.0.1');
  });
}

// ─── 启动 API 服务 ─────────────────────────────────────────────────
function startAPIServer() {
  const config = loadConfig();
  
  // SSE 解析
  function parseSSE(data) {
    let content = '';
    for (const line of data.split('\n')) {
      if (line.startsWith('data:')) {
        const jsonStr = line.substring(5).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const json = JSON.parse(jsonStr);
            const phase = json.choices?.[0]?.delta?.phase;
            if (phase === 'answer' || phase === 'finished') {
              content += json.choices[0].delta.content || '';
            }
          } catch (e) {}
        }
      }
    }
    return content;
  }

  // SSE 流式解析并发送
  function parseAndStreamSSE(data, res, model) {
    const lines = data.split('\n');
    const completionId = `chatcmpl-${Date.now()}`;
    let index = 0;
    
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const jsonStr = line.substring(5).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const json = JSON.parse(jsonStr);
            const phase = json.choices?.[0]?.delta?.phase;
            if (phase === 'answer') {
              const content = json.choices[0].delta.content || '';
              if (content) {
                const chunk = {
                  id: completionId,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: model,
                  choices: [{
                    index: index,
                    delta: { role: 'assistant', content: content },
                    finish_reason: null
                  }]
                };
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
              }
            }
          } catch (e) {}
        }
      }
    }
    
    // 发送结束
    const done = {
      id: completionId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [{
        index: index,
        delta: {},
        finish_reason: 'stop'
      }]
    };
    res.write(`data: ${JSON.stringify(done)}\n\n`);
    res.write('data: [DONE]\n\n');
  }

  // 创建聊天
  async function createChat(cookie, model) {
    const postData = JSON.stringify({
      title: 'New Chat', models: [model],
      chat_mode: 'normal', chat_type: 't2t',
      timestamp: Date.now(), project_id: ''
    });

    return new Promise((resolve, reject) => {
      const req = https.request('https://chat.qwen.ai/api/v2/chats/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookie,
          'Origin': 'https://chat.qwen.ai',
          'Referer': 'https://chat.qwen.ai/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'x-request-id': crypto.randomUUID(),
          'source': 'web',
          'version': '0.2.30'
        }
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (!json.success) reject(new Error(json.data?.details));
            else resolve(json.data.id);
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  // 发送消息
  async function sendMessage(cookie, chatId, model, userMessage) {
    const timestamp = Date.now();
    const postData = JSON.stringify({
      stream: true, version: '2.1', incremental_output: true,
      chat_id: chatId, chat_mode: 'normal', model: model, parent_id: null,
      messages: [{
        fid: generateUUID(), parentId: null, childrenIds: [generateUUID()],
        role: 'user', content: userMessage, user_action: 'chat', files: [],
        timestamp, models: [model], chat_type: 't2t',
        feature_config: {
          thinking_enabled: true, output_schema: 'phase',
          research_mode: 'normal', auto_thinking: true,
          thinking_mode: 'Auto', thinking_format: 'summary', auto_search: true
        },
        extra: { meta: { subChatType: 't2t' } },
        sub_chat_type: 't2t', parent_id: null
      }],
      timestamp
    });

    return new Promise((resolve, reject) => {
      const req = https.request(`https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'Cookie': cookie,
          'Origin': 'https://chat.qwen.ai',
          'Referer': `https://chat.qwen.ai/c/${chatId}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'x-request-id': crypto.randomUUID(), 'source': 'web', 'version': '0.2.30'
        }
      }, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  // 验证 API Key
  function validateAPIKey(req) {
    const auth = req.headers['authorization'] || req.headers['x-api-key'];
    const key = auth?.replace('Bearer ', '').replace('Bearer ', '');
    return key === config.apiKey;
  }

  // HTTP 服务器
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;
    req.body = body ? JSON.parse(body) : {};

    const url = req.url;
    const pathUrl = url.split('?')[0];

    // 聊天接口
    if (pathUrl === '/v1/chat/completions' && req.method === 'POST') {
      if (!validateAPIKey(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid API Key' }));
        return;
      }

      const model = req.body.model || 'qwen3.5-plus';
      const stream = req.body.stream || false;
      const userMessage = req.body.messages?.filter(m => m.role === 'user').pop()?.content || '';
      
      let cookie = getCookie();
      if (!cookie) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '请先登录' }));
        return;
      }

      try {
        const chatId = await createChat(cookie, model);
        const data = await sendMessage(cookie, chatId, model, userMessage);
        
        if (stream) {
          // 流式响应 - SSE 格式
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Transfer-Encoding': 'chunked'
          });
          parseAndStreamSSE(data, res, model);
          res.end();
        } else {
          // 非流式响应
          const content = parseSSE(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 0, completion_tokens: content.length, total_tokens: content.length }
          }));
        }
      } catch (e) {
        log('API 错误: ' + e.message, 'ERROR');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    }
    // 模型列表
    else if (pathUrl === '/v1/models' && req.method === 'GET') {
      if (!validateAPIKey(req)) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Invalid API Key' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        object: 'list',
        data: [
          { id: 'qwen3.5-plus', object: 'model', created: 1234567890, owned_by: 'qwen' },
          { id: 'qwen3.5-flash', object: 'model', created: 1234567890, owned_by: 'qwen' },
          { id: 'qwen3-max-2026-01-23', object: 'model', created: 1234567890, owned_by: 'qwen' },
          { id: 'qwen-plus-2025-07-28', object: 'model', created: 1234567890, owned_by: 'qwen' },
          { id: 'qwen3-coder-plus', object: 'model', created: 1234567890, owned_by: 'qwen' },
          { id: 'qwen3-vl-plus', object: 'model', created: 1234567890, owned_by: 'qwen' }
        ]
      }));
    }
    // 健康检查
    else if (pathUrl === '/health') {
      const cookieValid = await validateCookie();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        cookie_valid: cookieValid.valid,
        tunnel_url: loadAccessInfo().external_url || 'unknown'
      }));
    }
    // 根路径
    else if (pathUrl === '/' && req.method === 'GET') {
      const info = loadAccessInfo();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'Qwen API Proxy',
        base_url: info.base_url || `http://localhost:${SERVER_PORT}/v1`,
        model_id: 'qwen3.5-plus',
        status: 'running'
      }));
    }
    else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(SERVER_PORT, () => {
    log(`API 服务已启动: http://localhost:${SERVER_PORT}`);
  });

  return server;
}

// ─── 启动外网穿透 ─────────────────────────────────────────────────
let cloudflaredProc = null;

async function startTunnel(port) {
  log('启动外网穿透...');
  
  return new Promise(resolve => {
    cloudflaredProc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let tunnelUrl = null;
    let resolved = false;

    cloudflaredProc.stderr.on('data', data => {
      const output = data.toString();
      const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      
      if (match && !tunnelUrl) {
        tunnelUrl = match[0];
        log('外网地址: ' + tunnelUrl);
        
        // 保存访问信息
        const config = loadConfig();
        saveAccessInfo({
          base_url: `${tunnelUrl}/v1`,
          model_id: 'qwen3.5-plus',
          api_key: config.apiKey,
          external_url: tunnelUrl,
          local_url: `http://localhost:${port}`
        });
        
        if (!resolved) {
          resolved = true;
          resolve(tunnelUrl);
        }
      }
    });

    cloudflaredProc.on('error', err => {
      log('穿透启动失败: ' + err.message, 'ERROR');
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });

    setTimeout(() => {
      if (!tunnelUrl && !resolved) {
        log('穿透启动超时', 'WARN');
        resolved = true;
        resolve(null);
      }
    }, 20000);
  });
}

// ─── 定时检查任务 ─────────────────────────────────────────────────
let serverInstance = null;
let tunnelUrl = null;

async function periodicCheck() {
  log('=== 定时检查 ===');
  
  // 1. 检查服务
  const serverRunning = await isServiceRunning(SERVER_PORT);
  log('服务状态: ' + (serverRunning ? '正常' : '离线'));
  
  if (!serverRunning) {
    log('重启服务...', 'WARN');
    try {
      startAPIServer();
    } catch (e) {
      log('重启失败: ' + e.message, 'ERROR');
    }
  }
  
  // 2. 检查登录凭证
  const cookieValid = await validateCookie();
  log('登录凭证: ' + (cookieValid.valid ? '有效' : '无效 - ' + cookieValid.reason));
  
  if (!cookieValid.valid) {
    log('请重新登录，运行: node direct-login.js', 'ERROR');
  }
  
  // 3. 检查穿透连接
  log('外网地址: ' + (tunnelUrl || '未连接'));
  
  // 4. 保存当前访问信息
  const config = loadConfig();
  const accessInfo = loadAccessInfo();
  log('当前访问地址: ' + (accessInfo.external_url || 'unknown'));
}

// ─── 主程序 ─────────────────────────────────────────────────────
async function main() {
  log('========================================');
  log('  Qwen API 自动管理服务');
  log('========================================');
  
  // 启动 API 服务
  serverInstance = startAPIServer();
  
  // 启动穿透
  tunnelUrl = await startTunnel(SERVER_PORT);
  
  if (tunnelUrl) {
    log('========================================');
    log('  当前访问信息:');
    log('  外网地址: ' + tunnelUrl);
    log('  API Key: ' + loadConfig().apiKey);
    log('========================================');
  }
  
  // 首次检查
  await periodicCheck();
  
  // 定时检查（每 10 分钟）
  setInterval(periodicCheck, 10 * 60 * 1000);
  
  // 保活：每 1 分钟自检一次，防止休眠
  setInterval(async () => {
    try {
      const res = await fetch('http://localhost:3001/health');
      log('保活检测: ' + (res.ok ? 'OK' : 'FAIL'));
    } catch (e) {
      log('保活检测失败: ' + e.message, 'WARN');
    }
  }, 60000);
}

main().catch(e => {
  log('启动失败: ' + e.message, 'ERROR');
  process.exit(1);
});