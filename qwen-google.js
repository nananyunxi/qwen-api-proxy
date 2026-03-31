/**
 * 通义千问 Google 登录
 */

const { chromium } = require('playwright');

const EMAIL = 'hirfzlesmmgxnub@oegmail.com';
const PASSWORD = 'kong#15869772504';

async function googleLogin() {
  console.log('开始 Google 登录...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  // 1. 访问 Qwen
  console.log('1. 访问 Qwen...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 2. 点击 Log in
  console.log('2. 点击 Log in...');
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(3000);
  
  // 3. 点击 Continue with Google
  console.log('3. 点击 Continue with Google...');
  const googleBtn = page.locator('button:has-text("Continue with Google")').first();
  await googleBtn.click();
  await page.waitForTimeout(5000);
  
  // 4. 检查是否跳转到 Google 登录页
  const currentUrl = page.url();
  console.log('当前 URL:', currentUrl);
  
  if (currentUrl.includes('google')) {
    console.log('4. 已在 Google 登录页...');
    await page.screenshot({ path: '/workspace/zai-cli/google-page.png' });
    
    // 输入邮箱
    console.log('5. 输入邮箱...');
    const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
    await emailInput.fill(EMAIL);
    await page.waitForTimeout(1000);
    
    // 点击下一步
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("下一步")').first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(3000);
      
      console.log('6. 输入密码...');
      await page.screenshot({ path: '/workspace/zai-cli/google-password.png' });
      
      // 输入密码
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await passwordInput.fill(PASSWORD);
      
      // 点击下一步
      const loginBtn = page.locator('button:has-text("Next"), button:has-text("下一步"), button:has-text("登录")').first();
      await loginBtn.click();
      await page.waitForTimeout(5000);
      
      console.log('✅ 登录完成！');
      await page.screenshot({ path: '/workspace/zai-cli/qwen-logged-in.png' });
    }
  }
  
  await browser.close();
}

googleLogin().catch(console.error);