# 🚀 织文 (WangWen) — 部署指南

> 由根模板 `部署指南-模板.md` 生成。本项目为**纯前端应用**，无需后端服务器和数据库。
>
> **项目特点**：Vite + React + PWA，数据存储在浏览器 IndexedDB，AI 调用 DeepSeek API（API Key 由用户在浏览器中输入）。

---

## 项目信息

| 项目 | 值 |
|------|-----|
| **GitHub 仓库名** | `wangwen` |
| **主域名** | `mdxxfwh.club` |
| **子域名** | `wangwen.mdxxfwh.club` |
| **完整访问地址** | `https://wangwen.mdxxfwh.club` |
| **项目类型** | 纯前端（Vite + React + PWA） |
| **数据库** | 无（浏览器 IndexedDB） |
| **构建输出目录** | `dist` |

---

## Step 0：域名规则说明

> **习惯约定**：子域名 = GitHub 仓库名
>
> 本项目：仓库名 `wangwen` → 子域名 `wangwen.mdxxfwh.club`

**域名不需要预先在腾讯云做任何操作。** 正确的顺序是：
1. 先在 Vercel 里创建项目并设置 Custom Domain
2. Vercel 会给你一个 CNAME 值
3. **然后再去腾讯云** DNS 解析里添加一条 CNAME 记录
4. 等 5-30 分钟生效

---

## Step 1：创建独立的 GitHub 仓库

> ⚠️ **重要**：本项目代码目前位于 `second_brain` 知识库的子目录中。**不能直接用 second_brain 仓库部署**，因为里面包含了大量与项目无关的文件。
>
> 需要单独创建一个干净的 GitHub 仓库。

### 1.1 在 GitHub 上新建仓库

1. 浏览器打开 `https://github.com`
2. 点击右上角 **"+"** → **"New repository"**
3. 填写：
   - **Repository name**：`wangwen`
   - **Description**：`织文 — AI 网文创作辅助工具`
   - **Visibility**：`Public`（免费版必须用 Public）
   - **Initialize**：**不要勾选** "Add a README"（保持空白）
4. 点击 **Create repository**

### 1.2 把代码推送到新仓库

在终端执行：

```bash
# 1. 进入项目目录
cd "/Users/wuyiqing02/Desktop/wyq_openclaw_hermes/【第二大脑】/second_brain/【98】自有项目库/【96】小说网文作者Web"

# 2. 初始化 Git（如果还没初始化）
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "feat: 织文项目首次提交"

# 5. 绑定远程仓库（把下面 wangwen 换成你的 GitHub 用户名）
git remote add origin https://github.com/你的用户名/wangwen.git

# 6. 推送代码
git push -u origin main
```

> 如果 `git push` 报错 "failed to push some refs"，先执行 `git pull origin main --allow-unrelated-histories` 再 push。

---

## Step 2：Vercel 部署（按钮级教程）

> **为什么选择 Vercel？**
> - 对 Vite 项目**零配置**支持，自动识别构建命令和输出目录
> - 全球 CDN 加速，国内访问比 Render 更快
> - 每次 push 代码自动重新部署
> - 完全免费

### 2.1 注册/登录 Vercel

1. 浏览器打开 `https://vercel.com`
2. 点击 **"Get Started for Free"**
3. 选择 **"Continue with GitHub"**，授权 Vercel 访问你的 GitHub 仓库

### 2.2 导入项目

1. Vercel 控制台页面，点击 **"Add New..."** → **"Project"**
2. 页面列出你的 GitHub 仓库，找到 `wangwen`，点击右侧 **"Import"**
3. 如果找不到，点击 **"Adjust GitHub App Permissions"** 授权访问

### 2.3 确认构建配置

Vercel 会自动识别 Vite 项目，大部分配置已经填好：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Framework Preset** | `Vite` | 自动识别 |
| **Root Directory** | `./` | 项目根目录（保持默认） |
| **Build Command** | `vite build` | 自动识别 |
| **Output Directory** | `dist` | 自动识别 |

> 如果 Framework Preset 没有自动识别为 Vite，手动在下拉框里选择 **Vite**。

### 2.4 添加环境变量（可选）

织文项目的大部分配置已经写在代码中，**不需要环境变量也能运行**。但如果你想自定义一些参数，可以添加：

页面往下滚动到 **Environment Variables** 区域，点击 **"Add"**：

| Key | Value | 说明 |
|-----|-------|------|
| `VITE_AI_BASE_URL` | `https://api.deepseek.com/v1` | AI API 地址（默认就是这个，可不填） |
| `VITE_AI_MODEL` | `deepseek-v4-pro` | AI 模型（默认就是这个，可不填） |
| `VITE_ENABLE_MOCK_MODE` | `true` | 无 API Key 时进入演示模式 |

> **注意**：`VITE_AI_API_KEY` **不要写在这里**！API Key 由用户自己在浏览器里输入，存储在 localStorage 中。这是安全最佳实践。

### 2.5 部署

1. 点击蓝色按钮 **"Deploy"**
2. 等待 1-3 分钟
3. 出现 `Congratulations!` 即成功
4. Vercel 会给一个临时 URL，如 `https://wangwen-xxx.vercel.app`

