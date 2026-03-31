/**
 * 快速检查登录状态
 */
const { chromium } = require('playwright');
const path = require('path');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function checkLogin() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  console.log('访问通义千问...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 获取页面内容
  const content = await page.content();
  const url = page.url();
  
  console.log('当前 URL:', url);
  console.log('页面包含 "Log in":', content.includes('Log in'));
  console.log('页面包含 "avatar":', content.includes('avatar') || content.includes('Avatar'));
  console.log('页面包含 "退出":', content.includes('退出') || content.includes('logout'));
  
  // 截图
  await page.screenshot({ path: '/workspace/zai-cli/check-login.png' });
  console.log('截图已保存');
  
  // 检查 cookie
  const cookies = await context.cookies();
  console.log('\nCookie 数量:', cookies.length);
  console.log('Cookie 域名:', [...new Set(cookies.map(c => c.domain))]);
  
  await browser.close();
}

checkLogin().catch(console.error);