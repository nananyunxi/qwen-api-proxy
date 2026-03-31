/**
 * Z.ai 登录流程
 */

const { chromium } = require('playwright');

async function doLogin() {
  console.log('开始登录流程...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 1. 访问首页
  console.log('1. 访问 Z.ai...');
  await page.goto('https://chat.z.ai/', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 2. 点击 Sign in
  console.log('2. 点击 Sign in...');
  const signInBtn = page.locator('button:has-text("Sign in")').first();
  await signInBtn.click();
  await page.waitForTimeout(3000);
  
  // 截图
  await page.screenshot({ path: '/workspace/zai-cli/after-signin.png' });
  
  // 3. 查看登录选项
  console.log('3. 检查登录选项...');
  const pageContent = await page.content();
  
  // 尝试找手机号登录选项
  const phoneLogin = await page.locator('text=手机号').first();
  if (await phoneLogin.isVisible().catch(() => false)) {
    console.log('找到手机号登录选项');
    await phoneLogin.click();
    await page.waitForTimeout(2000);
  }
  
  // 尝试找验证码登录选项  
  const codeLogin = await page.locator('text=验证码').first();
  if (await codeLogin.isVisible().catch(() => false)) {
    console.log('找到验证码登录选项');
    await codeLogin.click();
    await page.waitForTimeout(2000);
  }
  
  // 查找手机号输入框
  console.log('4. 查找手机号输入框...');
  const phoneInput = await page.locator('input[placeholder*="手机"], input[placeholder*="phone"], input[type="tel"]').first();
  
  if (await phoneInput.isVisible().catch(() => false)) {
    console.log('找到手机号输入框！');
    await page.screenshot({ path: '/workspace/zai-cli/phone-input.png' });
    console.log('\n请告诉我手机号，我继续输入');
  } else {
    console.log('未找到手机号输入框');
    await page.screenshot({ path: '/workspace/zai-cli/no-phone.png' });
  }
  
  await browser.close();
}

doLogin().catch(console.error);