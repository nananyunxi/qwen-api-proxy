# Qwen API Proxy

将 [chat.qwen.ai](https://chat.qwen.ai) 转换为 OpenAI 兼容 API，支持外部调用。

## 功能特性

- ✅ 自动登录并保存凭证
- ✅ 捕获 Qwen 网页版 API
- ✅ OpenAI 兼容格式输出
- ✅ API Key 认证
- ✅ 外网自动穿透

## 快速开始

### 1. 启动服务

```bash
cd qwen-api-proxy
npm install
node start.js
```

### 2. 获取访问信息

服务启动后会生成外网地址，访问信息保存在 `data/access.json`：

```json
{
  "base_url": "https://xxx.trycloudflare.com/v1",
  "model_id": "qwen3.5-plus",
  "api_key": "qk_xxx",
  "external_url": "https://xxx.trycloudflare.com"
}
```

### 3. 调用 API

```bash
curl -X POST https://xxx.trycloudflare.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qk_xxx" \
  -d '{
    "model": "qwen3.5-plus",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

## API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/v1/chat/completions` | POST | 聊天完成 |
| `/v1/models` | GET | 模型列表 |
| `/health` | GET | 健康检查 |

## 项目结构

```
qwen-api-proxy/
├── server.js      # API 服务器
├── start.js       # 自动启动脚本
├── data/
│   ├── access.json   # 访问信息
│   ├── config.json   # API Key 配置
│   └── qwen-state.json  # 登录凭证
└── package.json
```

## 环境要求

- Node.js 18+
- playwright (已安装)

## 注意事项

- 外网地址每次启动可能会变化
- 登录凭证有效期较长，但仍需关注是否失效
- API Key 可在 `data/config.json` 中查看或重新生成