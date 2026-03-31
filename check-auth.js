/**
 * 直接访问 auth 页面看登录选项
 */
const { chromium } = require('playwright');

async function checkAuthPage() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 直接访问 auth 页面
  await page.goto('https://chat.qwen.ai/auth?mode=login', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 截图
  await page.screenshot({ path: '/workspace/zai-cli/auth-page.png' });
  
  // 获取可见文本
  const text = await page.evaluate(() => document.body.innerText);
  console.log('页面内容:');
  console.log(text);
  
  // 查找所有按钮和链接
  console.log('\n\n所有按钮和链接:');
  const elements = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('button, a, [role="button"]').forEach(el => {
      const text = el.innerText?.trim() || el.textContent?.trim() || '';
      const href = el.href || '';
      if (text || href) {
        result.push({ text, href });
      }
    });
    return result;
  });
  
  elements.forEach(el => {
    if (el.text || el.href) {
      console.log(`- "${el.text}" -> ${el.href}`);
    }
  });
  
  await browser.close();
}

checkAuthPage().catch(console.error);