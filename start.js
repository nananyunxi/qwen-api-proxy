/**
 * 一键启动脚本
 * 同时启动 API 服务和防休眠脚本
 */

const { spawn } = require('child_process');
const path = require('path');

const PROJECT_DIR = __dirname;

function startService(name, script) {
  console.log(`启动 ${name}...`);
  
  const proc = spawn('node', [script], {
    cwd: PROJECT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });
  
  proc.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });
  
  proc.stderr.on('data', (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });
  
  return proc;
}

// 启动主服务
startService('API服务', 'manager.js');

// 等待2秒后启动防休眠脚本
setTimeout(() => {
  startService('防休眠', 'keepalive.js');
}, 2000);

console.log('所有服务已启动');