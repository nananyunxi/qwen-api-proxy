/**
 * Z.ai 浏览器登录认证和 API 代理
 * 
 * 实现原理：
 * 1. 启动 Chrome 调试模式
 * 2. 用户扫码登录 chat.z.ai
 * 3. 捕获 cookie 和 token
 * 4. 封装成 OpenAI 兼容 API
 * 5. 启动 HTTP 服务
 */

const http = require('http');
const https = require('https');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  port: 3001,
  dataDir: '/workspace/zai-cli/data',
  chromePort: 9222,
  loginUrl: 'https://chat.z.ai/',
  apiBaseUrl: 'https://api.z.ai'
};

// 确保目录存在
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

const authFile = path.join(CONFIG.dataDir, 'auth.json');

// ─── 日志 ───────────────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ─── 检查 Chrome 是否运行 ───────────────────────────────────────
function checkChrome() {
  try {
    execSync(`lsof -i:${CONFIG.chromePort}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ─── 启动 Chrome 调试模式 ───────────────────────────────────────
function startChrome() {
  log('启动 Chrome 调试模式...');
  
  // 检查是否已有 Chrome 运行
  if (checkChrome()) {
    log('Chrome 调试模式已在运行');
    return true;
  }
  
  const userDataDir = path.join(CONFIG.dataDir, 'chrome-data');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  
  const chromeProcess = spawn('google-chrome', [
    `--remote-debugging-port=${CONFIG.chromePort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-default-apps',
    '--disable-popup-blocking',
    'https://chat.z.ai/'
  ], {
    detached: true,
    stdio: 'ignore'
  });
  
  chromeProcess.unref();
  
  // 等待 Chrome 启动
  setTimeout(() => {
    log('Chrome 已启动，请扫码登录 Z.ai');
    log('登录地址: https://chat.z.ai/');
  }, 3000);
  
  return true;
}

// ─── 捕获凭证（通过 CDP） ───────────────────────────────────────
async function captureCredentials() {
  log('开始捕获登录凭证...');
  
  // 使用 Node.js 的 CDP 客户端
  const CDP = require('chrome-remote-interface');
  
  try {
    const client = await CDP({ port: CONFIG.chromePort });
    const { Network, Page } = client;
    
    await Network.enable();
    await Page.enable();
    
    // 监听所有请求
    Network.requestWillBeSent((params) => {
      const url = params.request.url;
      
      // 查找包含 token 或 cookie 的请求
      if (url.includes('z.ai') || url.includes('bigmodel')) {
        const headers = params.request.headers;
        
        // 检查 Authorization header
        if (headers['Authorization']) {
          log(`发现 Authorization: ${headers['Authorization'].substring(0, 50)}...`);
          saveAuth({ bearer: headers['Authorization'] });
        }
        
        // 检查 Cookie
        if (headers['Cookie']) {
          log(`发现 Cookie`);
          saveAuth({ cookie: headers['Cookie'] });
        }
      }
    });
    
    log('正在监听网络请求，请完成登录...');
    
    // 等待一段时间让用户登录
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    await client.close();
    log('凭证捕获完成');
    
  } catch (e) {
    log(`CDP 连接失败: ${e.message}`);
    log('请手动登录后运行 capture 命令');
  }
}

// ─── 保存凭证 ───────────────────────────────────────────────────
function saveAuth(auth) {
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  } catch {}
  
  const updated = { ...existing, ...auth, timestamp: Date.now() };
  fs.writeFileSync(authFile, JSON.stringify(updated, null, 2));
  log('凭证已保存');
}

// ─── OpenAI 兼容 API 处理器 ─────────────────────────────────────
async function handleChatCompletion(req, res) {
  try {
    const body = req.body;
    const model = body.model || 'glm-4';
    const messages = body.messages || [];
    const stream = body.stream || false;
    
    log(`收到请求: model=${model}, messages=${messages.length}`);
    
    // 读取凭证
    let auth = {};
    try {
      auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
    } catch {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '未登录，请先运行 login 命令' }));
      return;
    }
    
    // 构建 Z.ai API 请求
    const zaiMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    const requestData = {
      model: model,
      messages: zaiMessages,
      temperature: body.temperature || 1.0,
      top_p: body.top_p || 0.7,
      max_tokens: body.max_tokens || 2048
    };
    
    if (stream) {
      // 流式响应
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      const zaiResponse = await fetch(`${CONFIG.apiBaseUrl}/api/paas/v4/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth.bearer || '',
          'Cookie': auth.cookie || ''
        },
        body: JSON.stringify(requestData)
      });
      
      for await (const chunk of zaiResponse.body) {
        res.write(chunk);
      }
      res.end();
      
    } else {
      // 非流式响应
      const zaiResponse = await fetch(`${CONFIG.apiBaseUrl}/api/paas/v4/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth.bearer || '',
          'Cookie': auth.cookie || ''
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await zaiResponse.json();
      
      // 转换为 OpenAI 格式
      const openaiResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: data.choices?.[0]?.message?.content || ''
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(openaiResponse));
    }
    
    log('请求完成');
    
  } catch (e) {
    log(`请求错误: ${e.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
}

// ─── HTTP 服务器 ────────────────────────────────────────────────
function startServer() {
  const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // 解析 body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    req.body = body ? JSON.parse(body) : {};
    
    // 路由
    const path = req.url;
    
    if (path === '/v1/chat/completions' && req.method === 'POST') {
      await handleChatCompletion(req, res);
    } 
    else if (path === '/v1/models' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        object: 'list',
        data: [
          { id: 'glm-4', object: 'model', created: 1234567890, owned_by: 'z.ai' },
          { id: 'glm-4-flash', object: 'model', created: 1234567890, owned_by: 'z.ai' },
          { id: 'glm-4-flash', object: 'model', created: 1234567890, owned_by: 'z.ai' }
        ]
      }));
    }
    else if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    }
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  server.listen(CONFIG.port, () => {
    log(`========================================`);
    log(`  Z.ai CLI 服务已启动`);
    log(`  API 地址: http://localhost:${CONFIG.port}/v1/chat/completions`);
    log(`  模型列表: http://localhost:${CONFIG.port}/v1/models`);
    log(`========================================`);
  });
}

// ─── 主程序 ───────────────────────────────────────────────────
const command = process.argv[2];

switch (command) {
  case 'login':
    startChrome();
    log('请在浏览器中登录 Z.ai');
    log('登录完成后运行: node index.js capture');
    break;
    
  case 'capture':
    captureCredentials();
    break;
    
  case 'serve':
  default:
    startServer();
    break;
}