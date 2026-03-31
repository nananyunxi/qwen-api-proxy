/**
 * Z.ai 登录流程 - 输入手机号并发送验证码
 */

const { chromium } = require('playwright');

const PHONE = process.argv[2] || '13265896929';

async function inputPhoneAndSendCode() {
  console.log('输入手机号并发送验证码...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
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
  console.log('输入手机号:', PHONE);
  const phoneInput = page.locator('input[placeholder*="手机"], input[placeholder*="phone"], input[type="tel"]').first();
  await phoneInput.fill(PHONE);
  await page.waitForTimeout(1000);
  
  // 4. 点击发送验证码按钮
  console.log('点击发送验证码...');
  const sendCodeBtn = page.locator('button:has-text("获取验证码"), button:has-text("发送验证码"), button:has-text("Send")').first();
  
  if (await sendCodeBtn.isVisible().catch(() => false)) {
    await sendCodeBtn.click();
    console.log('验证码已发送！');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/zai-cli/code-sent.png' });
    console.log('截图已保存');
  } else {
    console.log('未找到发送验证码按钮');
    await page.screenshot({ path: '/workspace/zai-cli/no-send-btn.png' });
  }
  
  await browser.close();
  console.log('\n✅ 验证码已发送到手机 ', PHONE);
  console.log('请告诉我验证码');
}

inputPhoneAndSendCode().catch(console.error);