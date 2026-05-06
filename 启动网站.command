#!/bin/bash

# ============================================================
# 织文 (WangWen) 一键启动脚本
# 双击此文件即可启动开发服务器并自动打开浏览器预览
# ============================================================

echo ""
echo "=========================================="
echo "  🚀 织文 (WangWen) 开发服务器启动中..."
echo "=========================================="
echo ""

# 切换到项目目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "📂 项目目录: $SCRIPT_DIR"
echo ""

# 检查 pnpm 是否可用
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: 未找到 pnpm，请先安装: npm install -g pnpm"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    pnpm install
    echo ""
fi

echo "🔧 正在启动 Vite 开发服务器..."
echo "   请稍候，首次启动可能需要几秒钟..."
echo ""

# 启动 dev server（后台运行，捕获 URL）
(
    # 等待服务器启动后自动打开浏览器
    sleep 5
    echo ""
    echo "=========================================="
    echo "  ✅ 服务已启动！"
    echo "  🌐 预览地址: http://localhost:5173/"
    echo "=========================================="
    echo ""
    echo "  快捷键:"
    echo "    Ctrl + C  →  停止服务器"
    echo "    Cmd + W   →  关闭终端窗口"
    echo ""
    echo "=========================================="
    echo ""
    
    # 自动打开浏览器（macOS）
    if command -v open &> /dev/null; then
        sleep 1
        open "http://localhost:5173/"
    fi
) &

# 前台运行 dev server
pnpm dev --host

echo ""
echo "=========================================="
echo "  🛑 服务器已停止"
echo "=========================================="
echo ""

# 等待用户按键后关闭窗口（如果是双击打开的终端）
if [ -t 0 ]; then
    read -p "按回车键关闭窗口..."
fi
