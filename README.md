# Qwen API Proxy

将 [chat.qwen.ai](https://chat.qwen.ai) 转换为 OpenAI 兼容 API，支持外部调用。

## 功能特性

- ✅ 自动登录并保存凭证
- ✅ 捕获 Qwen 网页版 API
- ✅ OpenAI 兼容格式输出
- ✅ API Key 认证
- ✅ 外网自动穿透（Cloudflare Tunnel）
- ✅ 凭证自动验证（每 10 分钟）
- ✅ 支持多模型

## 支持的模型

| 模型 ID | 说明 |
|---------|------|
| `qwen3.5-plus` | Qwen3.5 主力模型 |
| `qwen3.5-flash` | Qwen3.5 快速模型 |
| `qwen3-max-2026-01-23` | Qwen3 最新旗舰 |
| `qwen-plus-2025-07-28` | Qwen3 大杯 |
| `qwen3-coder-plus` | 代码专用模型 |
| `qwen3-vl-plus` | 视觉理解模型 |

## 快速开始

### 1. 启动服务

```bash
cd qwen-api-proxy
npm install
node manager.js
```

### 2. 查看访问信息

服务启动后访问信息保存在 `data/access.json`：

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

### 4. Chatbox 配置

在 Chatbox 中配置：
- **API Domain**: `https://xxx.trycloudflare.com/v1`
- **API Key**: `qk_xxx`
- **Model**: `qwen3.5-plus`

## API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/v1/chat/completions` | POST | 聊天完成 |
| `/v1/models` | GET | 模型列表 |
| `/health` | GET | 健康检查 |

## 项目结构

```
qwen-api-proxy/
├── manager.js      # 自动管理服务（含 API 服务）
├── start.js        # 启动入口
├── data/
│   ├── access.json     # 访问信息
│   ├── config.json    # API Key 配置
│   ├── qwen-state.json # 登录凭证
│   └── service.log    # 服务日志
└── package.json
```

## 自动管理功能

| 功能 | 说明 |
|------|------|
| 凭证验证 | 每 10 分钟自动检查登录状态 |
| 服务监控 | 监控 API 服务运行状态 |
| 穿透重连 | 自动重连 Cloudflare Tunnel |
| 日志记录 | 所有操作记录到 service.log |

## 环境要求

- Node.js 18+
- playwright

## 注意事项

1. **外网地址**：每次重启会生成新的 trycloudflare.com 地址
2. **登录凭证**：有效期较长，失效后需重新登录
3. **API Key**：在 `data/config.json` 中查看
4. **穿透服务**：Quick Tunnel 无 SLA 保证，适合开发测试