#!/bin/bash
# Z.ai 登录认证脚本

echo "=== Z.ai 浏览器登录认证 ==="
echo ""
echo "步骤："
echo "1. 启动 Chrome 调试模式"
echo "2. 打开 https://chat.z.ai/"
echo "3. 你扫码登录"
echo "4. 我捕获凭证"
echo ""

cd /workspace/zai-cli

# 启动 Chrome 调试模式
npx playwright open --browser chromium "https://chat.z.ai/" &
sleep 3

echo "Chrome 已启动，请在浏览器中登录 Z.ai"
echo "登录完成后按回车继续..."
read

echo "正在捕获登录凭证..."

# 捕获网络请求中的凭证
# 这里需要用 Playwright 监听请求