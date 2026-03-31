/**
 * 测试直接调用 Qwen API
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
  console.log('Cookie 长度:', cookie.length);
  
  // 1. 创建聊天
  console.log('\n1. 创建聊天...');
  const postData1 = JSON.stringify({
    title: 'Test',
    models: ['qwen3.5-plus'],
    chat_mode: 'normal',
    chat_type: 't2t',
    timestamp: Date.now(),
    project_id: ''
  });
  
  const chatId = await new Promise((resolve, reject) => {
    const req = https.request('https://chat.qwen.ai/api/v2/chats/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'Origin': 'https://chat.qwen.ai',
        'Referer': 'https://chat.qwen.ai/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log('创建响应:', data.substring(0, 500));
        try {
          const json = JSON.parse(data);
          resolve(json.data?.id);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData1);
    req.end();
  });
  
  console.log('Chat ID:', chatId);
  
  // 2. 发送消息
  console.log('\n2. 发送消息...');
  const postData2 = JSON.stringify({
    chat_id: chatId,
    parent_id: '',
    prompt: 'hello',
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
  
  console.log('响应长度:', response.length);
  console.log('响应预览:', response.substring(0, 1000));
}

testAPI().catch(console.error);