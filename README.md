# Qwen API Proxy

将 [chat.qwen.ai](https://chat.qwen.ai) 转换为 OpenAI 兼容 API。

## 配置文件说明

所有配置信息保存在 `data/` 目录下：

| 文件 | 说明 |
|------|------|
| `data/access.json` | 访问信息（外网地址、API Key、模型） |
| `data/config.json` | 服务配置（API Key） |
| `data/credentials.json` | 登录凭证（账号密码 + 飞书通知配置，**不提交到 GitHub**） |
| `data/qwen-state.json` | Qwen Cookie 状态（自动生成） |

**注意：** `data/credentials.json` 和 `data/qwen-state.json` 包含敏感登录信息，已在 `.gitignore` 中排除，请勿手动提交到 GitHub。

### credentials.json 配置示例

```json
{
  "email": "your-email@example.com",
  "password": "your-password",
  "feishu": {
    "app_id": "cli_xxxxxxxxxxxxxxx",
    "app_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

- **飞书通知**：配置 `app_id` 和 `app_secret` 后，服务启动或 URL 变化时会自动推送通知到飞书（首次使用需先运行 `lark-cli auth login` 授权）

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

## 查询端点

| 端点 | 说明 |
|------|------|
| `GET /v1/info` | 获取当前外网访问信息 |
| `GET /health` | 健康检查（返回 tunnel_url） |

## 调用示例

```bash
# 查询当前访问信息
curl https://xxx.trycloudflare.com/v1/info

# 调用聊天 API
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

服务启动后：
- 自动检测并重启外网隧道
- 每 5 分钟自动调用 API 防止 sandbox 休眠
- URL 变化时自动通过飞书发送通知

访问信息保存在 `data/access.json`，每次启动外网地址可能会变化。

## 注意事项

- 登录凭证保存在 `data/qwen-state.json`，失效后需手动重新登录保存 Cookie
- API Key 在 `data/config.json` 中查看或重新生成
- 外网地址在 `data/access.json` 中查看