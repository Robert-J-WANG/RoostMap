# RoostMap 学习笔记

RoostMap 是一个面向新西兰租客的区域选择与负担能力分析项目。项目以 MBIE Rental Bond Data 和 Stats NZ SA2 2019 为核心数据，通过地图、历史趋势、区域比较和通勤估算帮助用户理解居住成本差异。

本文件只展开当前正在实践的 Step。后续内容在前一步完成并核查后继续追加。

## Step 01 · 创建 React + TypeScript 项目

### 目标

先建立一个由官方模板生成、能够运行和生产构建的 React + TypeScript 应用，再以这个真实工程作为 Git 起点。

本机当前环境：

```text
Node.js v24.21.0
npm 11.19.0
Git 2.39.3 (Apple Git-146)
```

Node 24 是本项目的本地开发基线。

### 1. 创建应用

在准备存放项目的父目录执行：

```bash
npm create vite@latest RoostMap -- --template react-ts
cd RoostMap
npm install
```

创建过程中选择 ESLint 作为 linter。进入项目并安装依赖后，`package-lock.json` 会记录本次真实安装结果，作为以后 `npm ci` 可重复安装的依据。

创建后先查看工程入口：

```text
index.html
→ src/main.tsx
→ src/App.tsx
```

- `index.html` 提供挂载节点，也是 Vite 模块图的一部分。
- `src/main.tsx` 创建 React root，并挂载顶层组件。
- `src/App.tsx` 是模板当前显示的页面。
- `package.json` 记录脚本和直接依赖。

这一阶段只理解模板，不清理示例代码，不提前建立业务目录，也不修改 README 和 `.gitignore`；这些属于 Step 02 的项目基础配置。

### 2. 验证开发与生产构建

启动开发服务器：

```bash
npm run dev
```

浏览器可以打开模板页面后，用 `Ctrl+C` 停止服务器。开发服务器验证日常开发链路，但不能代替生产构建。

执行生产构建：

```bash
npm run build
```

构建成功后检查最终产物：

```bash
npm run preview
```

`build` 验证 TypeScript 和打包过程，`preview` 验证生成的 `dist` 可以按生产形式提供。完成后停止 preview。

### 3. 建立 Git 起点

项目已经能够运行和构建后，在项目根目录初始化仓库：

```bash
git init -b main
git config user.name
git config user.email
git status --short
```

先确认作者信息正确，并检查待追踪文件中没有 `node_modules`、`dist`、环境变量或其他本地产物。此时使用模板生成的 `.gitignore`；项目专用规则在 Step 02 根据真实需要补充。

确认后建立初始提交：

```bash
git add .
git diff --cached --check
git diff --cached --stat
git commit -m "chore: initialise React TypeScript project"
```

在 GitHub 创建同名空仓库，不让 GitHub 额外生成 README 或 `.gitignore`。然后连接并推送：

```bash
git remote add origin <repository-url>
git push -u origin main
git remote -v
git status --short --branch
```

第一个提交建立“应用可运行、可构建”的基线。短期开发分支从 Step 02 开始创建。

### 4. 完成检查

```text
⬜ React + TypeScript 应用由 Vite 官方模板创建
⬜ 创建项目时已选择 ESLint
⬜ package-lock.json 已生成
⬜ 已理解 index.html → main.tsx → App.tsx 的入口关系
⬜ npm run dev 能打开模板页面
⬜ npm run build 成功
⬜ npm run preview 能读取生产构建产物
⬜ Git 历史从 main 开始
⬜ 初始提交不包含依赖、构建产物或 secret
⬜ 本地 main 已推送到空的远程仓库
```

---

## Step 02 · 建立项目基础配置

### 这一步做什么

Step 01 已经建立了可以运行和构建的 React + TypeScript 项目，但当前仍然保留 Vite 示例代码，项目目录和基础配置也没有完成。

这一步完成后，项目应具备：

- 清理后的最小 React 页面；
- 完整且职责明确的项目目录规划；
- TypeScript 严格模式和 `@/` 路径别名；
- 环境变量使用规则；
- 项目文档、README、`.gitignore` 和 `AGENTS.md`；
- 可以继续运行、检查和构建的工程基础。

### 1. 建立开发分支

基础配置属于一个独立、可审查的工程改动，从最新的 `main` 创建短期分支：

```bash
git checkout main
git pull --ff-only
git status
git checkout -b chore/project-foundation
```

后续操作都在 `chore/project-foundation` 分支完成，不直接修改 `main`。

### 2. 配置路径别名

项目源码统一使用 `@/` 表示 `src/`：

```ts
import App from '@/app/App'
```

这样移动文件或调整目录层级时，不需要维护大量 `../../` 相对路径。

在根目录的 `tsconfig.json` 中保留原有 `files` 和 `references`，增加：

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

React 应用源码由 `tsconfig.app.json` 管理，因此还需要在它的 `compilerOptions` 中增加：

```json
"strict": true,
"paths": {
  "@/*": ["./src/*"]
}
```

