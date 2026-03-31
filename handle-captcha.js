/**
 * 处理拼图验证
 */

const { chromium } = require('playwright');

async function handleSliderCaptcha() {
  console.log('检查并处理拼图验证...\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // 需要看到界面
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 1. 访问首页
  await page.goto('https://chat.z.ai/', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 2. 点击 Sign in
  const signInBtn = page.locator('button:has-text("Sign in")').first();
  await signInBtn.click();
  await page.waitForTimeout(3000);
  
  // 3. 输入手机号
  console.log('输入手机号...');
  const phoneInput = page.locator('input[placeholder*="手机"], input[type="tel"]').first();
  await phoneInput.fill('13265896929');
  await page.waitForTimeout(1000);
  
  // 4. 点击发送验证码
  console.log('点击发送验证码...');
  const sendCodeBtn = page.locator('button').filter({ hasText: '获取验证码' }).first();
  if (await sendCodeBtn.isVisible().catch(() => false)) {
    await sendCodeBtn.click();
    await page.waitForTimeout(3000);
  }
  
  console.log('\n请在浏览器中手动完成拼图验证...');
  console.log('完成后告诉我');
  
  // 保持浏览器打开
  await new Promise(() => {});
}

handleSliderCaptcha().catch(console.error);