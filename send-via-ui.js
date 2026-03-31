/**
 * 模拟页面内的发送消息方式
 */
const { chromium } = require('playwright');
const fs = require('fs');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function sendViaUI() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  // 访问聊天页面
  console.log('1. 访问聊天页面...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 点击一个已存在的聊天
  console.log('2. 点击已存在的聊天...');
  const chatItems = await page.locator('[class*="chat"], [class*="Conversation"]').all();
  if (chatItems.length > 0) {
    await chatItems[0].click();
    await page.waitForTimeout(2000);
  }
  
  // 找到输入框并发送消息
  console.log('3. 发送消息...');
  const input = page.locator('textarea').first();
  await input.fill('hello');
  await page.waitForTimeout(500);
  
  // 点击发送按钮或按 Enter
  await input.press('Enter');
  
  // 等待响应
  await page.waitForTimeout(10000);
  
  // 获取页面上的响应
  console.log('4. 获取响应...');
  const responseElements = await page.locator('[class*="message"], [class*="response"], [class*="assistant"]').all();
  
  for (const el of responseElements) {
    const text = await el.textContent();
    if (text && text.length > 0) {
      console.log('响应元素:', text.substring(0, 100));
    }
  }
  
  // 获取页面内容
  const content = await page.content();
  console.log('包含 response.created:', content.includes('response.created'));
  
  await browser.close();
}

sendViaUI().catch(console.error);