---

## Step 3：绑定自定义域名

### 3.1 在 Vercel 里添加域名

1. Vercel 控制台 → 点击你的项目 `wangwen`
2. 顶部标签点击 **"Settings"**
3. 左侧菜单点击 **"Domains"**
4. 输入框填：`wangwen.mdxxfwh.club`
5. 点击 **"Add"**
6. Vercel 会显示一个 CNAME 值（类似 `cname.vercel-dns.com`），**复制这个值**

### 3.2 在腾讯云添加 DNS 解析

1. 打开腾讯云控制台：`https://console.cloud.tencent.com`
2. 找到 **云产品 → DNS 解析 DNSPod**
3. 找到 `mdxxfwh.club`，点击 **解析**
4. 点击 **"添加记录"**
5. 填写：
   - **主机记录**：填 `wangwen`（不要带点，不要填完整域名）
   - **记录类型**：选 **CNAME**
   - **记录值**：粘贴 Vercel 给的 CNAME 地址（如 `cname.vercel-dns.com`）
   - **TTL**：默认 600 秒，不用改
6. 点击 **保存**

### 3.3 等待生效

1. DNS 解析通常 5-30 分钟生效
2. 浏览器访问 `https://wangwen.mdxxfwh.club`
3. 如果能看到织文应用的首页，全部完成！

---

## Step 4：配置 AI API Key（首次使用）

织文需要调用 DeepSeek AI API 才能使用完整功能。首次打开应用时：

1. 点击右下角的 **设置**（齿轮图标）
2. 找到 **AI 配置**
3. 输入你的 DeepSeek API Key
4. 点击 **保存**

> **如何获取 DeepSeek API Key？**
> 1. 打开 `https://platform.deepseek.com`
> 2. 注册/登录账号
> 3. 点击左侧 **API Keys** → **创建 API Key**
> 4. 复制生成的 Key（只显示一次，请妥善保存）

如果没有 API Key，应用会进入**演示模式**，可以体验所有界面功能，但 AI 响应是模拟的。

---

## Step 5：重新部署（代码更新后）

每次代码修改后，Vercel 会自动重新部署：

1. 本地修改代码，commit 并 push 到 GitHub
2. Vercel 会自动检测并重新构建（通常 1-2 分钟）
3. 刷新浏览器即可看到更新

如果需要手动触发重新部署：
- Vercel 控制台 → 项目 → **Deployments** 标签 → 点击 **"Redeploy"**

---

## 费用说明

| 项目 | 费用 |
|------|------|
| Vercel（Hobby 免费版） | $0 |
| GitHub（Public 仓库） | $0 |
| DeepSeek API | 按用量计费（新用户有免费额度） |
| 域名（已拥有） | $0 |
| **总计** | **完全免费** |

> DeepSeek API 费用参考：输入约 0.5-2 元 / 百万 tokens，输出约 2-8 元 / 百万 tokens。正常使用一个月通常不到 10 元。

---

## 安全提醒

1. **API Key 不要写在代码里** — 已通过 localStorage 机制实现用户自行输入
2. **IndexedDB 数据只存在本地浏览器** — 换设备/清缓存会丢失，重要数据请定期导出备份
3. **PWA 离线可用** — 安装到桌面后，即使没有网络也能查看已有数据
4. **`.env` 文件** — 如果本地有 `.env`，确保已加到 `.gitignore`，防止密钥泄露

---

## 常见错误排查

### 错误 1：Vercel 构建失败，显示 "Command "vite build" exited with 1"

**原因**：TypeScript 类型检查失败或 ESLint 报错

**解决**：
```bash
# 本地先检查
pnpm tsc --noEmit
pnpm lint

# 修复报错后重新 push
```

### 错误 2：域名访问显示 "404: NOT_FOUND"

**原因**：DNS 还没生效，或 CNAME 填错了

**解决**：等 30 分钟；检查腾讯云 DNS 解析里的记录值和 Vercel 给的是否一致

### 错误 3：页面白屏，控制台报错

**原因**：可能是 CSP（内容安全策略）阻止了某些资源加载

**解决**：检查 `index.html` 里的 CSP 配置，确保 `connect-src` 包含了 DeepSeek API 地址 `https://api.deepseek.com`

### 错误 4：AI 功能无法使用，提示 "API Key 未配置"

**原因**：用户没有在设置面板中输入 DeepSeek API Key

**解决**：在应用内设置 → AI 配置 → 输入 API Key

---

## 备选方案：Cloudflare Pages

如果 Vercel 访问不稳定，可以换用 **Cloudflare Pages**：

1. 打开 `https://dash.cloudflare.com` → **Pages**
2. 点击 **"Create a project"** → **"Connect to Git"**
3. 选择 `wangwen` 仓库
4. **Framework preset**：`Vite`
5. **Build command**：`npm run build`
6. **Build output directory**：`dist`
7. 点击 **"Save and Deploy"**
8. 绑定自定义域名的流程和 Vercel 类似

Cloudflare Pages 国内访问速度通常比 Vercel 更好。
