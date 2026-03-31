/**
 * 抓取 Qwen 聊天 API - 发送消息时拦截
 */
const { chromium } = require('playwright');
const fs = require('fs');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function captureChatAPI() {
  console.log('========================================');
  console.log('  抓取 Qwen 聊天 API');
  console.log('========================================\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  let chatAPI = null;
  
  // 只监听 chat/completion 相关请求
  page.on('response', async response => {
    const url = response.url();
    
    if (url.includes('chat') || url.includes('completion') || url.includes('generate')) {
      console.log('>>> 捕获:', url);
      
      try {
        const headers = response.headers();
        const req = response.request();
        
        // 获取请求体
        let requestBody = null;
        try {
          const postData = req.postData();
          if (postData) {
            requestBody = JSON.parse(postData);
          }
        } catch (e) {}
        
        // 获取响应体
        let responseBody = null;
        try {
          const text = await response.text();
          if (text) {
            responseBody = text.substring(0, 2000);
          }
        } catch (e) {}
        
        chatAPI = {
          url: url,
          method: req.method(),
          requestHeaders: {
            'cookie': req.headerValue('cookie') || '',
            'content-type': req.headerValue('content-type') || '',
            'origin': req.headerValue('origin') || '',
            'referer': req.headerValue('referer') || ''
          },
          requestBody: requestBody,
          responsePreview: responseBody
        };
        
      } catch (e) {
        console.log('   解析错误:', e.message);
      }
    }
  });

  // 访问聊天页面
  console.log('1. 访问 chat.qwen.ai...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 输入并发送消息
  console.log('2. 发送消息...');
  const textarea = page.locator('textarea').first();
  await textarea.fill('hello');
  await page.waitForTimeout(500);
  
  // 尝试找到发送按钮
  const buttons = await page.locator('button').all();
  for (const btn of buttons) {
    try {
      const text = await btn.textContent();
      const aria = await btn.getAttribute('aria-label');
      if ((text && text.trim()) || aria) {
        console.log(`   按钮: "${text || aria}"`);
      }
    } catch (e) {}
  }
  
  // 直接按 Enter 发送
  await textarea.press('Enter');
  console.log('   按下 Enter');
  
  // 等待响应
  await page.waitForTimeout(8000);
  
  // 保存结果
  if (chatAPI) {
    console.log('\n3. 捕获到聊天 API:');
    console.log('   URL:', chatAPI.url);
    console.log('   Method:', chatAPI.method);
    console.log('   请求体:', JSON.stringify(chatAPI.requestBody, null, 2).substring(0, 500));
    
    fs.writeFileSync('/workspace/zai-cli/data/chat-api.json', JSON.stringify(chatAPI, null, 2));
    console.log('\n   已保存到 /workspace/zai-cli/data/chat-api.json');
  } else {
    console.log('\n⚠️ 未捕获到聊天 API');
    
    // 尝试获取所有网络请求
    console.log('\n检查页面结构...');
    const content = await page.content();
    
    // 查找可能 API 调用
    const apiPatterns = content.match(/fetch\(['"`]([^'"`]*chat[^'"`]*)['"`]/gi);
    if (apiPatterns) {
      console.log('找到 API 调用模式:', apiPatterns);
    }
  }
  
  await browser.close();
}

captureChatAPI().catch(console.error);