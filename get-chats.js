/**
 * 尝试获取聊天历史，找到已存在的 chat_id
 */
const { chromium } = require('playwright');
const fs = require('fs');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function getChatHistory() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  // 访问页面并获取聊天列表
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 获取 cookie
  const cookies = await context.cookies();
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  
  // 获取聊天列表
  const chatsResp = await page.evaluate(async () => {
    const resp = await fetch('https://chat.qwen.ai/api/v2/chats/?page=1&exclude_project=true', {
      headers: { 'Origin': 'https://chat.qwen.ai', 'Referer': 'https://chat.qwen.ai/' }
    });
    return await resp.json();
  });
  
  console.log('聊天列表:', JSON.stringify(chatsResp, null, 2).substring(0, 2000));
  
  // 如果有聊天，使用第一个
  if (chatsResp.success && chatsResp.data?.list?.length > 0) {
    const chatId = chatsResp.data.list[0].id;
    console.log('\n使用现有聊天 ID:', chatId);
    
    // 发送消息到现有聊天
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
          prompt: 'test',
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
    }, chatId);
    
    console.log('消息响应:', msgResp);
  }
  
  await browser.close();
}

getChatHistory().catch(console.error);