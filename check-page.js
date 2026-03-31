/**
 * Z.ai 登录 - 检查页面结构
 */

const { chromium } = require('playwright');

async function checkLoginPage() {
  console.log('检查登录页面...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://chat.z.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 获取页面标题
  console.log('页面标题:', await page.title());
  
  // 查找所有按钮
  const buttons = await page.locator('button').all();
  console.log('\n按钮数量:', buttons.length);
  
  for (const btn of buttons) {
    try {
      const text = await btn.textContent();
      const visible = await btn.isVisible();
      if (visible && text) {
        console.log('按钮:', text.trim());
      }
    } catch {}
  }
  
  // 查找输入框
  const inputs = await page.locator('input').all();
  console.log('\n输入框数量:', inputs.length);
  
  for (const input of inputs) {
    try {
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const type = await input.getAttribute('type');
      const visible = await input.isVisible();
      if (visible) {
        console.log('输入框: placeholder=', placeholder, ', name=', name, ', type=', type);
      }
    } catch {}
  }
  
  // 查找可能用于登录的链接/区域
  const links = await page.locator('a').all();
  console.log('\n链接数量:', links.length);
  
  for (const link of links.slice(0, 10)) {
    try {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text && text.trim()) {
        console.log('链接:', text.trim(), ' -> ', href);
      }
    } catch {}
  }
  
  await browser.close();
  console.log('\n检查完成');
}

checkLoginPage().catch(console.error);