/**
 * Qwen 网页版 OpenAI 兼容 API 服务器
 * 带 API Key 认证
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3001;
const DATA_DIR = '/workspace/zai-cli/data';
const COOKIE_FILE = path.join(DATA_DIR, 'qwen-state.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// 生成 API Key
function generateAPIKey() {
  return 'qk_' + crypto.randomBytes(24).toString('hex');
}

// 加载/保存配置
function loadConfig() {
  let config = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {}
  }
  
  // 如果没有 API Key，生成一个
  if (!config.apiKey) {
    config.apiKey = generateAPIKey();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('生成 API Key:', config.apiKey);
  }
  
  return config;
}

const CONFIG = loadConfig();

// 显示 API Key
console.log('\n========================================');
console.log('  API Key:', CONFIG.apiKey);
console.log('========================================\n');

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getCookie() {
  try {
    const data = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
    return data.cookies.map(c => `${c.name}=${c.value}`).join('; ');
  } catch (e) {
    return '';
  }
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ─── 解析 SSE ─────────────────────────────────────────────────────
function parseSSE(data) {
  const lines = data.split('\n');
  let content = '';
  for (const line of lines) {
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

// ─── 创建聊天 ─────────────────────────────────────────────────────
async function createChat(cookie, model) {
  const postData = JSON.stringify({
    title: 'New Chat',
    models: [model],
    chat_mode: 'normal',
    chat_type: 't2t',
    timestamp: Date.now(),
    project_id: ''
  });

  return new Promise((resolve, reject) => {
    const req = https.request('https://chat.qwen.ai/api/v2/chats/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'Origin': 'https://chat.qwen.ai',
        'Referer': 'https://chat.qwen.ai/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        'x-request-id': crypto.randomUUID(),
        'source': 'web',
        'version': '0.2.30',
        'accept': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.success) {
            reject(new Error(json.data?.details || data));
            return;
          }
          resolve(json.data.id);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ─── 发送消息 ─────────────────────────────────────────────────────
async function sendMessage(cookie, chatId, model, userMessage) {
  const timestamp = Date.now();
  const messageId = generateUUID();
  const postData = JSON.stringify({
    stream: true,
    version: '2.1',
    incremental_output: true,
    chat_id: chatId,
    chat_mode: 'normal',
    model: model,
    parent_id: null,
    messages: [{
      fid: messageId,
      parentId: null,
      childrenIds: [generateUUID()],
      role: 'user',
      content: userMessage,
      user_action: 'chat',
      files: [],
      timestamp: timestamp,
      models: [model],
      chat_type: 't2t',
      feature_config: {
        thinking_enabled: true,
        output_schema: 'phase',
        research_mode: 'normal',
        auto_thinking: true,
        thinking_mode: 'Auto',
        thinking_format: 'summary',
        auto_search: true
      },
      extra: { meta: { subChatType: 't2t' } },
      sub_chat_type: 't2t',
      parent_id: null
    }],
    timestamp: timestamp
  });

  return new Promise((resolve, reject) => {
    const url = `https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`;
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'Origin': 'https://chat.qwen.ai',
        'Referer': `https://chat.qwen.ai/c/${chatId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        'x-request-id': crypto.randomUUID(),
        'source': 'web',
        'version': '0.2.30',
        'accept': 'application/json',
        'x-accel-buffering': 'no'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ─── 验证 API Key ─────────────────────────────────────────────────
function validateAPIKey(req) {
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  const apiKey = authHeader?.replace('Bearer ', '')?.replace('Bearer ', '');
  return apiKey === CONFIG.apiKey;
}

// ─── API 服务器 ─────────────────────────────────────────────────────
function startAPIServer() {
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
    for await (const chunk of req) {
      body += chunk;
    }
    req.body = body ? JSON.parse(body) : {};
    
    const url = req.url;
    const path = url.split('?')[0];
    
    // /v1/chat/completions
    if (path === '/v1/chat/completions' && req.method === 'POST') {
      // 验证 API Key
      if (!validateAPIKey(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid API Key' }));
        return;
      }
      
      const model = req.body.model || 'qwen3.5-plus';
      const messages = req.body.messages || [];
      const stream = req.body.stream || false;
      const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
      
      log(`收到请求: ${userMessage.substring(0, 20)}...`);
      
      let cookie = getCookie();
      if (!cookie) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '登录凭证已失效' }));
        return;
      }
      
      try {
        log('创建聊天...');
        const chatId = await createChat(cookie, model);
        log(`聊天: ${chatId}`);
        
        log('发送消息...');
        const data = await sendMessage(cookie, chatId, model, userMessage);
        
        const content = parseSSE(data);
        log(`响应: ${content.substring(0, 30)}...`);
        
        const openaiResponse = {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{
            index: 0,
            message: { role: 'assistant', content: content },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 0,
            completion_tokens: content.length,
            total_tokens: content.length
          }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(openaiResponse));
        
      } catch (e) {
        log(`错误: ${e.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    }
    // /v1/chat/completions/stream - 专用流式接口
    else if (path === '/v1/models' && req.method === 'GET') {
      if (!validateAPIKey(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
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
    // /health - 不需要认证
    else if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', hasCookie: !!getCookie() }));
    }
    // /info - 查看配置信息（不暴露 Key）
    else if (path === '/info' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        base_url: `http://localhost:${PORT}/v1`,
        model_id: 'qwen3.5-plus',
        has_cookie: !!getCookie()
      }));
    }
    // 根路径
    else if (path === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'Qwen Web API (OpenAI Compatible)',
        base_url: `http://localhost:${PORT}/v1`,
        model_id: 'qwen3.5-plus',
        api_key: '使用 Authorization 头传入',
        status: getCookie() ? 'ready' : 'not_logged_in'
      }));
    }
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(PORT, () => {
    log(`========================================`);
    log(`  Qwen Web API 服务已启动`);
    log(`  本地: http://localhost:${PORT}/v1`);
    log(`  Model: qwen3.5-plus`);
    log(`  API Key: ${CONFIG.apiKey}`);
    log(`========================================`);
  });
}

startAPIServer();