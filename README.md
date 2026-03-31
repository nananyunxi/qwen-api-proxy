# Qwen API Proxy

将 [chat.qwen.ai](https://chat.qwen.ai) 转换为 OpenAI 兼容 API。

## API 调用信息

| 参数 | 值 |
|------|-----|
| **Base URL** | `https://acknowledged-characteristics-planets-rates.trycloudflare.com/v1` |
| **API Key** | `qk_c2f0e1a9e3fa538d593a9be63e42bf4802927067dd87c15c` |
| **Model** | `qwen3.5-plus` |

## 支持的模型

| 模型 ID | 说明 |
|---------|------|
| `qwen3.5-plus` | Qwen3.5 主力模型 |
| `qwen3.5-flash` | Qwen3.5 快速模型 |
| `qwen3-max-2026-01-23` | Qwen3 最新旗舰 |
| `qwen-plus-2025-07-28` | Qwen3 大杯 |
| `qwen3-coder-plus` | 代码专用模型 |
| `qwen3-vl-plus` | 视觉理解模型 |

## 调用示例

```bash
curl -X POST https://acknowledged-characteristics-planets-rates.trycloudflare.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qk_c2f0e1a9e3fa538d593a9be63e42bf4802927067dd87c15c" \
  -d '{"model": "qwen3.5-plus", "messages": [{"role": "user", "content": "你好"}]}'
```

## 自动管理功能

- 凭证每 10 分钟自动验证
- 服务状态自动监控
- 外网穿透自动重连

## 项目结构

```
qwen-api-proxy/
├── manager.js      # 自动管理服务
├── start.js       # 启动入口
└── data/          # 配置目录
```

## 启动服务

```bash
cd qwen-api-proxy
node manager.js
```

## 注意事项

- 外网地址每次启动会变化（查看 data/access.json）
- 登录凭证有效期较长，失效后需重新登录
- API Key 在 data/config.json 中查看