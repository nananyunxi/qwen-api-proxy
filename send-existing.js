/**
 * 使用现有聊天发送消息
 */
const { chromium } = require('playwright');
const fs = require('fs');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';
const CHAT_ID = '86f76ee9-428d-48b6-9f65-915445378c94'; // 之前成功过的聊天

async function sendToExistingChat() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 使用现有聊天发送消息
  const msgResp = await page.evaluate(async (chatId) => {
    const resp = await fetch(`https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://chat.qwen.ai',
        'Referer': `https://chat.qwen.ai/c/${chatId}`
      },
      body: JSON.stringify({
        chat_id: chatId,
        parent_id: '',
        prompt: 'hi',
        urls: [],
        search_level: {},
        search_url: '',
        file_ids: [],
        stream: false,
        extra: { display: 'percentage', language: '' }
      }),
      credentials: 'include'
    });
    return await resp.text();
  }, CHAT_ID);
  
  console.log('响应:', msgResp.substring(0, 2000));
  
  await browser.close();
}

sendToExistingChat().catch(console.error);