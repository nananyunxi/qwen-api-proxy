/**
 * 通义千问 qwen.ai 登录
 */

const { chromium } = require('playwright');

async function checkQwenLogin() {
  console.log('检查通义千问登录页面...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('页面标题:', await page.title());
  
  // 查找登录按钮
  const buttons = await page.locator('button').all();
  console.log('按钮数量:', buttons.length);
  
  for (const btn of buttons) {
    try {
      const text = await btn.textContent();
      const visible = await btn.isVisible();
      if (visible && text && text.trim()) {
        console.log('按钮:', text.trim());
      }
    } catch {}
  }
  
  // 查找输入框
  const inputs = await page.locator('input').all();
  console.log('输入框数量:', inputs.length);
  
  for (const input of inputs) {
    try {
      const placeholder = await input.getAttribute('placeholder');
      const visible = await input.isVisible();
      if (visible) {
        console.log('输入框: placeholder=', placeholder);
      }
    } catch {}
  }
  
  await page.screenshot({ path: '/workspace/zai-cli/qwen-login.png' });
  console.log('\n截图已保存');
  
  await browser.close();
}

checkQwenLogin().catch(console.error);