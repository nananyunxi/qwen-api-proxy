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
  "model_id": "qwen3.6-plus",
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

假设外网地址为 `https://xxx.trycloudflare.com`，API Key 为 `qk_xxx`：

```bash
# 查询当前访问信息
curl https://xxx.trycloudflare.com/v1/info

# 获取模型列表
curl https://xxx.trycloudflare.com/v1/models \
  -H "Authorization: Bearer qk_xxx"

# 调用聊天 API
curl -X POST https://xxx.trycloudflare.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qk_xxx" \
  -d '{"model": "qwen3.6-plus", "messages": [{"role": "user", "content": "你好"}]}'
```

## 支持的模型

模型列表从 Qwen API 动态获取，可通过以下命令查看当前可用模型：

```bash
curl https://xxx.trycloudflare.com/v1/models
```

常见模型包括：
- `qwen3.6-plus` - Qwen3.6 旗舰版（默认）
- `qwen3.5-plus` - Qwen3.5 主力模型
- `qwen3.5-omni-plus` - 多模态模型（支持音频）
- `qwen3.5-flash` - Qwen3.5 快速模型

## 启动服务

```bash
cd qwen-api-proxy
node manager.js
```

服务默认监听 **端口 3001**，启动后自动创建外网隧道。

### 本地访问

本地访问支持 `localhost` 和 `127.0.0.1`：

```bash
curl http://localhost:3001/v1/info
curl http://127.0.0.1:3001/v1/info
```

服务启动后会自动输出外网地址，也可以通过以下方式查看：

```bash
# 方式1：查看控制台输出的 "外网地址"
# 方式2：查看文件
cat data/access.json

# 方式3：API 查询
curl http://localhost:3001/v1/info
```

### 调用示例

假设外网地址为 `https://xxx.trycloudflare.com`，API Key 为 `qk_xxx`：

```bash
# 获取模型列表
curl https://xxx.trycloudflare.com/v1/models \
  -H "Authorization: Bearer qk_xxx"

# 调用聊天 API
curl -X POST https://xxx.trycloudflare.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer qk_xxx" \
  -d '{"model": "qwen3.6-plus", "messages": [{"role": "user", "content": "你好"}]}'
```

服务启动后：
- 自动检测并重启外网隧道
- URL 变化时自动通过飞书发送通知

访问信息保存在 `data/access.json`，每次启动外网地址可能会变化。

## 注意事项

- 登录凭证保存在 `data/qwen-state.json`，失效后需手动重新登录保存 Cookie
- API Key 在 `data/config.json` 中查看或重新生成
- 外网地址在 `data/access.json` 中查看