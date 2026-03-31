# Qwen API Proxy

将 [chat.qwen.ai](https://chat.qwen.ai) 转换为 OpenAI 兼容 API。

## API 调用信息

访问信息保存在 `data/access.json` 文件中：

```json
{
  "base_url": "https://xxx.trycloudflare.com/v1",
  "model_id": "qwen3.5-plus",
  "api_key": "qk_xxx",
  "external_url": "https://xxx.trycloudflare.com"
}
```

## 调用示例

```bash
curl -X POST {base_url}/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {api_key}" \
  -d '{"model": "qwen3.5-plus", "messages": [{"role": "user", "content": "你好"}]}'
```

## 支持的模型

| 模型 ID | 说明 |
|---------|------|
| `qwen3.5-plus` | Qwen3.5 主力模型 |
| `qwen3.5-flash` | Qwen3.5 快速模型 |
| `qwen3-max-2026-01-23` | Qwen3 最新旗舰 |
| `qwen-plus-2025-07-28` | Qwen3 大杯 |
| `qwen3-coder-plus` | 代码专用模型 |
| `qwen3-vl-plus` | 视觉理解模型 |

## 启动服务

```bash
cd qwen-api-proxy
node manager.js
```

服务启动后访问信息保存在 `data/access.json`，每次启动外网地址可能会变化。

## 注意事项

- 登录凭证有效期较长，失效后需重新运行 `node direct-login.js` 登录
- API Key 在 `data/config.json` 中查看或重新生成
- 外网地址在 `data/access.json` 中查看