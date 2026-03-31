/**
 * 交互式登录 - 让你手动完成 Google 验证
 * 登录完成后会自动保存状态
 */

const { chromium } = require('playwright');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';

async function interactiveLogin() {
  console.log('========================================');
  console.log('  启动交互式浏览器');
  console.log('  请手动完成 Google 登录');
  console.log('  登录成功后脚本会自动保存状态');
  console.log('========================================\n');

  const browser = await chromium.launch({
    headless: false,  // 可见模式
    args: ['--no-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // 访问通义千问
  await page.goto('https://chat.qwen.ai/');
  console.log('请在浏览器中完成登录...');

  // 轮询检查是否登录成功
  let loggedIn = false;
  let checkCount = 0;
  const maxChecks = 120; // 最多等 10 分钟

  while (!loggedIn && checkCount < maxChecks) {
    await page.waitForTimeout(5000);
    checkCount++;
    
    try {
      const content = await page.content();
      const url = page.url();
      
      // 登录成功后 URL 会变成 chat.qwen.ai 且页面没有登录按钮
      if (url.includes('chat.qwen.ai') && !content.includes('Log in') && !content.includes('登录')) {
        loggedIn = true;
        console.log('\n检测到登录成功！');
        break;
      }
      
      if (checkCount % 12 === 0) {
        console.log(`等待登录中... (${checkCount * 5}秒)`);
      }
    } catch (e) {
      // 忽略错误
    }
  }

  if (loggedIn) {
    // 保存状态
    await context.storageState({ path: STATE_FILE });
    console.log(`\n✅ 状态已保存到: ${STATE_FILE}`);
  } else {
    console.log('\n⚠️ 登录超时，请重试');
  }

  await browser.close();
}

interactiveLogin().catch(console.error);