这里的职责是：

- `strict`：启用 TypeScript 严格检查；
- `paths`：让 TypeScript 和 VS Code 识别 `@/`。

TypeScript 的 `paths` 不会自动改变 Vite 的模块解析，因此还需要修改 `vite.config.ts`：

```ts
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

两个配置分别负责：

```text
tsconfig paths       TypeScript 和 VS Code 的源码解析
Vite resolve.alias   开发服务器和生产构建的模块解析
```

它们都指向同一个 `src/`，避免编辑器能够识别、但应用运行时找不到模块的问题。

### 3. 配置环境变量

Vite 只会把以 `VITE_` 开头的变量暴露给浏览器。

因此：

- `VITE_` 变量只能保存允许用户在浏览器中看到的公开配置；
- API secret、service role key 和第三方服务私钥不能写入前端环境变量；
- `.env.example` 记录项目需要的变量名和示例值；
- `.env.local` 保存当前电脑使用的本地值；
- `.env.local` 必须被 Git 忽略。

当前只建立一个示例变量。创建 `.env.example`：

```dotenv
VITE_APP_URL=http://localhost:5173
```

根据示例创建本地配置：

```bash
cp .env.example .env.local
```

当前两个文件的内容相同：

```dotenv
VITE_APP_URL=http://localhost:5173
```

区别在于：

```text
.env.example    进入 Git，告诉开发者项目需要什么配置
.env.local      不进入 Git，保存当前电脑实际使用的配置
```

后续接入 Supabase、MapTiler 等服务时，再在对应开发步骤中加入实际需要的变量。

### 4. 规划项目目录结构

RoostMap 后续会包含页面路由、区域探索、租金分析、地图、图表、通勤、计划、账户、分享、数据流水线和服务端函数，因此需要先确定完整的工程边界。

项目的目标结构如下：

```text
RoostMap/
├── .github/
│   └── workflows/              GitHub Actions 工作流
├── api/                        Azure Static Web Apps Functions
├── data/                       数据源记录、fixture 和数据流水线
├── docs/                       项目设计、技术规范和学习笔记
├── public/
│   └── data/                   数据流水线生成的版本化公开数据
├── src/
│   ├── app/
│   │   ├── router/             路由定义
│   │   ├── providers/          全局 Provider 组合
│   │   └── config/             前端运行配置
│   ├── pages/                  与路由对应的页面组件
│   ├── features/
│   │   ├── auth/               登录、注册和身份状态
│   │   ├── areas/              SA2 区域基础信息
│   │   ├── affordability/      租金负担能力计算
│   │   ├── compare/            多区域比较
│   │   ├── commute/            通勤输入和结果
│   │   ├── explore/            地图探索和筛选
│   │   ├── plans/              本地与云端计划
│   │   ├── scenarios/          生活成本情景
│   │   └── sharing/            私密分享
│   ├── components/
│   │   ├── ui/                 通用基础 UI 组件
│   │   ├── charts/             跨功能复用的图表组件
│   │   └── layout/             Header、Footer 和页面布局
│   ├── data/                   前端数据 contract、读取和转换
│   ├── hooks/                  跨功能复用的 React hooks
│   ├── lib/                    通用工具和第三方库适配
│   ├── services/               外部服务和 API 客户端
│   ├── stores/                 全局客户端状态
│   ├── styles/                 全局样式入口
│   ├── types/                  跨功能共享的 TypeScript 类型
│   ├── test/                   测试环境和公共测试工具
│   └── main.tsx                React 应用入口
├── supabase/                   migrations、seed 和数据库测试
├── tests/
│   └── e2e/                    Playwright 浏览器测试
├── .env.example
├── .gitignore
├── AGENTS.md
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

目录划分遵循以下规则：

- `pages` 负责组织路由页面，不承载复杂业务逻辑；
- `features` 按业务能力组织代码；
- feature 私有的组件、hooks、类型和测试保留在对应 feature 内；
- 只有多个 feature 真实复用的内容才进入共享目录；
- `src/data` 保存前端数据读取和 contract，`public/data` 保存数据流水线生成的浏览器数据；
- `lib` 保存通用工具和第三方库适配，不再建立职责重复的 `utils`；
- `api`、`supabase`、`.github/workflows` 和 `tests/e2e` 在对应开发步骤中建立。

本步骤先在本地建立完整的前端目录：

```bash
mkdir -p src/app/router
mkdir -p src/app/providers
mkdir -p src/app/config

mkdir -p src/pages

mkdir -p src/features/auth
mkdir -p src/features/areas
mkdir -p src/features/affordability
mkdir -p src/features/compare
mkdir -p src/features/commute
mkdir -p src/features/explore
mkdir -p src/features/plans
mkdir -p src/features/scenarios
mkdir -p src/features/sharing

mkdir -p src/components/ui
mkdir -p src/components/charts
mkdir -p src/components/layout

mkdir -p src/data
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/services
mkdir -p src/stores
mkdir -p src/styles
mkdir -p src/types
mkdir -p src/test
```

