/**
 * Z.ai 自动化登录脚本
 */

const { chromium } = require('playwright');

async function login() {
  console.log('启动无头浏览器...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  console.log('打开 Z.ai 登录页面...');
  await page.goto('https://chat.z.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 截图看看页面状态
  await page.screenshot({ path: '/workspace/zai-cli/login-page.png' });
  console.log('截图已保存');
  
  // 查找登录按钮
  const pageContent = await page.content();
  
  // 尝试点击登录
  try {
    // 查找可能的登录元素
    const loginButtons = await page.locator('button, a').all();
    for (const btn of loginButtons) {
      const text = await btn.textContent();
      if (text && text.includes('登录')) {
        console.log('找到登录按钮:', text);
        await btn.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
  } catch (e) {
    console.log('点击登录按钮失败:', e.message);
  }
  
  // 再次截图
  await page.screenshot({ path: '/workspace/zai-cli/login-page2.png' });
  
  // 查找手机号输入框
  try {
    const phoneInput = await page.locator('input[placeholder*="手机"], input[name*="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible()) {
      console.log('找到手机号输入框');
    }
  } catch (e) {
    console.log('未找到手机号输入框');
  }
  
  console.log('页面信息已保存，你可以查看截图');
  
  await browser.close();
}

login().catch(console.error);