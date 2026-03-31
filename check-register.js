/**
 * 查看注册页面有什么选项
 */
const { chromium } = require('playwright');

async function checkRegisterPage() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 访问注册页面
  await page.goto('https://chat.qwen.ai/auth?mode=register', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 截图
  await page.screenshot({ path: '/workspace/zai-cli/register-page.png' });
  
  // 获取可见文本
  const text = await page.evaluate(() => document.body.innerText);
  console.log('注册页面内容:');
  console.log(text);
  
  // 查看表单
  const forms = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
      name: input.name,
      type: input.type,
      placeholder: input.placeholder,
      id: input.id
    }));
    return inputs;
  });
  
  console.log('\n表单字段:');
  console.log(forms);
  
  await browser.close();
}

checkRegisterPage().catch(console.error);