Git 不追踪空目录，但不需要加入占位文件。目录先保留在本地；后续加入真实源码后自然进入 Git。

### 5. 清理模板并整理基础文件

删除 Vite 示例代码和资源：

```bash
rm src/App.css
rm -rf src/assets
rm public/favicon.svg
rm public/icons.svg
```

将应用组件和全局样式入口移动到规划的位置：

```bash
mv src/App.tsx src/app/App.tsx
mv src/index.css src/styles/index.css
```

清空 `src/styles/index.css`。当前只保留全局样式入口，不在这一步编写产品样式。

将 `src/app/App.tsx` 改为最小页面：

```tsx
function App() {
  return (
    <main>
      <h1>RoostMap</h1>
    </main>
  )
}

export default App
```

更新 `src/main.tsx`：

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/app/App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

这个 import 同时验证 `@/` 路径别名是否生效。

从 `index.html` 删除已经不存在的 favicon：

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

并把页面标题改为：

```html
<title>RoostMap</title>
```

将已经准备好的项目文件放入相应位置：

```text
RoostMap/
├── AGENTS.md
├── README.md
└── docs/
    ├── DEVELOPMENT_OUTLINE.md
    ├── PROJECT_DESIGN.md
    ├── TECHNICAL_SPEC.md
    └── steps.md
```

将 `README.md` 更新为：

````markdown
# RoostMap

RoostMap is a New Zealand rental-area affordability and commute analysis platform. It uses official rental and statistical geography data to help renters compare areas, understand historical rent trends and evaluate housing costs alongside commuting requirements.

## Current status

The React and TypeScript project foundation is in place.

The application currently contains a minimal page, project directory structure, TypeScript configuration, ESLint and environment variable conventions. Product features, data pipelines, tests, external services and deployment have not been implemented yet.

## Planned product capabilities

- Explore rental areas using an interactive map
- View current rental observations and historical trends
- Compare multiple SA2 areas
- Estimate rental affordability from household income
- Evaluate commuting time and cost
- Save local or account-based plans
- Generate private shareable reports

## Data sources

The planned core data sources are:

- MBIE Rental Bond Data
- Stats NZ Statistical Area 2 Higher Geographies 2019

Publishable geographic coverage will be determined by successfully joining valid rental observations to Stats NZ SA2 geography.

## Project documentation

- [Project design](docs/PROJECT_DESIGN.md)
- [Technical specification](docs/TECHNICAL_SPEC.md)
- [Development outline](docs/DEVELOPMENT_OUTLINE.md)
- [Development learning notes](docs/steps.md)

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Run ESLint:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```
````

将 `.gitignore` 更新为：

```gitignore
# Dependencies
node_modules/

# Frontend and Functions build output
dist/
build/
api/dist/

# Local environment files
.env
.env.*
!.env.example

# Raw and generated production data
data/raw/
public/data/

# Local Supabase state
.supabase/
supabase/.temp/

# Test output
coverage/
playwright-report/
test-results/

# Logs
*.log
npm-debug.log*

# Editors and operating systems
.DS_Store
.idea/
.vscode/
```

其中 `.env.*` 会忽略 `.env.local`，而 `!.env.example` 允许示例文件进入 Git。

### 6. 验证项目基础

先运行 ESLint 和生产构建：

```bash
npm run lint
npm run build
```

`npm run build` 中的 `tsc -b` 会检查 TypeScript 配置和路径别名，Vite 随后验证生产打包。

启动开发服务器：

```bash
npm run dev
```

浏览器应显示没有产品样式的 `RoostMap` 标题。

停止开发服务器后验证生产构建：

```bash
npm run preview
```

最后查看本次准备提交的文件：

```bash
git status
```

确认：

- Vite 示例文件已经删除；
- `node_modules`、`dist` 和 `.env.local` 没有进入 Git；
- `.env.example` 正常进入 Git；
- 项目文档位于正确位置；
- 前端目录结构已经在本地建立；
- 应用仍然能够运行和构建。

### 7. Git 提交

```bash
git add .
git commit -m "chore: establish project foundation"
git push -u origin chore/project-foundation
```

在 GitHub 创建 Pull Request，检查本次基础配置后 squash merge。

合并完成后同步本地仓库：

```bash
git checkout main
git pull --ff-only
git branch -D chore/project-foundation
```

### Step 02 完成状态

```text
⬜ 已从 main 创建独立开发分支
⬜ Vite 示例代码、资源和样式已经清理
⬜ 完整项目目录边界已经规划
⬜ 前端目录已在本地建立
⬜ TypeScript strict 和 @/* 路径别名已经生效
⬜ .env.example 和本地 .env.local 已建立
⬜ 项目文档、README、.gitignore 和 AGENTS.md 已归位
⬜ npm run lint 通过
⬜ npm run build 通过
⬜ dev 和 preview 均能显示最小页面
⬜ 基础配置已通过 Pull Request 合并到 main
```
