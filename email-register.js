/**
 * 通义千问 - 邮箱注册登录
 */
const { chromium } = require('playwright');

const STATE_FILE = '/workspace/zai-cli/data/qwen-state.json';
const EMAIL = 'testuser123@example.com';
const PASSWORD = 'Test@123456';

async function emailLogin() {
  console.log('========================================');
  console.log('  通义千问 - 邮箱注册/登录');
  console.log('========================================\n');

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 访问注册页面
    console.log('1. 访问注册页面...');
    await page.goto('https://chat.qwen.ai/auth?mode=register', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/zai-cli/reg-01.png' });

    // 填写表单
    console.log('2. 填写注册信息...');
    
    // 用户名
    await page.fill('input[placeholder*="Full Name"], input[name="username"]', 'Test User');
    await page.waitForTimeout(500);
    
    // 邮箱
    await page.fill('input[placeholder*="Email"], input[name="email"]', EMAIL);
    await page.waitForTimeout(500);
    
    // 密码
    await page.fill('input[placeholder*="Password"], input[name="password"]', PASSWORD);
    await page.waitForTimeout(500);
    
    // 确认密码
    await page.fill('input[name="checkPassword"]', PASSWORD);
    await page.waitForTimeout(500);
    
    // 勾选同意条款
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/workspace/zai-cli/reg-02.png' });
    
    // 点击创建账号
    console.log('3. 点击创建账号...');
    const submitBtn = page.locator('button:has-text("Create Account"), button:has-text("Sign up")').first();
    await submitBtn.click();
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/workspace/zai-cli/reg-03.png' });
    
    // 检查结果
    const url = page.url();
    const content = await page.content();
    
    console.log('   当前 URL:', url);
    
    // 检查是否需要邮箱验证
    if (content.includes('verification') || content.includes('verify') || content.includes('验证')) {
      console.log('\n4. 需要邮箱验证，请手动点击邮件中的链接...');
      console.log('   邮箱:', EMAIL);
      console.log('   密码:', PASSWORD);
      
      // 等待验证完成
      console.log('\n等待验证完成 (按 Ctrl+C 手动退出)...');
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(5000);
        await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const newContent = await page.content();
        if (!newContent.includes('Log in') && !newContent.includes('verification')) {
          console.log('\n✅ 验证成功！');
          break;
        }
        console.log(`等待中... (${(i+1)*5}秒)`);
      }
    }
    
    // 保存状态
    console.log('\n5. 保存登录状态...');
    await context.storageState({ path: STATE_FILE });
    console.log(`   状态已保存到: ${STATE_FILE}`);
    
    // 验证
    await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/zai-cli/reg-final.png' });
    
    const finalContent = await page.content();
    if (!finalContent.includes('Log in')) {
      console.log('\n========================================');
      console.log('  ✅ 登录成功！');
      console.log('========================================\n');
    }
    
  } catch (e) {
    console.error('错误:', e.message);
    await page.screenshot({ path: '/workspace/zai-cli/reg-error.png' });
  } finally {
    await browser.close();
  }
}

emailLogin().catch(console.error);