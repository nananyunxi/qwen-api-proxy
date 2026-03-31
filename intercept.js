/**
 * 拦截实际发送消息的请求
 */
const { chromium } = require('playwright');
const fs = require('fs');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function interceptRequest() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  // 收集所有请求
  const requests = [];
  page.on('request', req => {
    if (req.url().includes('chat/completions')) {
      requests.push({
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        postData: req.postData()
      });
    }
  });
  
  // 访问聊天页面
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 点击一个聊天
  const chatItems = await page.locator('[class*="chat"]').all();
  if (chatItems.length > 0) {
    await chatItems[0].click();
    await page.waitForTimeout(2000);
  }
  
  // 发送消息
  const input = page.locator('textarea').first();
  await input.fill('test123');
  await input.press('Enter');
  
  // 等待请求完成
  await page.waitForTimeout(5000);
  
  // 打印请求详情
  console.log('捕获到的请求:');
  for (const req of requests) {
    console.log('\n=== 请求 ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('PostData:', req.postData ? JSON.stringify(req.postData) : 'none');
  }
  
  await browser.close();
}

interceptRequest().catch(console.error);