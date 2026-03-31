/**
 * 直接访问通义千问登录页面，看看有什么登录选项
 */
const { chromium } = require('playwright');

async function checkLoginOptions() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 访问通义千问
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 截图
  await page.screenshot({ path: '/workspace/zai-cli/qwen-home.png' });
  
  // 查找登录按钮
  console.log('查找登录入口...');
  const loginLinks = await page.locator('a, button').all();
  
  for (const link of loginLinks) {
    try {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      const onclick = await link.getAttribute('onclick');
      if (text && (text.includes('登录') || text.includes('Login') || text.includes('Sign'))) {
        console.log(`按钮/链接: "${text.trim()}"`);
        console.log(`  href: ${href}`);
        console.log(`  onclick: ${onclick}`);
        console.log('---');
      }
    } catch (e) {}
  }
  
  // 获取整个页面文本
  const content = await page.content();
  
  // 查找 OAuth 相关内容
  console.log('\n查找 OAuth 相关内容:');
  const oauthMatches = content.match(/oauth|OAuth|authorize|授权|code=/gi);
  if (oauthMatches) {
    console.log('找到:', [...new Set(oauthMatches)]);
  }
  
  // 查看网络请求
  console.log('\n点击登录按钮...');
  const loginBtn = page.locator('button:has-text("Log in"), a:has-text("Log in")').first();
  if (await loginBtn.isVisible().catch(() => false)) {
    await loginBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/workspace/zai-cli/qwen-login-modal.png' });
    
    // 获取弹窗内容
    const modalContent = await page.content();
    console.log('弹窗内容:');
    console.log(modalContent.substring(0, 5000));
  }
  
  await browser.close();
}

checkLoginOptions().catch(console.error);