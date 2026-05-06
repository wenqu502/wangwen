# 织文 (WangWen) 项目文档中心

> **项目**: 织文 — 网文作者 AI 辅助创作工具
> **文档版本**: v1.0
> **最后更新**: 2026-05-04

---

## 📁 文档目录结构

```
docs/
├── README.md                          # ← 你在这里（文档导航）
├── product/                           # 📦 产品相关文档
│   ├── PRD-网文创作辅助工具-v2.0.md    # 产品需求文档 v2.0
│   ├── PRD-网文创作辅助工具-v3.0.md    # 产品需求文档 v3.0
│   └── CHANGELOG.md                   # 变更日志（待维护）
├── architecture/                      # 🏗️ 架构相关文档
│   ├── ARCHITECTURE.md                # 技术架构设计（ADR、模块边界、数据流）
│   ├── DECISIONS.md                   # 架构决策记录（从 ARCHITECTURE.md 提取）
│   └── REVIEW-2026-05-04.md           # 深度架构评审报告（性能·安全·存储）
├── development/                       # 💻 开发规范
│   ├── CODING-CONVENTIONS.md          # 编码规范与技术栈约定
│   ├── STATE-MANAGEMENT.md            # 状态管理与数据存储规范
│   └── TESTING.md                     # 测试规范（待补充）
├── operations/                        # 🚀 运维与部署
│   ├── DEPLOYMENT.md                  # 部署指南（待补充）
│   └── SECURITY.md                    # 安全规范与最佳实践
└── backend/                           # ⚙️ 后端相关（当前为纯前端，预留）
    └── API-DESIGN.md                  # API 设计规范（待补充）
```

---

## 🗂️ 按角色快速导航

| 角色 | 推荐阅读 |
|------|----------|
| **产品经理 / 设计师** | `product/PRD-网文创作辅助工具-v3.0.md` → `architecture/ARCHITECTURE.md` (模块边界) |
| **前端工程师** | `development/CODING-CONVENTIONS.md` → `development/STATE-MANAGEMENT.md` → `architecture/ARCHITECTURE.md` |
| **架构师 / Tech Lead** | `architecture/ARCHITECTURE.md` → `architecture/REVIEW-2026-05-04.md` → `operations/SECURITY.md` |
| **DevOps / 运维** | `operations/DEPLOYMENT.md` → `operations/SECURITY.md` |
| **新加入的开发者** | 本文件 → `development/CODING-CONVENTIONS.md` → `architecture/ARCHITECTURE.md` |

---

## 📝 文档维护规范

### 命名规范

- **文件名**: 全大写 + 连字符（kebab-case），如 `CODING-CONVENTIONS.md`
- **PRD 文件**: 保留版本号，如 `PRD-网文创作辅助工具-v3.0.md`
- **评审报告**: `REVIEW-YYYY-MM-DD.md`

### 文件头规范

每篇文档必须包含以下 frontmatter：

```markdown
# 文档标题

> **所属模块**: [product | architecture | development | operations | backend]
> **编制日期**: YYYY-MM-DD
> **编制角色**: [角色名]
> **版本**: vX.Y
> **状态**: [草稿 | 评审中 | 已发布 | 已归档]
```

### 变更管理

- 每次重大修改需在文档顶部添加 **变更记录** 小节
- 文档变更需同步更新 `product/CHANGELOG.md`
- 架构决策变更需在 `architecture/DECISIONS.md` 中追加 ADR 记录

### 审查流程

```
草稿编写 → 自审 → 同行评审 → 归档到 docs/ → 通知团队
```

---

## 🏛️ 技术栈总览

| 层级 | 技术选型 | 版本 | 用途 |
|------|----------|------|------|
| 构建工具 | Vite | ^6.x | 前端构建与 HMR |
| 框架 | React | ^19.0 | UI 框架 |
| 语言 | TypeScript | ^5.x | 类型系统 |
| 样式 | Tailwind CSS | ^4.x | 原子化 CSS |
| 状态管理 | Zustand + Immer | ^5.x / ^10.x | 全局状态 + 不可变更新 |
| 本地存储 | Dexie (IndexedDB) | ^4.x | 浏览器本地数据库 |
| 可视化-剧情 | @xyflow/react | ^12.x | 剧情分支树画布 |
| 可视化-关系 | @antv/g6 | ^5.x | 人物关系图 |
| AI 后端 | DeepSeek API | — | 大模型对话与 Function Calling |
| 导出 | html2canvas + jsPDF | ^1.x / ^3.x | 图片/PDF 导出 |
| 图标 | lucide-react | ^0.x | 图标库 |

---

## 🔗 相关资源

- **项目仓库**: `<项目根目录>/【第二大脑】/second_brain/【98】自有项目库/【96】小说网文作者Web`
- **构建产物**: `dist/` 目录（`npm run build` 生成）
- **开发入口**: `npm run dev`（Vite dev server）
- **环境配置**: 复制 `.env.local.example` → `.env.local` 后填入 API Key

---

> **维护者**: 吴奕大青 (Wydq) + Program 架构师
> **更新频率**: 架构文档随重大技术决策更新，开发规范随迭代同步
