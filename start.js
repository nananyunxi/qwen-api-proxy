/**
 * 启动脚本 - 使用管理器自动运行
 * 包含自动登录验证和外网穿透
 */
const { spawn } = require('child_process');

console.log('启动 Qwen API 管理服务...');

const proc = spawn('node', ['manager.js'], {
  cwd: '/workspace/zai-cli',
  stdio: 'inherit'
});

proc.on('exit', code => {
  console.log('服务退出:', code);
  process.exit(code);
});