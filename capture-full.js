/**
 * 完整抓取 Qwen 聊天 API
 */
const { chromium } = require('playwright');
const fs = require('fs');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function captureFullAPI() {
  console.log('========================================');
  console.log('  完整抓取 Qwen 聊天 API');
  console.log('========================================\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  let apiInfo = {
    createChatURL: null,
    completionURL: null,
    headers: null,
    cookies: null
  };

  // 监听特定 API
  page.on('request', req => {
    const url = req.url();
    
    if (url.includes('/api/v2/chats/new')) {
      apiInfo.createChatURL = url;
      apiInfo.headers = {
        'content-type': req.headerValue('content-type'),
        'cookie': req.headerValue('cookie'),
        'origin': req.headerValue('origin'),
        'referer': req.headerValue('referer')
      };
      
      // 尝试获取请求体
      try {
        const postData = req.postData();
        if (postData) {
          apiInfo.createChatBody = JSON.parse(postData);
        }
      } catch (e) {}
    }
  });

  page.on('response', async response => {
    const url = response.url();
    
    // 获取 completion API 响应
    if (url.includes('/api/v2/chat/completions')) {
      apiInfo.completionURL = url;
      
      try {
        const text = await response.text();
        apiInfo.completionResponse = text.substring(0, 3000);
      } catch (e) {}
    }
    
    // 获取创建聊天的响应
    if (url.includes('/api/v2/chats/new')) {
      try {
        const text = await response.text();
        apiInfo.createChatResponse = JSON.parse(text);
      } catch (e) {}
    }
  });

  // 访问页面
  console.log('1. 访问 chat.qwen.ai...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 获取 cookie
  apiInfo.cookies = await context.cookies();
  
  // 发送消息
  console.log('2. 发送消息...');
  const textarea = page.locator('textarea').first();
  await textarea.fill('hello');
  await textarea.press('Enter');
  
  // 等待响应
  await page.waitForTimeout(10000);
  
  // 打印结果
  console.log('\n3. API 信息:');
  console.log('\n创建聊天 API:');
  console.log('   URL:', apiInfo.createChatURL);
  console.log('   请求体:', JSON.stringify(apiInfo.createChatBody, null, 2));
  console.log('   响应:', JSON.stringify(apiInfo.createChatResponse, null, 2));
  
  console.log('\n聊天完成 API:');
  console.log('   URL:', apiInfo.completionURL);
  console.log('   响应预览:', apiInfo.completionResponse?.substring(0, 500));
  
  console.log('\n请求头:');
  console.log('   Content-Type:', apiInfo.headers?.['content-type']);
  console.log('   Cookie 数量:', apiInfo.cookies?.length);
  
  // 保存
  fs.writeFileSync('/workspace/zai-cli/data/full-api.json', JSON.stringify(apiInfo, null, 2));
  console.log('\n已保存到 /workspace/zai-cli/data/full-api.json');
  
  await browser.close();
}

captureFullAPI().catch(console.error);