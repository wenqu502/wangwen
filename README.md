# 织文 (WangWen) — 网文作者 AI 辅助创作工具

> **版本**: v0.0.1
> **状态**: MVP 开发中
> **最后更新**: 2026-05-04

---

## 📖 项目简介

**织文 (WangWen)** 是一款面向网文作者的 AI 辅助创作工具。它将大语言模型能力与可视化画布结合，帮助作者：

- 🧑‍🤝‍🧑 **角色管理** — AI 生成角色设定、维护角色小像、追踪角色成长
- 🌳 **剧情树** — 可视化剧情分支，拖拽规划故事走向
- 🕸️ **关系图** — 人物关系网络，一目了然
- 🏛️ **世界观体系** — 管理功法、势力、地图等设定
- 💡 **灵感便签** — 随时记录创意，AI 自动提取

**核心理念**: 隐私优先，作品数据本地存储；AI 驱动，对话式创作体验。

---

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 9（或 npm >= 10）

### 安装依赖

```bash
pnpm install
# 或
npm install
```

### 配置环境变量

```bash
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 DeepSeek API Key
```

### 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

### 构建生产版本

```bash
pnpm build
# 或
npm run build
```

---

## 🏗️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 构建工具 | Vite | ^6.x |
| 框架 | React | ^19.0 |
| 语言 | TypeScript | ^5.x |
| 样式 | Tailwind CSS | ^4.x |
| 状态管理 | Zustand + Immer | ^5.x / ^10.x |
| 本地存储 | Dexie (IndexedDB) | ^4.x |
| 可视化-剧情 | @xyflow/react | ^12.x |
| 可视化-关系 | @antv/g6 | ^5.x |
| AI 后端 | DeepSeek API | — |
| 导出 | html2canvas + jsPDF | ^1.x / ^3.x |

---

## 📁 项目结构

```
├── docs/                          # 📚 项目文档中心
│   ├── README.md                  # 文档导航与总览
│   ├── product/                   # 产品文档（PRD、CHANGELOG）
│   ├── architecture/              # 架构文档（ADR、评审报告）
│   ├── development/               # 开发规范（编码规范、状态管理）
│   ├── operations/                # 运维文档（部署、安全）
│   └── backend/                   # 后端文档（预留）
│
├── src/
│   ├── ai/                        # AI 层（API 封装、流式处理、提示词）
│   ├── db/                        # 数据层（Dexie 定义、迁移脚本）
│   ├── types/                     # 全局类型定义
│   ├── stores/                    # 全局状态（App Store）
│   ├── modules/                   # 业务模块
│   │   ├── character/             # 角色模块
│   │   ├── plot/                  # 剧情模块
│   │   ├── relation/              # 关系模块
│   │   ├── system/                # 体系模块
│   │   └── idea/                  # 灵感模块
│   ├── components/                # 共享组件
│   │   ├── ui/                    # 基础 UI
│   │   ├── chat/                  # AI 对话面板
│   │   └── canvas/                # 画布通用组件
│   ├── lib/                       # 通用工具（cn 等）
│   ├── utils/                     # 业务工具（ID 生成等）
│   ├── hooks/                     # 自定义 Hooks（预留）
│   └── App.tsx                    # 根组件
│
├── public/                        # 静态资源
├── dist/                          # 构建产物
├── .env.local.example             # 环境变量模板
├── vite.config.ts                 # Vite 配置
├── tsconfig*.json                 # TypeScript 配置
├── package.json                   # 依赖与脚本
└── README.md                      # ← 你在这里
```

---

## 📚 文档导航

| 文档 | 路径 | 适合读者 |
|------|------|----------|
| **文档总览** | `docs/README.md` | 所有人 |
| **产品需求 (PRD v3.0)** | `docs/product/PRD-网文创作辅助工具-v3.0.md` | 产品经理、设计师 |
| **技术架构** | `docs/architecture/ARCHITECTURE.md` | 架构师、前端工程师 |
| **架构评审报告** | `docs/architecture/REVIEW-2026-05-04.md` | Tech Lead、开发者 |
| **编码规范** | `docs/development/CODING-CONVENTIONS.md` | 前端工程师 |
| **状态管理规范** | `docs/development/STATE-MANAGEMENT.md` | 前端工程师 |
| **部署指南** | `docs/operations/DEPLOYMENT.md` | DevOps（待补充） |
| **安全规范** | `docs/operations/SECURITY.md` | 开发者（待补充） |

---

## 🛡️ 安全提示

⚠️ **当前版本存在以下已知安全风险**：

1. **API Key 暴露**: DeepSeek API Key 通过前端环境变量注入，在浏览器中可被读取。建议尽快迁移到代理服务器方案。
2. **无 CSP 配置**: 未设置 Content Security Policy，存在 XSS 攻击面。
3. **IndexedDB 数据未加密**: 用户创作内容以明文存储在本地浏览器中。

详见 `docs/architecture/REVIEW-2026-05-04.md` 安全分析章节。

---

## 📋 开发计划

### Phase 1: 基础骨架 ✅
- [x] 修复编译错误
- [x] App.tsx 主布局壳子
- [x] 底部模块切换 Tab
- [x] AI 对话面板框架

### Phase 2: 角色模块 MVP 🔄
- [ ] 角色 AI 生成功能
- [ ] 角色编辑表单
- [ ] Dexie 持久化接入

### Phase 3: 剧情树可视化
- [ ] React Flow 画布集成
- [ ] 剧情节点自定义组件
- [ ] AI 生成剧情骨架

### Phase 4: 关系图 + 体系 + 灵感
- [ ] G6 关系图集成
- [ ] 体系管理
- [ ] 灵感便签完善

### Phase 5: 全局联调
- [ ] 模块间跳转联动
- [ ] 导出功能（PDF/图片）
- [ ] 性能与安全加固

---

## 🤝 贡献指南

1. 阅读 `docs/development/CODING-CONVENTIONS.md` 了解编码规范
2. 阅读 `docs/development/STATE-MANAGEMENT.md` 了解状态管理规范
3. 提交 PR 前确保 `npm run build` 通过
4. 遵循 Git 提交规范（见编码规范文档）

---

## 📄 许可证

MIT License

---

> **项目维护**: 吴奕大青 (Wydq) + OpenClaw 生态
> **架构评审**: Program 系统架构师
> **问题反馈**: 通过飞书或 GitHub Issues
