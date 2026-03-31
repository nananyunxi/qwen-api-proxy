/**
 * 用 Playwright 模拟完整请求
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function testWithPlaywright() {
  console.log('========================================');
  console.log('  Playwright 模拟请求测试');
  console.log('========================================\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  // 直接拦截 fetch 请求并打印
  page.on('request', req => {
    if (req.url().includes('chat/completions')) {
      console.log('请求 URL:', req.url());
      console.log('请求方法:', req.method());
      console.log('请求头:', JSON.stringify(req.headers(), null, 2));
    }
  });
  
  // 访问聊天页面
  console.log('1. 访问页面...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 使用页面的 fetch 来发送请求
  const result = await page.evaluate(async () => {
    // 先创建聊天
    const createResp = await fetch('https://chat.qwen.ai/api/v2/chats/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://chat.qwen.ai',
        'Referer': 'https://chat.qwen.ai/'
      },
      body: JSON.stringify({
        title: 'Test',
        models: ['qwen3.5-plus'],
        chat_mode: 'normal',
        chat_type: 't2t',
        timestamp: Date.now(),
        project_id: ''
      }),
      credentials: 'include'
    });
    
    const createData = await createResp.json();
    console.log('创建响应:', JSON.stringify(createData));
    
    if (!createData.success) {
      return { error: createData };
    }
    
    const chatId = createData.data.id;
    
    // 发送消息
    const msgResp = await fetch(`https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://chat.qwen.ai',
        'Referer': `https://chat.qwen.ai/c/${chatId}`
      },
      body: JSON.stringify({
        chat_id: chatId,
        parent_id: '',
        prompt: 'hello',
        urls: [],
        search_level: {},
        search_url: '',
        file_ids: [],
        stream: false,
        extra: { display: 'percentage', language: '' }
      }),
      credentials: 'include'
    });
    
    const msgData = await msgResp.text();
    return { chatId, response: msgData };
  });
  
  console.log('\n结果:', JSON.stringify(result, null, 2));
  
  await browser.close();
}

testWithPlaywright().catch(console.error);