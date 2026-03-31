/**
 * 通义千问 Google 登录 - 完整版
 * 登录后保存浏览器状态
 */

const { chromium } = require('playwright');

const DATA_DIR = '/workspace/zai-cli/data';
const STATE_FILE = `${DATA_DIR}/qwen-state.json`;

async function loginAndSave() {
  console.log('========================================');
  console.log('  开始登录通义千问 (Google OAuth)');
  console.log('========================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 访问通义千问登录页面
    console.log('1. 访问通义千问...');
    await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/zai-cli/01-landing.png' });

    // 查找登录按钮并点击
    console.log('2. 查找登录按钮...');
    const loginBtn = page.locator('button:has-text("Log in"), button:has-text("登录"), a:has-text("Log in"), a:has-text("登录")').first();

    if (await loginBtn.isVisible().catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/workspace/zai-cli/02-after-click.png' });
    }

    // 查找 Google 登录选项
    console.log('3. 查找 Google 登录...');
    const googleBtn = page.locator('button:has-text("Google"), [data-testid*="google"], [data-provider="google"]').first();

    if (await googleBtn.isVisible().catch(() => false)) {
      await googleBtn.click();
      await page.waitForTimeout(3000);
    } else {
      // 尝试查找所有按钮
      const buttons = await page.locator('button').all();
      console.log(`   找到 ${buttons.length} 个按钮`);
    }

    await page.screenshot({ path: '/workspace/zai-cli/03-google-page.png' });

    // 检查是否到了 Google 登录页面
    const currentUrl = page.url();
    console.log('   当前 URL:', currentUrl);

    if (currentUrl.includes('accounts.google.com')) {
      console.log('4. 在 Google 登录页面...');

      // 输入邮箱
      const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
      if (await emailInput.isVisible().catch(() => false)) {
        console.log('   输入邮箱...');
        await emailInput.fill('hirfzlesmmgxnub@oegmail.com');
        await page.waitForTimeout(1000);

        // 点击下一步
        const nextBtn = page.locator('button:has-text("Next"), button:has-text("下一步"), button:has-text("继续")').first();
        await nextBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/workspace/zai-cli/04-after-email.png' });
      }

      // 输入密码
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      if (await passwordInput.isVisible().catch(() => false)) {
        console.log('   输入密码...');
        await passwordInput.fill('kong#15869772504');
        await page.waitForTimeout(1000);

        const nextBtn = page.locator('button:has-text("Next"), button:has-text("下一步"), button:has-text("登录")').first();
        await nextBtn.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/workspace/zai-cli/05-after-password.png' });
      }

      // 检查是否有二次验证
      const codeInput = page.locator('input[name="code"], input#code').first();
      if (await codeInput.isVisible().catch(() => false)) {
        console.log('   需要二次验证码，请手动输入...');
        await page.waitForTimeout(60000); // 等待用户输入
      }
    }

    // 等待登录完成
    await page.waitForTimeout(3000);
    console.log('5. 检查登录结果...');
    await page.screenshot({ path: '/workspace/zai-cli/06-final.png' });

    // 保存状态
    console.log('6. 保存登录状态...');
    await context.storageState({ path: STATE_FILE });
    console.log(`   状态已保存到: ${STATE_FILE}`);

    // 验证是否成功
    await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const userAvatar = page.locator('[data-testid="user-avatar"], [class*="avatar"], [class*="Avatar"]').first();
    const isLoggedIn = await userAvatar.isVisible().catch(() => false);

    if (isLoggedIn) {
      console.log('\n========================================');
      console.log('  ✅ 登录成功！');
      console.log('========================================\n');
    } else {
      console.log('\n========================================');
      console.log('  ⚠️ 登录状态未知，请检查截图');
      console.log('========================================\n');
    }

  } catch (e) {
    console.error('错误:', e.message);
    await page.screenshot({ path: '/workspace/zai-cli/error.png' });
  } finally {
    await browser.close();
  }
}

loginAndSave().catch(console.error);