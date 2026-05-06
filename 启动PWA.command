#!/bin/bash

# ============================================================
# 织文 (WangWen) PWA 本地启动脚本
# 双击运行 → 构建项目 → 启动静态服务器 → 打开浏览器
# 浏览器中会出现"安装到桌面"按钮，点击即可安装为本地 App
# ============================================================

echo ""
echo "=========================================="
echo "  🚀 织文 PWA 本地启动中..."
echo "=========================================="
echo ""

# 切换到项目目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "📂 项目目录: $SCRIPT_DIR"
echo ""

# 检查 pnpm 是否可用
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: 未找到 pnpm"
    echo "   请先安装: npm install -g pnpm"
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

# 检查是否需要重新构建
echo "🔧 检查构建状态..."
NEED_BUILD=0

if [ ! -d "dist" ]; then
    echo "   dist 目录不存在，需要构建"
    NEED_BUILD=1
elif [ -n "$(find src public -newer dist -type f 2>/dev/null | head -1)" ]; then
    echo "   检测到代码有更新，需要重新构建"
    NEED_BUILD=1
else
    echo "   dist 已是最新，跳过构建"
fi

if [ "$NEED_BUILD" -eq 1 ]; then
    echo ""
    echo "🔨 正在构建生产版本..."
    echo "   请稍候，首次构建可能需要 30-60 秒..."
    echo ""
    pnpm build
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 构建失败，请检查代码错误"
        echo ""
        read -p "按回车键退出..."
        exit 1
    fi
    echo ""
    echo "✅ 构建完成"
fi

echo ""
echo "🌐 正在启动静态服务器..."
echo ""

# 检查 npx serve 是否可用
if command -v npx &> /dev/null && npx serve --version &> /dev/null 2>&1; then
    SERVE_CMD="npx serve dist -l 5173 --no-clipboard"
else
    # 备用：使用 Python 内置 HTTP 服务器
    echo "   使用 Python HTTP 服务器（备用方案）"
    SERVE_CMD="python3 -m http.server 5173 --directory dist"
fi

echo ""
echo "=========================================="
echo "  ✅ PWA 服务已启动！"
echo "  🌐 地址: http://localhost:5173"
echo "=========================================="
echo ""
echo "  📲 如何安装到桌面："
echo ""
echo "    Chrome / Edge："
echo "      地址栏右侧会显示 ➕ 图标，点击"安装 织文""
echo ""
echo "    Safari (Mac)："
echo "      菜单栏 → 文件 → 添加到程序坞"
echo ""
echo "    安装后："
echo "      桌面/程序坞会出现「织文」图标，双击即可打开"
echo "      可以离线使用，数据保存在本地"
echo ""
echo "  快捷键:"
echo "    Ctrl + C  →  停止服务器"
echo ""
echo "=========================================="
echo ""

# 延迟打开浏览器，等待服务器启动
(
    sleep 2
    if command -v open &> /dev/null; then
        open "http://localhost:5173"
    fi
) &

# 前台运行服务器
$SERVE_CMD

echo ""
echo "=========================================="
echo "  🛑 服务器已停止"
echo "=========================================="
echo ""

if [ -t 0 ]; then
    read -p "按回车键关闭窗口..."
fi
