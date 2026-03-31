/**
 * 通义千问 Google 登录 - 继续
 */

const { chromium } = require('playwright');

async function continueLogin() {
  console.log('继续 Google 登录...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 直接访问 Google 登录页
  await page.goto('https://accounts.google.com/v3/signin/identifier?opparams=%253F&dsh=S-1459477217%3A1774982044364922&client_id=452911428355-3lrs59r3icntb0d0e053n98fkg9ha1j3.apps.googleusercontent.com&nonce=LeJkbwtgcvGONlYBgRkP&o2v=2&redirect_uri=https%3A%2F%2Fchat.qwen.ai%2Foauth%2Fgoogle%2Fcallback&response_type=code&scope=openid+email+profile&service=lso&state=xQINVIR1chJsga87kHM4sfz59AkLxI&flowName=GeneralOAuthLite&continue=https%3A%2F%2Faccounts.google.com%2Fsignin%2Foauth%2Flegacy%2Fconsent%3Fauthuser%3Dunknown%26part%3DAJi8hANJNnhwyeY0-Nb-EEpzXwRUvEJMU--ycbO6yNb2Z5tsE7bl7k0JKnMqN_jY621duL0sXezTh4LoQb5qdilrx5Fcleu58IEWMY99nVYbXNkF_yfOtsYD5Ju40IZPksoT_XggE6kR2px93WMLtjR8T-b_eHZe30ycUG7dktPn1Fl_avYWb9tmkI3mkHPs783jbcg3j5jPkTS4p6XsVsAnoOBszh5LeeHbJ7akMjDnJLqcyvYlkNQ6iwoGjSH8QEdPZIln_jhxvSAx-kJ-_7rEavFxRcSrkMNJdtAEGY2XaPiBxaGUcDsvJlOzMM0Uk4_P1COzN8PHs4WD2L8j3SMbaQISZrx6cDLlilwg3nUvO6D3UCXePlnM5hNaHc1a-_Bei866clrNttKPkK68BR9c4a9ZXLW7KwM1A5rJfNVTH_WzV29w8zFOI-2apEwVHC46U4hknb5-fT7ui8itBL3CIEEoMueEsw%26flowName%3DGeneralOAuthFlow%26as%3DS-1459477217%253A1774982044364922%26client_id%3D452911428355-3lrs59r3icntb0d0e053n98fkg9ha1j3.apps.googleusercontent.com%23&app_domain=https%3A%2F%2Fchat.qwen.ai&rart=ANgoxcfDCWo8J529LKUhKCC4sNMrGpWeKOrXam3EcL6eBhcZzBkZc8H0f5aygx0Ug3wmA425yWMq15sHlnUMwguYFGfFQzxPrv5JQaDlu-ISa-J2fsCB63c', { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/workspace/zai-cli/google-continue.png' });
  
  // 点击"继续"按钮
  console.log('点击继续...');
  const continueBtn = page.locator('button:has-text("继续"), button:has-text("Continue")').first();
  if (await continueBtn.isVisible().catch(() => false)) {
    await continueBtn.click();
    await page.waitForTimeout(5000);
  }
  
  // 检查是否需要密码
  await page.screenshot({ path: '/workspace/zai-cli/google-after-continue.png' });
  
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.isVisible().catch(() => false)) {
    console.log('需要输入密码...');
    await passwordInput.fill('kong#15869772504');
    await page.waitForTimeout(1000);
    
    const loginBtn = page.locator('button:has-text("Next"), button:has-text("下一步"), button:has-text("登录")').first();
    await loginBtn.click();
    await page.waitForTimeout(5000);
  }
  
  // 回到 Qwen
  console.log('检查是否登录成功...');
  await page.goto('https://chat.qwen.ai/', { timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/workspace/zai-cli/qwen-success.png' });
  
  console.log('登录流程完成');
  
  await browser.close();
}

continueLogin().catch(console.error);