/**
 * 通义千问 qwen.ai 登录流程
 */

const { chromium } = require('playwright');

const PHONE = '13265896929';

async function qwenLogin() {
  console.log('开始通义千问登录...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  // 1. 访问首页
  console.log('1. 访问 Qwen...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 2. 点击 Log in
  console.log('2. 点击 Log in...');
  const logInBtn = page.locator('button:has-text("Log in")').first();
  await logInBtn.click();
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/workspace/zai-cli/qwen-after-login.png' });
  
  // 3. 查找登录选项
  console.log('3. 检查登录选项...');
  
  // 尝试找手机号登录
  const phoneTab = page.locator('text=手机号').first();
  if (await phoneTab.isVisible().catch(() => false)) {
    console.log('找到手机号登录选项');
    await phoneTab.click();
    await page.waitForTimeout(2000);
  }
  
  // 查找手机号输入框
  const phoneInput = page.locator('input[placeholder*="手机"], input[type="tel"]').first();
  if (await phoneInput.isVisible().catch(() => false)) {
    console.log('找到手机号输入框！');
    await phoneInput.fill(PHONE);
    
    // 查找发送验证码按钮
    const sendBtn = page.locator('button:has-text("获取验证码"), button:has-text("发送"), button:has-text("Send")').first();
    if (await sendBtn.isVisible().catch(() => false)) {
      console.log('4. 点击发送验证码...');
      await sendBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/workspace/zai-cli/qwen-code-sent.png' });
      console.log('✅ 验证码已发送！请告诉我验证码');
    }
  } else {
    console.log('未找到手机号输入框，截图查看...');
    await page.screenshot({ path: '/workspace/zai-cli/qwen-no-phone.png' });
  }
  
  await browser.close();
}

qwenLogin().catch(console.error);