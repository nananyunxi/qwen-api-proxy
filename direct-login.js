/**
 * 通义千问 - 直接用邮箱密码登录
 */
const { chromium } = require('playwright');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';
const EMAIL = 'hirfzlesmmgxnub@oegmail.com';
const PASSWORD = 'kong#15869772504';

async function directLogin() {
  console.log('========================================');
  console.log('  通义千问 - 邮箱密码登录');
  console.log('========================================\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 访问登录页面
    console.log('1. 访问登录页面...');
    await page.goto('https://chat.qwen.ai/auth?mode=login', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/zai-cli/login-01.png' });

    // 填写邮箱和密码
    console.log('2. 输入账号密码...');
    
    // 邮箱
    await page.fill('input[placeholder*="Email"], input[name="email"], input[type="text"]', EMAIL);
    await page.waitForTimeout(500);
    
    // 密码
    await page.fill('input[placeholder*="Password"], input[name="password"], input[type="password"]', PASSWORD);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/workspace/zai-cli/login-02.png' });
    
    // 点击登录
    console.log('3. 点击登录...');
    const submitBtn = page.locator('button:has-text("Sign in"), button:has-text("Log in")').first();
    await submitBtn.click();
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/workspace/zai-cli/login-03.png' });
    
    const url = page.url();
    console.log('   当前 URL:', url);
    
    // 检查是否成功
    await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/workspace/zai-cli/login-final.png' });
    
    const content = await page.content();
    const isLoggedIn = !content.includes('Log in') && !content.includes('Sign in');
    
    if (isLoggedIn) {
      console.log('\n4. 保存登录状态...');
      await context.storageState({ path: STATE_FILE });
      console.log(`   状态已保存到: ${STATE_FILE}`);
      
      console.log('\n========================================');
      console.log('  ✅ 登录成功！');
      console.log('========================================\n');
    } else {
      console.log('\n⚠️ 登录可能失败，页面内容:');
      console.log(content.substring(0, 1000));
    }
    
  } catch (e) {
    console.error('错误:', e.message);
    await page.screenshot({ path: '/workspace/zai-cli/login-error.png' });
  } finally {
    await browser.close();
  }
}

directLogin().catch(console.error);