/**
 * 抓取 chat.qwen.ai 网页版 API
 */
const { chromium } = require('playwright');
const fs = require('fs');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function captureAPI() {
  console.log('========================================');
  console.log('  抓取 Qwen 网页 API');
  console.log('========================================\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    storageState: STATE_FILE
  });
  
  const page = await context.newPage();
  
  // 收集所有 API 请求
  const apiCalls = [];
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    
    if ((url.includes('api') || url.includes('chat') || url.includes('completion')) && status === 200) {
      try {
        const headers = response.headers();
        const req = response.request();
        
        apiCalls.push({
          url: url,
          method: req.method(),
          headers: {
            'cookie': req.headerValue('cookie') || '',
            'authorization': req.headerValue('authorization') || '',
            'content-type': req.headerValue('content-type') || ''
          }
        });
      } catch (e) {}
    }
  });

  // 访问聊天页面
  console.log('1. 访问 chat.qwen.ai...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('   当前 URL:', page.url());
  
  // 查找输入框并发送消息
  console.log('2. 发送测试消息...');
  
  // 尝试找到输入框
  const textareas = await page.locator('textarea').all();
  console.log(`   找到 ${textareas.length} 个 textarea`);
  
  if (textareas.length > 0) {
    await textareas[0].fill('你好，请回复测试');
    await page.waitForTimeout(1000);
    
    // 找发送按钮
    const sendBtns = await page.locator('button').all();
    console.log(`   找到 ${sendBtns.length} 个按钮`);
    
    // 点击发送
    for (const btn of sendBtns) {
      try {
        const text = await btn.textContent();
        if (text && (text.includes('Send') || text.includes('发送') || text.includes('→'))) {
          await btn.click();
          console.log('   点击发送按钮');
          break;
        }
      } catch (e) {}
    }
    
    await page.waitForTimeout(5000);
  }
  
  // 打印捕获的 API
  console.log('\n3. 捕获的 API 请求:');
  apiCalls.forEach((call, i) => {
    console.log(`\n--- ${i+1}. ${call.method} ${call.url.substring(0, 100)}...`);
  });
  
  // 获取当前 cookie
  console.log('\n4. 当前 Cookie:');
  const cookies = await context.cookies();
  console.log(`   共 ${cookies.length} 个 cookie`);
  
  // 保存 cookie 到文件
  const authData = {
    cookies: cookies,
    apiCalls: apiCalls,
    timestamp: Date.now()
  };
  fs.writeFileSync('/workspace/zai-cli/data/api-calls.json', JSON.stringify(authData, null, 2));
  console.log('\n   已保存到 /workspace/zai-cli/data/api-calls.json');
  
  await browser.close();
}

captureAPI().catch(console.error);