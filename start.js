/**
 * 启动脚本 - 自动启动服务和穿透
 */
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/workspace/zai-cli';
const CONFIG_FILE = path.join(PROJECT_DIR, 'data', 'access.json');
const SERVER_PORT = 3001;

// 读取当前配置
function loadAccessInfo() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveAccessInfo(info) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(info, null, 2));
  console.log('访问信息已保存到:', CONFIG_FILE);
}

// 检查服务是否运行
function isServiceRunning(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
    socket.connect(port, '127.0.0.1');
  });
}

// 启动 API 服务
async function startServer() {
  console.log('启动 API 服务...');
  
  return new Promise((resolve) => {
    const proc = spawn('node', ['server.js'], {
      cwd: PROJECT_DIR,
      detached: true,
      stdio: 'ignore'
    });
    proc.unref();
    
    // 等待服务启动
    setTimeout(async () => {
      if (await isServiceRunning(SERVER_PORT)) {
        console.log('✅ API 服务已启动');
        resolve(true);
      } else {
        console.log('❌ API 服务启动失败');
        resolve(false);
      }
    }, 3000);
  });
}

// 启动 cloudflared 穿透
let cloudflaredProc = null;

async function startTunnel(port) {
  console.log('启动外网穿透...');
  
  return new Promise((resolve) => {
    cloudflaredProc = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let tunnelUrl = null;
    
    cloudflaredProc.stderr.on('data', (data) => {
      const output = data.toString();
      // console.log('cloudflared:', output.substring(0, 100));
      
      // 提取 URL
      const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && !tunnelUrl) {
        tunnelUrl = match[0];
        console.log('✅ 外网地址:', tunnelUrl);
        resolve(tunnelUrl);
      }
    });
    
    cloudflaredProc.on('error', (err) => {
      console.log('❌ 穿透启动失败:', err.message);
      resolve(null);
    });
    
    // 超时
    setTimeout(() => {
      if (!tunnelUrl) {
        console.log('⚠️ 穿透超时');
        resolve(null);
      }
    }, 15000);
  });
}

// 主流程
async function main() {
  console.log('========================================');
  console.log('  Qwen API 自动启动');
  console.log('========================================\n');
  
  // 1. 启动 API 服务
  await startServer();
  
  // 2. 启动外网穿透
  const tunnelUrl = await startTunnel(SERVER_PORT);
  
  // 3. 保存访问信息
  const accessInfo = {
    base_url: tunnelUrl ? `${tunnelUrl}/v1` : `http://localhost:${SERVER_PORT}/v1`,
    model_id: 'qwen3.5-plus',
    api_key: 'qk_c2f0e1a9e3fa538d593a9be63e42bf4802927067dd87c15c',
    external_url: tunnelUrl,
    local_url: `http://localhost:${SERVER_PORT}`,
    updated_at: new Date().toISOString()
  };
  
  saveAccessInfo(accessInfo);
  
  console.log('\n========================================');
  console.log('  当前访问信息:');
  console.log('  外网地址:', accessInfo.external_url);
  console.log('  Base URL:', accessInfo.base_url);
  console.log('  API Key:', accessInfo.api_key);
  console.log('========================================\n');
  
  // 4. 定期检查服务状态
  setInterval(async () => {
    const serverOk = await isServiceRunning(SERVER_PORT);
    console.log(`[${new Date().toISOString()}] 服务状态: ${serverOk ? 'OK' : '离线'}`);
  }, 30000);
}

main().catch(console.error);