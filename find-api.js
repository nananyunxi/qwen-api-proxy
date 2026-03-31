/**
 * 查找 Qwen 的实际 API
 */
const { chromium } = require('playwright');
const fs = require('fs');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function findAPI() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  // 监听网络请求
  const requests = [];
  page.on('request', req => {
    if (req.url().includes('api') || req.url().includes('chat')) {
      requests.push({
        url: req.url(),
        method: req.method()
      });
    }
  });
  
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 发送一条消息
  const input = page.locator('textarea, input[type="text"]').first();
  if (await input.isVisible().catch(() => false)) {
    await input.fill('你好');
    await page.waitForTimeout(500);
    
    const sendBtn = page.locator('button:has-text("Send"), button:has-text("发送")').first();
    await sendBtn.click();
    await page.waitForTimeout(5000);
  }
  
  console.log('网络请求:');
  requests.forEach(r => console.log(`  ${r.method} ${r.url}`));
  
  await browser.close();
}

findAPI().catch(console.error);