/**
 * 截图当前登录页面
 */

const { chromium } = require('playwright');

async function screenshot() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  await page.goto('https://chat.z.ai/', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const signInBtn = page.locator('button:has-text("Sign in")').first();
  await signInBtn.click();
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/workspace/zai-cli/current-login.png' });
  console.log('截图已保存');
  
  await browser.close();
}

screenshot().catch(console.error);