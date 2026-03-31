/**
 * 测试 API - 模拟浏览器请求
 */
const fs = require('fs');
const https = require('https');

const COOKIE_FILE = '/workspace/zai-cli/data/qwen-state.json';

function getCookie() {
  const data = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
  return data.cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

async function testAPI() {
  const cookie = getCookie();
  console.log('Cookie 片段:', cookie.substring(0, 100));
  
  // 1. 先获取可用模型
  console.log('\n1. 获取可用模型...');
  const modelsRes = await new Promise((resolve, reject) => {
    const req = https.request('https://chat.qwen.ai/api/models', {
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'Origin': 'https://chat.qwen.ai',
        'Referer': 'https://chat.qwen.ai/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
  
  const models = JSON.parse(modelsRes);
  const firstModel = models.data[0].id;
  console.log('使用模型:', firstModel);
  
  // 2. 创建聊天时指定模型
  console.log('\n2. 创建聊天...');
  const postData1 = JSON.stringify({
    title: 'Test',
    models: [firstModel],  // 使用从 API 获取的模型
    chat_mode: 'normal',
    chat_type: 't2t',
    timestamp: Date.now(),
    project_id: ''
  });
  
  const createRes = await new Promise((resolve, reject) => {
    const req = https.request('https://chat.qwen.ai/api/v2/chats/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'Origin': 'https://chat.qwen.ai',
        'Referer': 'https://chat.qwen.ai/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData1);
    req.end();
  });
  
  console.log('创建响应:', createRes);
  const chatData = JSON.parse(createRes);
  const chatId = chatData.data.id;
  console.log('Chat ID:', chatId);
  
  // 3. 发送消息
  console.log('\n3. 发送消息...');
  const postData2 = JSON.stringify({
    chat_id: chatId,
    parent_id: '',
    prompt: 'hello',
    model: firstModel,  // 添加 model 参数
    urls: [],
    search_level: {},
    search_url: '',
    file_ids: [],
    stream: false,
    extra: { display: 'percentage', language: '' }
  });
  
  const response = await new Promise((resolve, reject) => {
    const req = https.request(`https://chat.qwen.ai/api/v2/chat/completions?chat_id=${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'Origin': 'https://chat.qwen.ai',
        'Referer': `https://chat.qwen.ai/c/${chatId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData2);
    req.end();
  });
  
  console.log('响应:', response.substring(0, 2000));
}

testAPI().catch(console.error);