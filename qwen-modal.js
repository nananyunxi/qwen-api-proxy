/**
 * 检查通义千问登录弹窗
 */

const { chromium } = require('playwright');

async function checkQwenLoginModal() {
  console.log('检查登录弹窗...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 点击 Log in
  await page.locator('button:has-text("Log in")').click();
  await page.waitForTimeout(3000);
  
  // 获取弹窗内容
  const modalContent = await page.content();
  
  // 查找所有文本内容
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n页面文本内容:');
  console.log(bodyText);
  
  await page.screenshot({ path: '/workspace/zai-cli/qwen-modal.png' });
  console.log('\n截图已保存');
  
  await browser.close();
}

checkQwenLoginModal().catch(console.error);