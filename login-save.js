/**
 * 登录 Qwen 并保存状态
 */

const { chromium } = require('playwright');

async function loginAndSave() {
  console.log('登录并保存状态...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 登录
  console.log('1. 访问 Qwen...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log('2. 点击 Log in...');
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(3000);
  
  console.log('3. 点击 Google 登录...');
  await page.locator('button:has-text("Continue with Google")').click();
  await page.waitForTimeout(5000);
  
  console.log('4. 输入邮箱...');
  const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
  await emailInput.fill('hirfzlesmmgxnub@oegmail.com');
  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(3000);
  
  console.log('5. 输入密码...');
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill('kong#15869772504');
  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(5000);
  
  console.log('6. 保存登录状态...');
  await context.storageState({ path: '/workspace/zai-cli/data/qwen-state.json' });
  console.log('✅ 状态已保存');
  
  await browser.close();
}

loginAndSave().catch(e => console.error('错误:', e.message));