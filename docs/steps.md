# RoostMap 学习笔记

RoostMap 是一个面向新西兰租客的租赁区域证据探索与比较项目。项目以 MBIE Rental Bond Data 和 Stats NZ SA2 2019 为核心数据，通过地图、历史趋势、Reported Bonds 和统一口径的区域比较帮助用户理解官方租金观测的差异与限制。

本文件按实际开发顺序记录各 Step 的思路、操作、代码、验证和修正。它以开发纲要为顺序依据，不重新定义产品范围和技术基线；项目当前行为仍以源码、配置和测试为准。早期记录保留当时的设计背景，后续产品边界变化不回写已经发生的学习历史。后续内容在前一步完成并核查后继续追加。

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
✅ React + TypeScript 应用由 Vite 官方模板创建
✅ 创建项目时已选择 ESLint
✅ package-lock.json 已生成
✅ 已理解 index.html → main.tsx → App.tsx 的入口关系
✅ npm run dev 能打开模板页面
✅ npm run build 成功
✅ npm run preview 能读取生产构建产物
✅ Git 历史从 main 开始
✅ 初始提交不包含依赖、构建产物或 secret
✅ 本地 main 已推送到空的远程仓库
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

- MBIE（租金） Rental Bond Data
- Stats NZ（区域） Statistical Area 2 Higher Geographies 2019

Publishable geographic coverage will be determined by successfully joining valid rental observations to Stats NZ（区域） SA2 geography.

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
✅ 已从 main 创建独立开发分支
✅ Vite 示例代码、资源和样式已经清理
✅ 完整项目目录边界已经规划
✅ 前端目录已在本地建立
✅ TypeScript strict 和 @/* 路径别名已经生效
✅ .env.example 和本地 .env.local 已建立
✅ 项目文档、README、.gitignore 和 AGENTS.md 已归位
✅ npm run lint 通过
✅ npm run build 通过
✅ dev 和 preview 均能显示最小页面
✅ 基础配置已通过 Pull Request 合并到 main
```

---

## Step 03 · 建立测试基础

### 这一步做什么

Step 02 已经建立了干净的工程结构，但项目目前只能通过 lint、TypeScript 和生产构建验证，还不能自动验证用户可见行为。

这一步建立三层测试能力：

```text
Vitest                         执行快速单元和组件测试
React Testing Library         从用户视角验证 React 组件
Playwright                     在真实浏览器中验证完整页面
```

当前没有值得单独测试的业务计算，因此不为了展示 unit test 而创建无意义的工具函数。Vitest 的单元测试能力会在后续出现真实数据转换和业务计算时使用。

### 1. 建立开发分支

从已经完成 Step 02 的最新 `main` 创建测试基础分支：

```bash
git checkout main
git pull --ff-only
git status
git checkout -b test/foundation
```

### 2. 安装测试依赖

安装 Vitest、jsdom、React Testing Library 和 Playwright：

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @playwright/test
```

各依赖的职责：

```text
vitest                         测试执行器和断言
jsdom                          在 Node.js 中模拟浏览器 DOM
@testing-library/react         渲染和查询 React 组件
@testing-library/dom           Testing Library 的 DOM 基础能力
@testing-library/jest-dom      提供可读的 DOM 断言
@playwright/test               浏览器测试执行器和断言
```

Playwright 的 npm 包不包含浏览器程序，需要单独安装本阶段使用的 Chromium：

```bash
npx playwright install chromium
```

当前只建立 Chromium smoke test。Firefox、WebKit 和移动设备覆盖在发布前质量加固阶段根据需要加入。

### 3. 配置组件测试

Vitest 可以直接读取现有的 `vite.config.ts`，因此可以继续使用已经配置好的 React 插件和 `@/` 路径别名，不需要再创建一套重复的 Vite 配置。

在 `vite.config.ts` 顶部加入 Vitest 配置类型，并增加 `test` 配置：

```ts
/// <reference types="vitest/config" />

import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

这里的配置职责是：

- `environment` 使用 jsdom 提供 DOM 环境；
- `include` 只让 Vitest 查找 `src/` 中的单元和组件测试，避免执行 `tests/e2e` 中的 Playwright 文件；
- `setupFiles` 在每个测试文件运行前加载公共测试配置。

创建公共测试配置文件`src/test/setup.ts`，配置 DOM 断言和测试清理：

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

`setup.ts` 做了两件事：

- 导入 `@testing-library/jest-dom/vitest`，可以让组件测试使用一些方法，比如：

    ```
    toBeInTheDocument()
    toBeVisible()
    toHaveAccessibleName()
    ```

- 注册 `cleanup()`，在每个测试结束后清理 jsdom 中渲染的内容。

### 4. 编写第一个组件测试

创建 `src/app/App.test.tsx` 测试组件，测试当前页面能够向用户显示产品名称：

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/app/App";

describe("App", () => {
  it("shows the product name", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "RoostMap" }),
    ).toBeInTheDocument();
  });
});
```

这个测试通过 heading 的语义角色和可见名称查询页面，验证用户能够感知的结果，不检查组件内部状态、CSS class 或具体 DOM 层级。

当前组件很简单，这个测试的主要意义是验证以下链路已经打通：

```text
Vitest
→ jsdom
→ React Testing Library
→ jest-dom
→ TypeScript
→ @/ 路径别名
```

### 5. 配置浏览器测试

建立 Playwright 测试目录：

```bash
mkdir -p tests/e2e
```

在项目根目录创建 `playwright.config.ts`：

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
});
```

配置职责：

- `testDir` 只从 `tests/e2e` 查找浏览器测试；
- `baseURL` 让测试使用 `/` 等相对地址；
- `webServer` 在运行测试前自动启动 Vite；
- `reuseExistingServer` 在本地已有开发服务器时直接复用；
- `trace` 在测试失败时保存浏览器执行过程；
- `projects` 当前只运行 Chromium；
- `reporter` 在终端显示结果，同时生成不会自动打开的 HTML 报告。

让生产构建同时检查 Playwright 配置和浏览器测试的 TypeScript 类型。将 `tsconfig.node.json` 的 `include` 更新为：

```json
"include": [
  "vite.config.ts",
  "playwright.config.ts",
  "tests/e2e"
]
```

### 6. 编写首页 smoke test

创建`tests/e2e/home.spec.ts` ，编写第一个浏览器测试：

```ts
import { expect, test } from "@playwright/test";

test("loads the application", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("RoostMap");
  await expect(
    page.getByRole("heading", { name: "RoostMap" }),
  ).toBeVisible();
});
```

这个测试验证：

```text
Vite 开发服务器能够启动
→ 浏览器能够访问应用
→ index.html 正确加载
→ React 成功挂载
→ 用户能够看到页面标题
```

当前还没有路由系统，因此不测试未知路径。

### 7. 建立测试脚本

在 `package.json` 的 `scripts` 中增加：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "check": "npm run lint && npm run test && npm run build && npm run test:e2e",
    "preview": "vite preview"
  }
}
```

脚本职责：

```text
npm run test          执行一次组件和单元测试
npm run test:watch    开发过程中监听文件并重新执行相关测试
npm run test:e2e      执行 Chromium 浏览器测试
npm run check         按项目质量门禁顺序执行全部检查
```

`check` 按以下顺序运行：

```text
ESLint
→ Vitest
→ TypeScript + production build
→ Playwright
```

任何一项失败，命令都会停止，不会把失败的工程视为可以提交。

### 8. 验证测试基础

执行统一质量检查：

```bash
npm run check
```

预期结果：

- ESLint 通过；
- Vitest 只找到并通过 `App.test.tsx`；
- TypeScript 和 Vite 生产构建通过；
- Playwright 自动启动 Vite；
- Chromium 通过首页 smoke test；
- 测试结束后开发服务器自动停止。

如果某一层失败，可以单独运行对应命令定位问题：

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

`coverage/`、`playwright-report/` 和 `test-results/` 已经由 `.gitignore` 排除，不应进入 Git。

### 9. 更新 README 项目状态

测试基础验证通过后，更新 `README.md`，让项目说明反映 Step 03 完成后的真实状态。

将 `Current status` 更新为：

```markdown
## Current status

The React, TypeScript and automated test foundations are in place.

The application currently contains a minimal page, an established source directory structure, TypeScript configuration, ESLint and environment variable conventions, a Vitest component test and a Playwright Chromium smoke test.
```

在 `Development` 中补充测试和统一检查命令：

````markdown
Run component tests once:

```bash
npm run test
```

Run component tests in watch mode:

```bash
npm run test:watch
```

Run the browser smoke test:

```bash
npm run test:e2e
```

Run the complete local quality check:

```bash
npm run check
```
````

README 中的其他内容保持不变。

### 10. Git 提交

确认测试基础全部通过后提交：

```bash
git add .
git commit -m "test: establish frontend test foundation"
git push -u origin test/foundation
```

在 GitHub 创建 Pull Request，记录：

- Vitest 和 React Testing Library 已建立；
- Playwright Chromium smoke test 已建立；
- `npm run check` 已通过；
- 未知路由测试将在 Step 04 路由实现后加入。

Pull Request 检查完成后 squash merge，然后同步本地仓库：

```bash
git checkout main
git pull --ff-only
git branch -D test/foundation
```

### Step 03 完成状态

```text
✅ 已从 main 创建 test/foundation 分支
✅ Vitest、jsdom 和 React Testing Library 已安装
✅ jest-dom 和测试清理已经配置
✅ App 组件测试通过
✅ Playwright 和 Chromium 已安装
✅ 首页浏览器 smoke test 通过
✅ 测试配置和测试文件参与 TypeScript 检查
✅ npm run check 依次通过 lint、test、build 和 E2E
✅ 测试报告和结果目录没有进入 Git
✅ 测试基础已通过 Pull Request 合并到 main
```

---

## Step 04 · 建立应用外壳与基础 UI

### 这一步做什么

目前项目已经具备 React、TypeScript、代码检查和测试基础，但仍然只有一个最小页面。它还缺少真正应用需要的基本结构：

```text
不同 URL 对应不同页面
所有页面共享的 Header、Main 和 Footer
统一的颜色、间距和页面宽度
未知地址和运行时错误处理
桌面与移动端布局
```

这一步建立后续功能共同依赖的应用外壳：

```text
Tailwind CSS 与设计 token
→ shadcn/ui 基础组件
→ 全局布局
→ 基础页面
→ React Router
→ 404 与页面错误边界
→ 测试与验证
```

本步不会实现数据、地图、业务表单或用户账户。

### 1. 建立开发分支

创建短期功能分支：

```bash
git checkout main
git pull --ff-only
git checkout -b feat/app-shell
```

这个分支只承载本步的 UI 基础、布局、路由和相关测试。

### 2. 配置 Tailwind CSS 与 shadcn/ui

Tailwind CSS 和 shadcn/ui 解决不同层次的问题：

- Tailwind CSS 负责布局、响应式、颜色、间距、字体、边框和阴影；
- shadcn/ui 提供 Button 等基础组件源码。生成的组件会进入 `src/components/ui`，成为项目代码的一部分。

两者之间的关系是：

```text
CSS variables 定义设计 token
→ Tailwind 把 token 转换成 utility class
→ shadcn/ui 使用这些 class 组成基础组件
→ 页面使用基础组件和 utility class
```

当前 Tailwind 推荐在 Vite 项目中使用专用插件，不需要创建旧版教程中的 `tailwind.config.js` 或 PostCSS 配置。

先安装 Tailwind 和 Vite 插件：

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Tailwind 必须进入 Vite 的编译过程。现有 `vite.config.ts` 已经包含 React、路径别名和 Vitest，因此只增加 Tailwind 插件，其他配置保持不变：

```ts
/// <reference types="vitest/config" />

import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

Vite 已经能够处理 Tailwind 后，还需要建立全局 CSS 入口。暂时把 `src/styles/index.css` 清理为：

```css
@import "tailwindcss";
```

`main.tsx` 已经导入这个文件，因此 Tailwind 样式会随应用一起进入浏览器。

接下来初始化 shadcn/ui：

```bash
npx shadcn@latest init
```

初始化时让生成路径与现有项目结构保持一致：

```text
component library   Radix UI
preset              Nova
global CSS          src/styles/index.css
components          @/components
UI components       @/components/ui
utilities           @/lib/utils
hooks               @/hooks
base colour         neutral
CSS variables       enabled
icon library        Lucide
```

初始化过程会建立或更新：

```text
components.json
src/lib/utils.ts
src/styles/index.css
package.json
package-lock.json
```

此时 `index.css` 已经包含 shadcn/ui 的主题结构，不能再用前面的单行 Tailwind import 覆盖。

当前应用外壳实际会使用 Button，因此只添加这个组件：

```bash
npx shadcn@latest add button
```

本步没有真实表单，所以不添加 Field、Input 或表单库。

> shadcn/ui 生成的 Button 文件会同时导出 `Button` 和 `buttonVariants`：
>
> ```tsx
> export { Button, buttonVariants };
> ```
>
> `react-refresh/only-export-components` 默认要求组件文件只导出组件，因此会标记 `buttonVariants`。应用代码仍应保留这项检查，只在 `eslint.config.js` 的 `defineConfig` 数组中为 shadcn/ui 源码目录增加独立例外：
>
> ```js
> {
>   files: ['src/components/ui/**/*.{ts,tsx}'],
>   rules: {
>     'react-refresh/only-export-components': 'off',
>   },
> },
> ```

现在需要把 shadcn/ui 默认的中性色调整为 RoostMap 的蓝绿色视觉方向，同时建立统一的页面宽度和边距。light 使用海岸薄雾般的浅灰绿背景和深青文字，dark 使用峡湾夜色般的深蓝绿背景和明亮青色交互状态；两者共享相同的语义层级，并使用暖色表达风险。在生成的主题区域中写入：

```css
:root {
  --background: #f4f8f7;
  --foreground: #102a2d;

  --card: #ffffff;
  --card-foreground: #102a2d;

  --popover: #ffffff;
  --popover-foreground: #102a2d;

  --primary: #0b766e;
  --primary-foreground: #f7fffd;

  --secondary: #dcefeb;
  --secondary-foreground: #174f4b;

  --muted: #e8f0ef;
  --muted-foreground: #536a6b;

  --accent: #c9ebe4;
  --accent-foreground: #124b47;

  --destructive: #b5473c;
  --border: #cedddb;
  --input: #b8ceca;
  --ring: #138a80;

  --chart-1: #0f766e;
  --chart-2: #2f6f9f;
  --chart-3: #d18b2c;
  --chart-4: #c45d55;
  --chart-5: #7663a6;

  --sidebar: #edf5f3;
  --sidebar-foreground: #102a2d;
  --sidebar-primary: #0b766e;
  --sidebar-primary-foreground: #f7fffd;
  --sidebar-accent: #dcefeb;
  --sidebar-accent-foreground: #174f4b;
  --sidebar-border: #cedddb;
  --sidebar-ring: #138a80;

  --radius: 0.75rem;

  --content-max-width: 72rem;
  --page-gutter: clamp(1rem, 4vw, 2rem);
  --section-space: clamp(3rem, 8vw, 6rem);
  --page-glow: rgb(13 148 136 / 0.13);
  --surface-shadow: 0 24px 60px rgb(16 42 45 / 0.1);
}

.dark {
  --background: #0b1719;
  --foreground: #e7f2ef;

  --card: #122326;
  --card-foreground: #e7f2ef;

  --popover: #15292c;
  --popover-foreground: #e7f2ef;

  --primary: #5fd3c4;
  --primary-foreground: #07201e;

  --secondary: #1b3638;
  --secondary-foreground: #c5e2dc;

  --muted: #182a2d;
  --muted-foreground: #9fb4b2;

  --accent: #214b49;
  --accent-foreground: #d9f4ee;

  --destructive: #ff8a7d;
  --border: #294043;
  --input: #365054;
  --ring: #54c9ba;

  --chart-1: #57c8b8;
  --chart-2: #70a7d8;
  --chart-3: #e6ad5c;
  --chart-4: #ef8074;
  --chart-5: #aa91d8;

  --sidebar: #0f2023;
  --sidebar-foreground: #e7f2ef;
  --sidebar-primary: #5fd3c4;
  --sidebar-primary-foreground: #07201e;
  --sidebar-accent: #1b3638;
  --sidebar-accent-foreground: #c5e2dc;
  --sidebar-border: #294043;
  --sidebar-ring: #54c9ba;

  --page-glow: rgb(45 212 191 / 0.12);
  --surface-shadow: 0 26px 70px rgb(0 0 0 / 0.32);
}
```

保留 `@theme inline` 映射。组件使用 `bg-primary`、`text-muted-foreground` 和 `border-border` 等语义名称，不直接重复具体颜色。`--page-glow` 为页面顶部提供克制的环境光，`--surface-shadow` 分别适配浅色和深色内容面；五个 chart token 为后续地图与图表保持一致的分类颜色。

来源：[Tailwind Vite 配置](https://tailwindcss.com/docs/installation/using-vite)、[shadcn/ui Vite 配置](https://ui.shadcn.com/docs/installation/vite)

### 3. 建立全局布局

Home、Methodology 以及后续页面都会共享品牌入口、主导航、页面宽度和 Footer。如果每个页面分别编写这些内容，会产生重复代码，而且不同页面可能出现不同的宽度和间距。

因此建立一个 `AppShell`：

```text
AppShell
├── Header
│   ├── Brand
│   └── Navigation
├── Main
│   └── 当前页面内容
└── Footer
```

`AppShell` 只负责共享布局，不负责判断当前显示哪个页面。具体页面通过 `children` 进入 Main。

Header 中的品牌和导航都需要进行页面跳转，因此在建立布局前安装 React Router：

```bash
npm install react-router
```

当前只有 Home 和 Methodology 两个导航入口，用一个简单数组集中保存名称和地址：

```tsx
const navigationItems = [
  { label: "Home", to: "/" },
  { label: "Methodology", to: "/methodology" },
];
```

`NavLink` 会根据当前 URL 提供 `isActive`，从而显示当前页面状态。

创建 `src/components/layout/AppShell.tsx`：

```tsx
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Home", to: "/" },
  { label: "Methodology", to: "/methodology" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex w-full max-w-[var(--content-max-width)] flex-col gap-4 px-[var(--page-gutter)] py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            aria-label="RoostMap home"
            className="text-xl font-semibold tracking-tight"
            to="/"
          >
            RoostMap
          </Link>

          <nav aria-label="Primary navigation">
            <ul className="flex flex-wrap items-center gap-2">
              {navigationItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        "inline-flex rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive &&
                          "bg-accent text-accent-foreground",
                      )
                    }
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[var(--content-max-width)] flex-1 px-[var(--page-gutter)] py-[var(--section-space)]">
        {children}
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto w-full max-w-[var(--content-max-width)] px-[var(--page-gutter)] py-6 text-sm text-muted-foreground">
          RoostMap · New Zealand rental-area decision support
        </div>
      </footer>
    </div>
  );
}
```

这里使用 `min-h-svh` 让页面至少占满当前屏幕高度；`main` 使用 `flex-1` 占据剩余空间；Header、Main 和 Footer 使用同一套最大宽度与页面边距。

移动端 Header 默认纵向排列，达到 `sm` 断点后改为横向排列。当前导航很少，不需要引入汉堡菜单或 Drawer。

### 4. 建立基础页面

当前先建立三个页面，用于验证应用外壳和路由结构：

```text
Home             表达产品定位
Methodology      展示已经确定的数据来源
Not Found        处理未知 URL
```

这些页面只包含本阶段真实存在的信息，不加入搜索框、地图或其他尚未实现的操作。

给这些页面格外添加 <title>标签， 用于跳转不同页面时标题的区分。

> 关于 <title>标签：
>
> - 页面 title 会显示在浏览器标签页、浏览历史和书签中。
>
> - 只有直接对应 URL 的页面需要声明 `<title>`，普通组件不需要。
> - React 19 可以直接在页面组件中渲染 `<title>`，不需要额外安装 title 管理库，也不需要编写修改 `document.title` 的 effect。

Home 页面需要表达产品价值，并提供一个已经可以使用的 Methodology 入口。这个入口执行页面导航，因此保持 Link 语义，再用 `buttonVariants()` 获得统一的按钮视觉。

创建 `src/pages/HomePage.tsx`：

```tsx
import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";

const productPrinciples = [
  "Compare rental areas on a consistent SA2 geography.",
  "Understand rent observations with clear periods and sources.",
  "Consider housing cost together with commuting requirements.",
];

export function HomePage() {
  return (
    <>
      <title>Home | RoostMap</title>

      <section className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            New Zealand rental-area planning
          </p>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Make clearer rental decisions with area-level evidence.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            RoostMap brings rental affordability, historical rent context and
            commuting requirements into one decision-making experience.
          </p>

          <Link
            className={buttonVariants({
              className: "mt-8",
              size: "lg",
              variant: "outline",
            })}
            to="/methodology"
          >
            View the methodology
            <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
          </Link>
        </div>

        <aside
          aria-label="Product principles"
          className="rounded-2xl border bg-card p-6 shadow-[var(--surface-shadow)]"
        >
          <h2 className="text-lg font-semibold">
            Designed for clear comparison
          </h2>

          <ul className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            {productPrinciples.map((principle) => (
              <li className="border-l-2 border-primary pl-4" key={principle}>
                {principle}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </>
  );
}
```

Methodology 页面此时只展示已经固定的两个核心数据源和 SA2 地理口径，不描述尚未验证的数据处理结果。

创建 `src/pages/MethodologyPage.tsx`：

```tsx
export function MethodologyPage() {
  return (
    <>
      <title>Methodology | RoostMap</title>

      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Data methodology
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          How RoostMap interprets rental areas
        </h1>

        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          RoostMap uses official rental observations and statistical geography
          so that area comparisons retain a consistent geographic meaning.
        </p>

        <section className="mt-10 border-t pt-8">
          <h2 className="text-2xl font-semibold">Core data sources</h2>

          <ul className="mt-4 list-disc space-y-3 pl-6 text-muted-foreground">
            <li>MBIE（租金） Rental Bond Data</li>
            <li>Stats NZ（区域） Statistical Area 2 Higher Geographies 2019</li>
          </ul>
        </section>
      </article>
    </>
  );
}
```

Not Found 页面负责处理没有对应页面的 URL。它明确告诉用户当前地址无效，并提供返回首页的入口。

创建 `src/pages/NotFoundPage.tsx`：

```tsx
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <>
      <title>Page not found | RoostMap</title>

      <section className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          404
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Page not found
        </h1>

        <p className="mt-4 text-muted-foreground">
          The address may be incorrect, or the page may have moved.
        </p>

        <Link
          className={buttonVariants({ className: "mt-8" })}
          to="/"
        >
          Return home
        </Link>
      </section>
    </>
  );
}
```

三个普通页面已经准备好。建立路由表之前，还需要准备页面发生异常时显示的内容。

### 5. 建立路由错误页面

Not Found 和 Route Error 处理的是不同问题：

```text
URL 没有匹配到页面
→ NotFoundPage

页面已经匹配，但渲染或路由数据处理发生异常
→ RouteErrorPage
```

`RouteErrorPage` 会作为内部页面路由的 `ErrorBoundary`。当子页面发生异常时，React Router 会在 `RootLayout` 的 `Outlet` 位置渲染这个错误页面，因此它只负责错误内容，不再重复创建 `AppShell`。错误信息也不直接显示原始 Error message 或 stack trace，避免向用户暴露内部实现。

创建 `src/pages/RouteErrorPage.tsx`：

```tsx
import { Link, isRouteErrorResponse, useRouteError } from "react-router";

import { buttonVariants } from "@/components/ui/button";

export function RouteErrorPage() {
  const error = useRouteError();

  const description = isRouteErrorResponse(error)
    ? `The page failed with status ${error.status}.`
    : "An unexpected error prevented this page from being displayed.";

  return (
    <>
      <title>Something went wrong | RoostMap</title>

      <section className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-destructive">
          Error
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Something went wrong
        </h1>

        <p className="mt-4 text-muted-foreground">{description}</p>

        <Link className={buttonVariants({ className: "mt-8" })} to="/">
          Return home
        </Link>
      </section>
    </>
  );
}
```

### 6. 建立应用路由

共享布局需要先与子页面建立连接，先创建组件`RootLayout` 负责渲染公共组件 `AppShell` 和子页面组件，React Router提供的`Outlet` 则能标记匹配到的子路由内容应该出现的位置。

创建 `src/components/layout/RootLayout.tsx`：

```tsx
import { Outlet } from "react-router";

import { AppShell } from "@/components/layout/AppShell";

export function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
```

应用的路由层级可以确定为：

```text
无路径布局路由：RootLayout
└── path="/"
    ├── ErrorBoundary：RouteErrorPage
    └── children
        ├── index：HomePage
        ├── methodology：MethodologyPage
        └── *：NotFoundPage
```

外层无路径路由负责共享布局。内部的 `/` 路由没有自己的页面组件，它负责组织子页面并提供错误边界。正常情况下，匹配到的子页面会继续传递到 `RootLayout` 的 `Outlet`；发生异常时，`RouteErrorPage` 只替换这个 Outlet 中的页面内容，外层 `AppShell` 继续保留。

各个地址的匹配结果是：

```text
/
→ HomePage

/methodology
→ MethodologyPage

其他地址
→ NotFoundPage

上述页面发生异常
→ RouteErrorPage
```

React Router 需要一张路由表。路由表不是导航菜单，而是应用内部的 URL 匹配规则：

```text
浏览器 URL
→ 路由表寻找匹配项
→ 选择页面组件
→ 把页面放入共享布局
```

创建路由表 `src/app/router/routes.tsx`：

```ts
import type { RouteObject } from "react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { MethodologyPage } from "@/pages/MethodologyPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";

export const routes = [
  {
    Component: RootLayout,
    children: [
      {
        path: "/",
        ErrorBoundary: RouteErrorPage,
        children: [
          {
            index: true,
            Component: HomePage,
          },
          {
            path: "methodology",
            Component: MethodologyPage,
          },
          {
            path: "*",
            Component: NotFoundPage,
          },
        ],
      },
    ],
  },
] satisfies RouteObject[];

```

路由表只描述匹配关系，还需要创建 Browser Router，把这些规则连接到浏览器 History API。Router 在 React 组件外创建一次，避免组件重新渲染时重复创建实例。

创建 `src/app/router/router.ts`：

```ts
import { createBrowserRouter } from "react-router";

import { routes } from "@/app/router/routes";

export const router = createBrowserRouter(routes);
```

最后让 `App` 使用 `RouterProvider`。浏览器地址变化时，Provider 会重新匹配路由表并渲染对应页面。

更新 `src/app/App.tsx`：

```tsx
import { RouterProvider } from "react-router/dom";

import { router } from "@/app/router/router";

function App() {
  return <RouterProvider router={router} />;
}

export default App;
```

`src/main.tsx` 仍然只负责创建 React root 和加载全局 CSS：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/app/App";
import "@/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

现在应用入口形成完整链路：

```text
index.html
→ main.tsx
→ App
→ RouterProvider
→ routes
→ RootLayout
→ AppShell
→ Outlet
→ 当前页面或 RouteErrorPage
```

### 7. 完成响应式与页面语义基础

应用外壳使用移动优先的 Tailwind class：

```text
默认状态        小屏幕纵向布局
sm 及以上       Header 横向排列
lg 及以上       Home 页面变为两列
```

项目界面使用 `en-NZ`。浏览器和辅助工具可以根据文档语言使用正确的语言规则，因此将 `index.html` 更新为：

```html
<html lang="en-NZ">
```

完成后在浏览器中检查：

- 每个页面只有一个主要 `h1`；
- Heading 层级连续；
- Header、Navigation、Main 和 Footer 结构正确；
- 当前导航项有清楚的状态；
- 390px、768px 和桌面宽度下没有水平滚动；
- 页面内容没有重叠或被截断；
- 文字和背景具有清楚的对比度。

当前导航项目较少，移动端保持可换行导航，不引入汉堡菜单或 Drawer。

### 8. 建立明暗主题切换

全局样式已经使用 `:root` 和 `.dark` 定义了 light 与 dark 两套语义颜色。页面组件只使用 `bg-background`、`text-foreground`、`bg-card` 等语义 token，不需要知道每种主题的具体颜色。现在还需要建立主题状态，决定浏览器当前使用哪一套 token。

主题按下面的顺序确定：

```text
读取已经保存的用户选择
→ 存在 light 或 dark 时直接使用
→ 没有保存选择时读取操作系统 prefers-color-scheme
→ 把结果应用到 html
```

用户点击切换按钮后，新的明确选择写入 `localStorage`。后续刷新或再次访问时优先恢复这个选择，不再由当时的系统主题覆盖。主题偏好只是界面设置，不包含收入、工作地点或计划数据，因此使用独立的 `ui-theme` key，不改变后续业务数据的保存规则。

在 `src/app/theme/theme.ts` 中集中处理主题的读取、应用与保存：

```ts
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ui-theme";

export function getInitialTheme(): Theme {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme) {
    return storedTheme as Theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getDocumentTheme(): Theme {
  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function persistTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initialiseTheme() {
  const theme = getInitialTheme();
  applyTheme(theme);

  return theme;
}
```

`.dark` class 控制 Tailwind 的 dark variant 和项目的深色 CSS variables；`colorScheme` 让浏览器原生控件使用相同的明暗外观。

主题应在 React 建立页面前应用。在 `src/main.tsx` 中导入并调用初始化函数：

```ts
import App from "@/app/App";
import { initialiseTheme } from "@/app/theme/theme";
import "./styles/index.css";

initialiseTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

接着建立 `src/components/ThemeToggle.tsx`。组件从 `<html>` 的实际 class 初始化状态，并提前计算下一次点击要切换到的主题：

```tsx
import { useState } from "react";

import { Moon, Sun } from "lucide-react";

import {
  applyTheme,
  getDocumentTheme,
  persistTheme,
  type Theme,
} from "@/app/theme/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getDocumentTheme);
  const nextTheme = theme === "light" ? "dark" : "light";
  const title = `Switch to ${nextTheme} theme`;

  function toggleTheme() {
    applyTheme(nextTheme);
    persistTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <Button
      className="rounded-full"
      onClick={toggleTheme}
      size="icon"
      title={title}
      type="button"
      variant="outline"
    >
      {theme === "light" ? <Moon /> : <Sun />}
    </Button>
  );
}
```

按钮使用已有的 shadcn/ui `Button` 和 Lucide 图标，不增加新的依赖。圆形 outline 外观让主题入口在两套背景中都保持清楚，但不会压过主导航。把 `ThemeToggle` 放在 `AppShell` 的主导航旁后，所有位于共享布局中的页面都使用同一个主题入口：

```tsx
<div className="flex w-full items-center justify-between gap-2 sm:w-auto">
  <nav aria-label="Primary navigation">...</nav>
  <ThemeToggle />
</div>
```

移动端让导航与主题按钮占据可用宽度，桌面端恢复为内容宽度。主题切换只改变语义 token 对应的颜色，不改变页面结构、路由状态或业务数据。

### 9. 更新测试

路由、应用外壳和主题功能建立后，需要从三个层次验证它们的协作结果：

```text
路由组件测试
→ 在 jsdom 中验证路由匹配、共享布局和错误边界

主题工具与组件测试
→ 验证主题来源、文档状态、切换行为和持久化

端到端测试
→ 在真实浏览器中验证页面加载、用户导航、URL 变化和刷新后的主题
```

#### 9.1 路由组件测试

Vitest 和 React Testing Library 使用 `createMemoryRouter` 在内存中模拟 URL，不需要启动开发服务器。当前测试会同时渲染路由、布局和页面，因此验证的是这些组件协作后的可见结果。

设计思路：组件测试使用 `renderRoute()` 为每个测试创建独立的 Memory Router。错误边界测试故意建立一个会抛出异常的页面，并使用与生产代码相同的嵌套路由。它同时检查错误内容和 Header，证明错误只替换页面区域，没有替换 AppShell。`BrokenPage` 不会正常返回页面内容，因此显式使用 `never` 作为返回类型。

先删除已经失效的旧测试：

```bash
rm src/app/App.test.tsx
```

创建新的路由组件测试 `src/app/router/routes.test.tsx`：

```tsx
import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it, vi } from "vitest";

import { routes } from "@/app/router/routes";
import { RootLayout } from "@/components/layout/RootLayout";
import { RouteErrorPage } from "@/pages/RouteErrorPage";

/* --------- 测试辅助方法 -------- */
// Create an isolated Memory Router for each test case.
function renderRoute(pathname: string) {
  const router = createMemoryRouter(routes, {
    initialEntries: [pathname],
  });

  render(<RouterProvider router={router} />);
}

/* --------- 路由测试场景 -------- */
describe("application routes", () => {
  /* --------- 测试 1：首页路由与共享外壳 -------- */
  it("renders the shared application shell", async () => {
    renderRoute("/");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /make clearer rental decisions/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  /* --------- 测试 2：方法说明页面路由匹配 -------- */
  it("renders the methodology route", async () => {
    renderRoute("/methodology");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "How RoostMap interprets rental areas",
      }),
    ).toBeInTheDocument();
  });

  /* --------- 测试 3：通配路由与未找到页面 -------- */
  it("renders the not-found page for an unknown route", async () => {
    renderRoute("/unknown-page");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Page not found",
      }),
    ).toBeInTheDocument();
  });

  /* --------- 测试 4：错误边界保留应用外壳 -------- */
  it("renders the route error inside the application shell", async () => {
    /* --------- 错误场景组件 -------- */
    // This component always throws to exercise the route error boundary.
    function BrokenPage(): never {
      throw new Error("Expected test error");
    }

    /* --------- 与生产结构一致的测试路由 -------- */
    const router = createMemoryRouter(
      [
        {
          Component: RootLayout,
          children: [
            {
              path: "/",
              ErrorBoundary: RouteErrorPage,
              children: [
                {
                  index: true,
                  Component: BrokenPage,
                },
              ],
            },
          ],
        },
      ],
      {
        initialEntries: ["/"],
      },
    );

    /* --------- 预期控制台错误 -------- */
    // Suppress the error log produced while the boundary handles the test error.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      render(<RouterProvider router={router} />);

      expect(
        await screen.findByRole("heading", {
          name: "Something went wrong",
        }),
      ).toBeInTheDocument();

      expect(screen.getByRole("banner")).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});

```

这组测试分别确认首页和 Methodology 页面能够正确匹配、未知地址进入 Not Found 页面，以及页面异常只替换 `AppShell` 内的页面区域。完成后单独运行组件测试：

```bash
npm run test
```

预期 `routes.test.tsx` 中的四个测试全部通过。

#### 9.2 主题工具与组件测试

主题逻辑分为不依赖 React 的工具函数和用户直接操作的按钮组件，因此分别测试。

`src/app/theme/theme.test.ts` 验证：

```text
localStorage 已保存 dark
→ 不再读取系统主题
→ 返回 dark

localStorage 没有保存选择
→ 系统主题为 dark
→ 返回 dark

初始化 dark
→ html 获得 dark class
→ color-scheme 变为 dark
→ 再应用 light 时同时恢复 light 状态
```

`src/components/ThemeToggle.test.tsx` 从 light 状态渲染按钮并执行一次点击，确认四个结果保持一致：

```text
html 获得 dark class
color-scheme 变为 dark
localStorage 保存 dark
按钮提示下一次将切换到 light
```

这些测试关注可观察的主题行为，不检查组件内部 state，也不比较具体颜色值。

#### 9.3 端到端测试

组件测试可以快速验证路由和主题逻辑，但不会启动真实浏览器。Playwright 从用户使用应用的角度检查完整页面，因此继续验证首页加载、导航链接、未知 URL，以及主题选择能否在刷新后保留。

浏览器测试不再只针对首页，删除旧的只针对首页的测试文件：

```bash
rm tests/e2e/home.spec.ts
```

新建浏览器测试 `tests/e2e/app-shell.spec.ts`。

新的 E2E 测试覆盖四个真实行为：打开首页、通过导航进入 Methodology、直接访问未知 URL，以及切换主题后刷新页面。根据这些行为，写入：

```ts
import { expect, test } from "@playwright/test";

/* --------- 浏览器测试场景 -------- */

/* --------- 测试 1：首页元数据与可见内容 -------- */
test("loads the application shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Home | RoostMap");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /make clearer rental decisions/i,
    }),
  ).toBeVisible();
});

/* --------- 测试 2：导航更新地址与页面 -------- */
test("navigates to the methodology page", async ({ page }) => {
  await page.goto("/");

  // Target the exact link inside the primary navigation.
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Methodology", exact: true })
    .click();

  await expect(page).toHaveURL(/\/methodology$/);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "How RoostMap interprets rental areas",
    }),
  ).toBeVisible();
});

/* --------- 测试 3：直接访问未知地址显示未找到页面 -------- */
test("shows the not-found page for an unknown URL", async ({ page }) => {
  await page.goto("/unknown-page");

  await expect(page).toHaveTitle("Page not found | RoostMap");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Page not found",
    }),
  ).toBeVisible();
});

/* --------- 测试 4：明确选择的主题在刷新后保留 -------- */
test("persists an explicit theme choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  const switchToDark = page.getByTitle("Switch to dark theme");
  await switchToDark.click();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByTitle("Switch to light theme")).toBeVisible();
});

```

这些测试验证页面行为和主题状态，不检查 Tailwind class、像素位置或具体颜色，避免正常调整视觉样式时产生无意义的测试失败。

完成后单独运行端到端测试：

```bash
npm run test:e2e
```

预期 Playwright 启动 Chromium，四个浏览器测试全部通过，并在结束后自动停止开发服务器。

### 10. 验证应用外壳

现在 UI、路由、主题、错误处理和测试已经形成完整链路，可以执行统一质量检查：

```bash
npm run check
```

预期依次通过：

```text
ESLint
Vitest route and theme tests
TypeScript + production build
Playwright browser tests
```

自动检查通过后，启动开发服务器：

```bash
npm run dev
```

依次访问：

```text
/
→ Home 页面和共享布局

/methodology
→ Methodology 页面和共享布局

/unknown-page
→ Not Found 页面
```

使用浏览器开发工具检查 390px、768px 和桌面宽度，确认 Header、主题按钮、内容区域和 Footer 没有重叠、截断或水平滚动。再切换一次主题并刷新页面，确认所有现有页面使用同一主题且明确选择能够保留。

### 11. 更新 README 项目状态

验证全部通过后，README 应直接记录 Step 04 已经实现的结果。将 `Current status` 更新为：

```markdown
## Current status

The React application foundation, automated test foundation and responsive product shell are in place.

The application currently includes client-side routing for Home and Methodology, shared Header, Main and Footer structure, unknown-route and route-error handling, a system-aware light and dark theme with saved user preference, Tailwind CSS design tokens, and project-owned shadcn/ui components. The complete local quality check covers linting, component tests, the production build and Playwright browser tests.
```

README 的其他内容继续保留。

### 12. Git 提交

代码、测试、浏览器检查和 README 状态一致后，提交本步成果：

```bash
git add .
git commit -m "feat: establish application shell"
git push -u origin feat/app-shell
```

Pull Request 记录：

- Tailwind CSS 和 shadcn/ui 已配置；
- 设计 token、响应式应用外壳和明暗主题切换已建立；
- Home、Methodology、404 和页面错误边界已建立；
- 路由、主题工具、主题组件和浏览器测试已加入；
- `npm run check` 已通过。

完成检查后 squash merge，并同步本地 `main`：

```bash
git checkout main
git pull --ff-only
git branch -D feat/app-shell
```

### Step 04 完成状态

```text
✅ 已从 main 创建 feat/app-shell 分支
✅ Tailwind CSS Vite 插件已经配置
✅ shadcn/ui 已初始化并加入当前需要的组件
✅ 基础视觉 token 和页面布局规则已经建立
✅ 首次访问跟随系统主题，用户可以明确切换并保存 light 或 dark
✅ AppShell 和 RootLayout 已建立
✅ Home、Methodology 和 Not Found 页面已建立
✅ React Router 和页面标题已经配置
✅ 404 与页面错误边界已经建立
✅ 桌面与移动端布局可用
✅ 路由、主题工具、主题组件和 Playwright 测试已更新
✅ npm run check 通过
✅ README 已记录 Step 04 完成后的状态
✅ 应用外壳已通过 Pull Request 合并到 main
```

## Step 05 · 建立 CI/CD 与首次公网部署

### 这一步做什么

Step 04 完成后，RoostMap 已经可以在本地执行完整质量检查：

```text
ESLint
→ 组件测试
→ Production build
→ Playwright 浏览器测试
```

但是，本地环境通过的质量检查并不能保证真实产品的质量。因此，需要把这套本地检查逐步扩展成真实交付流程， 即CI/CD。

完整的流程如下：

```text
本地质量检查（已完成）
→ 推送功能分支
→ Pull Request 自动检查
→ 保存通过检查的构建产物
→ 部署 Azure Preview
→ 测试真实 Preview
→ 建立合并门禁
→ 合并 main
→ 部署并测试 Production
→ 清理分支
```

整个流程包含手动操作和自动执行部分。所有自动执行的 GitHub Actions 流程都以 workflow YAML 为入口，但完整 CI/CD 还共同依赖项目脚本、测试代码、Playwright 配置、Azure 配置、GitHub 设置和手动操作。

这个流程包含四个不同角色：

| 角色 | 职责 |
|---|---|
| 开发者 | 本地开发、运行检查、推送代码、创建 PR、查看结果并决定是否合并 |
| GitHub 平台 | 保存仓库、Pull Request、检查状态和合并记录 |
| GitHub-hosted runner | 在临时远程电脑中安装依赖、运行测试、构建和上传产物 |
| Azure Static Web Apps | 接收构建产物并托管 Preview 与 Production |

Pull Request 和 GitHub Actions 是 GitHub 中的流程和记录。真正执行命令的是 GitHub Actions 创建的临时 runner。每个 job 通常使用一台新的 runner，job 结束后运行环境会被销毁。

### 1. 建立交付分支与本地起点

`main` 保存 Step 04 已经通过检查的稳定状态。CI workflow、Azure 配置和远程测试会在验证完成前持续变化，因此本步使用独立的 `ci/initial-delivery` 分支承载这些修改。

从最新的 `main` 创建分支：

```bash
git checkout main
git pull --ff-only
git checkout -b ci/initial-delivery
```

GitHub 后面会在远程 runner 中重复项目现有的质量检查。先在本地执行同一条命令，可以确认代码本身处于稳定状态，也为排查远程环境问题提供对照。

运行：

```bash
npm run check
```

检查应依次完成：

```text
npm run lint
→ npm run test
→ npm run build
→ npm run test:e2e
```

四项检查全部通过后，当前分支具备建立远程自动化的可靠起点。

### 2. 让 GitHub 接收 Pull Request 事件

功能分支完成开发并通过本地检查后，下一步是把它合并到 `main`。`main` 保存稳定的产品代码，新代码在进入 `main` 之前必须再次经过质量检查，避免未经验证的修改影响后续部署。

Pull Request 为这次合并提供了一个独立的审查阶段。分支代码此时还没有进入 `main`，但 GitHub 可以在 PR 中展示代码差异、运行自动检查，并根据检查结果决定是否允许合并。

那么GitHub怎么知道PR 创建后应该执行什么自动化操作？？

这就需要GitHub Actions workflow， 这些workflow用来制定自动化规则，比如：当目标分支为 `main` 的 Pull Request 被创建或更新时，启动 Quality job，对准备合并的代码执行质量检查......

完整的流程是：

```text
准备把功能分支合并到 main
→ 合并前需要质量检查
→ 使用 Pull Request 建立合并前的审查阶段
→ 编写 workflow 定义自动检查规则
→ PR 创建或更新时启动 Quality job
→ 检查结果显示在 Pull Request
```

GitHub Actions 会读取 `.github/workflows` 目录中的 YAML 文件。每个 YAML 文件定义一个 workflow，其中可以包含触发条件、需要执行的 job、job 之间的依赖关系，以及 job 内依次执行的 step。

一个GitHub Actions workflow 的基本结构如下：

```yaml
# workflow 的显示名称
name: <workflow 名称>

# workflow 的触发事件
on:
  <pull_request 或 push>:
    branches:
      - <目标分支>
    types:
      - <事件类型>

# workflow 访问仓库的权限
permissions:
  contents: read

# workflow 触发后执行的任务
jobs:
  <job 标识>:

    # ==================== Job 层 ====================
    name: <job 名称>
    if: <运行条件>
    needs:
      - <前置 job 标识>
    # job 使用的 GitHub runner
    runs-on: ubuntu-latest
    # 向后续 job 提供执行结果
    outputs:
      <输出名称>: <输出表达式>
    # 当前 job 使用的环境变量
    env:
      <变量名称>: <变量值>
      
    # ==================== step 层 ====================  
    # job 中按顺序执行的步骤
    steps:
      - name: <步骤名称>
        # step 标识，用于读取它产生的输出
        id: <step 标识>
        if: <运行条件>
        # 调用现成的 GitHub Action
        uses: <Action 名称和版本>
        # 向 Action 传递参数
        with:
          <参数名称>: <参数值>

      - name: <执行项目命令>
        # 直接在 runner 中执行命令
        run: <Shell 命令>
```

它可以按三层理解：

```
Workflow
├── name：整个 workflow 的显示名称
│
├── on：workflow 的触发条件
│   └── pull_request 或 push：触发事件
│       ├── branches：限制目标分支
│       └── types：限制事件的具体类型
│
├── permissions：workflow 访问 GitHub 资源的权限
│   └── contents: read：只允许读取仓库代码
│
└── jobs：workflow 触发后需要执行的任务
    └── Job
        ├── job 标识：job 在 YAML 中的唯一名称
        ├── name：job 的显示名称
        ├── if：满足什么条件才执行
        ├── needs：等待哪些前置 job 成功完成
        ├── runs-on：使用哪种 GitHub runner
        ├── outputs：向后续 job 提供什么结果
        ├── env：当前 job 使用的环境变量
        
        └── steps：按照顺序执行的步骤
            ├── Step：调用现成的 GitHub Action
            │   ├── name：step 的显示名称
            │   ├── id：step 的唯一标识
            │   ├── if：满足什么条件才执行
            │   ├── uses：调用哪个 Action
            │   └── with：向 Action 传递哪些参数
            │
            └── Step：直接执行项目命令
                ├── name：step 的显示名称
                └── run：在 runner 中执行 Shell 命令
```

先创建 workflow 目录：

```bash
mkdir -p .github/workflows
```

创建Pull Request事件的workflow `.github/workflows/pull-request.yml`，先定义 workflow 的名称、触发条件和权限：

```yaml
name: Pull Request Delivery

# 当目标分支为 main 的 Pull Request 发生指定事件时启动 workflow
on:
  pull_request:
    branches:
      - main
    types:
      # 第一次创建 Pull Request
      - opened
      # Pull Request 打开期间，功能分支收到新的提交
      - synchronize
      # 已关闭的 Pull Request 被重新打开
      - reopened

# 当前 workflow 只需要读取仓库代码
permissions:
  contents: read

# 实际执行质量检查的 job 
jobs:
  ...
```

其中字段`pull_request` 是把 PR 设为 workflow 的触发入口，`branches: main` 将范围限制为准备合并到 `main` 的 PR。三种事件分别覆盖：首次创建 PR、继续向 PR 分支推送提交，以及重新打开 PR。

字段`permissions` 控制 workflow 获得的仓库权限。当前阶段只需要读取代码，因此只授予 `contents: read`，不增加写入权限。

此时只是建立了 workflow 的入口可以执行的任务在`jobs` 里

### 3. 加入 Quality job 并运行第一次 CI

上面通过 `on` 确定了 workflow 在什么时候启动，但当前 `jobs` 还是空的，GitHub 还不知道触发后需要执行什么任务。现在需要把本地已经能够运行的质量检查交给 GitHub，让每次准备合并到 `main` 的代码都在独立环境中重新验证。

这里的 CI 并不是增加另一套检查，而是让 GitHub runner 自动重复项目现有的 `npm run check`：

```text
Pull Request 触发 workflow
→ GitHub 创建 Quality job
→ GitHub 为 job 分配临时 runner
→ runner 按照 steps 的顺序准备环境并执行 npm run check
→ 检查结果显示在 Pull Request
```

`Quality` job 代表一次完整的质量检查任务。`runs-on` 决定它使用哪种 runner，`steps` 则记录 runner 从取得代码到完成检查的操作顺序。这里选择 GitHub 提供的临时 Ubuntu runner；每次运行都会从干净环境开始，任务结束后该环境也会被释放。

先在 `jobs` 下建立 `quality` job，并为它指定运行环境：

```yaml
  quality:
    name: Quality
    runs-on: ubuntu-latest

    steps:
```

新 runner 中还没有项目代码，也没有项目要求的 Node.js 环境。因此，前两个 step 先把当前 Pull Request 接受检查的代码放入 runner，再配置 Node.js 24：

```yaml
      - name: Check out pull request
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
```

`uses` 表示调用现成的 GitHub Action。`checkout` 负责取得仓库代码，`setup-node` 负责安装并启用指定的 Node.js 版本。`with` 用于向 Action 传递参数，这里同时启用 npm 下载缓存，以减少后续运行重复下载依赖所需的时间。

有了代码和 Node.js，runner 仍然缺少项目依赖以及 Playwright 实际使用的浏览器。接下来的两个 step 按照 `package-lock.json` 安装依赖，再安装 Chromium 和它在 Ubuntu 中需要的系统依赖：

```yaml
      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: npx playwright install --with-deps chromium
```

`run` 表示直接在 runner 中执行 Shell 命令。CI 使用 `npm ci`，可以根据已经提交的 lockfile 重建确定的依赖环境。Playwright npm 包和浏览器程序相互独立，所以 Chromium 需要单独安装。

此时 runner 已经具备与项目检查相符的运行条件。最后执行 `npm run check`，依次完成 lint、组件测试、build，以及针对 runner 中启动的应用执行的 E2E 测试：

```yaml
      - name: Run complete quality check
        run: npm run check
```

完成后的 `.github/workflows/pull-request.yml` 如下：

```yaml
# workflow 在 GitHub Actions 页面和 Pull Request 中显示的名称
name: Pull Request Delivery

# 当目标分支为 main 的 Pull Request 被创建或更新时启动
on:
  pull_request:
    branches:
      - main
    types:
      # 第一次创建 Pull Request
      - opened
      # Pull Request 打开期间，功能分支收到新的提交
      - synchronize
      # 已关闭的 Pull Request 被重新打开
      - reopened

# Quality job 只需要读取仓库代码
permissions:
  contents: read

jobs:
  # 在独立 runner 中重复项目的完整质量检查
  quality:
    name: Quality
    runs-on: ubuntu-latest

    # runner 按照从上到下的顺序执行这些步骤
    steps:
      # 把当前 Pull Request 接受检查的代码放入 runner
      - name: Check out pull request
        uses: actions/checkout@v7

      # 配置项目使用的 Node.js，并启用 npm 下载缓存
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      # 按照 package-lock.json 安装项目依赖
      - name: Install dependencies
        run: npm ci

      # 安装 Playwright E2E 测试所需的浏览器和系统依赖
      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      # 执行 lint、组件测试、build 和 E2E 测试
      - name: Run complete quality check
        run: npm run check
```

workflow 现在已经具备第一条可运行的 CI。提交并推送配置：

```bash
git add .github/workflows/pull-request.yml
git commit -m "ci: add pull request quality check"
git push -u origin ci/initial-delivery
```

通过 GitHub 网页创建从当前分支到 `main` 的 Pull Request：

```text
ci/initial-delivery
→ main
```

创建 PR 会产生 `opened` 事件。GitHub 读取 `pull-request.yml`，创建 Quality job，并让远程 runner 依次执行前面定义的 steps。

在 Pull Request 的 Checks 区域或仓库的 Actions 页面可以看到执行过程：

```text
Check out pull request
→ Set up Node.js
→ Install dependencies
→ Install Chromium
→ Run complete quality check
```

第一次 CI 需要确认：

- runner 使用 Node.js 24；
- `npm ci` 成功安装 lockfile 中记录的依赖；
- lint、组件测试、build 和 runner 内的 E2E 测试全部通过；
- Quality 结果显示在当前 Pull Request 中。

只要 PR 保持打开，继续向 `ci/initial-delivery` 推送提交就会产生 `synchronize` 事件，GitHub 随后自动重新运行 Quality job。至此，合并前的自动质量检查已经建立。

### 4. 保存 Quality job 产生的文件

第一次 CI 已经证明 Quality job 可以在远程 runner 中完成 `npm run check`。其中的 build 会生成可部署的 `dist`，这个目录就是刚刚通过质量检查的前端版本。

后续需要把同一个 `dist` 部署成 Preview。但是，每个 job 通常使用独立的 runner；Quality job 结束后，当前 runner 和它的临时文件系统都会被释放。以后建立的 Deploy job 无法直接读取这台 runner 中的文件，也就无法取得刚刚通过检查的 `dist`。

因此，在 Quality job 结束前，需要把仍有价值的文件交给 GitHub Actions 临时保存。GitHub Actions 把这种由 workflow 产生并保存的文件称为 artifact。前一个 job 可以上传 artifact，后一个 job 再通过名称下载它。

这条构建产物传递流程是：

```text
Quality job 执行 build
→ runner 生成 dist
→ 上传为 frontend-dist artifact
→ GitHub Actions 临时保存
→ 后续 Deploy job 下载并部署
```

先在 `Run complete quality check` 后加入上传步骤。只有前面的完整质量检查成功，这个 step 才会继续执行：

```yaml
      - name: Upload frontend build
        uses: actions/upload-artifact@v7
        with:
          name: frontend-dist
          path: dist
          if-no-files-found: error
          retention-days: 1
```

其中`name` 是后续 job 下载 artifact 时使用的名称，`path` 指向需要保存的 `dist`。如果 build 没有正确生成该目录，`if-no-files-found: error` 会让 job 失败，避免后续部署一个不存在的构建结果。这个 artifact 只用于当前 workflow 的 Preview 部署，保留一天已经足够。

runner 中还可能产生另一类有价值的文件：Playwright 的失败报告和 trace。它们不参与部署，而是在 E2E 测试失败时帮助开发者查看浏览器测试过程。因此，Quality job 的两种结果需要分别处理：

```text
Quality 成功
→ 保存 frontend-dist
→ 供后续 Deploy job 使用

Quality 失败
→ 不保存部署产物
→ 尝试保存 Playwright 报告
→ 供开发者排查错误
```

在 Quality job 最后加入失败诊断上传步骤：

```yaml
      - name: Upload Playwright diagnostics
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-quality-report
          path: playwright-report
          if-no-files-found: ignore
          retention-days: 7
```

`if: failure()` 表示只有前面的 step 失败时才尝试上传报告。失败可能发生在 lint、组件测试或 build 阶段，此时 Playwright 尚未运行，`playwright-report` 可能不存在，所以这里使用 `if-no-files-found: ignore`，保留原本的失败原因，不再制造第二个错误。诊断报告需要留出排查时间，因此保存七天。

加入两类 artifact 后，完整的 `.github/workflows/pull-request.yml` 如下：

```yaml
# workflow 在 GitHub Actions 页面和 Pull Request 中显示的名称
name: Pull Request Delivery

# 当目标分支为 main 的 Pull Request 被创建或更新时启动
on:
  pull_request:
    branches:
      - main
    types:
      # 第一次创建 Pull Request
      - opened
      # Pull Request 打开期间，功能分支收到新的提交
      - synchronize
      # 已关闭的 Pull Request 被重新打开
      - reopened

# Quality job 只需要读取仓库代码
permissions:
  contents: read

jobs:
  # 在独立 runner 中重复项目的完整质量检查
  quality:
    name: Quality
    runs-on: ubuntu-latest

    # runner 按照从上到下的顺序执行这些步骤
    steps:
      # 把当前 Pull Request 接受检查的代码放入 runner
      - name: Check out pull request
        uses: actions/checkout@v7

      # 配置项目使用的 Node.js，并启用 npm 下载缓存
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      # 按照 package-lock.json 安装项目依赖
      - name: Install dependencies
        run: npm ci

      # 安装 Playwright E2E 测试所需的浏览器和系统依赖
      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      # 执行 lint、组件测试、build 和 E2E 测试
      - name: Run complete quality check
        run: npm run check

      # 保存通过检查的 dist，供后续 Deploy job 下载
      - name: Upload frontend build
        uses: actions/upload-artifact@v7
        with:
          name: frontend-dist
          path: dist
          if-no-files-found: error
          retention-days: 1

      # 检查失败时保存 Playwright 报告，供开发者排查
      - name: Upload Playwright diagnostics
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-quality-report
          path: playwright-report
          if-no-files-found: ignore
          retention-days: 7
```

提交并推送这次增量修改：

```bash
git add .github/workflows/pull-request.yml
git commit -m "ci: preserve pull request build"
git push
```

当前 PR 已经打开，因此 push 会产生 `synchronize` 事件并重新运行 Quality job。这一次除了原有检查，还会在成功后上传 `frontend-dist`。

Quality 再次通过后，在本次 workflow 运行结果的 Artifacts 区域确认：

- 出现名为 `frontend-dist` 的 artifact；
- artifact 来自当前这次 workflow 运行；
- Quality job 保持成功状态；
- 没有生成 `playwright-quality-report`，因为本次检查没有失败。

这个结果证明，通过检查的 `dist` 已经离开即将释放的 Quality runner，并由 GitHub Actions 暂时保存。下一步建立部署任务时，新的 runner 就可以下载并使用它。

### 5. 准备 Azure 部署目标

Quality job 已经能够生成并保存 `frontend-dist`，但后续 Deploy job 还不能直接运行。一次真实部署还需要三个条件：构建产物包含 Azure 的运行规则、Azure 中存在接收文件的 Static Web Apps 资源，以及 GitHub runner 拥有向该资源上传文件的凭据。

```text
frontend-dist 已准备好
→ 补充 Azure 运行规则
→ 创建 Azure Static Web Apps 资源
→ 把 Deployment Token 安全交给 GitHub Actions
→ 建立 Deploy job
```

先处理构建产物需要携带的运行规则。RoostMap 使用 React Router，`/methodology` 是前端路由，构建目录中并不存在 `methodology.html`。在应用内部点击链接时，React Router 可以直接切换页面；如果用户在浏览器中直接打开或刷新 `/methodology`，请求会先到达 Azure，Azure 应该必须先返回 `index.html`，React 启动后才能根据当前地址显示 Methodology 页面。

流程顺序是这样：

```text
浏览器请求 /methodology
→ Azure 返回 /index.html
→ React 应用启动
→ React Router 读取 /methodology
→ 显示 Methodology 页面
```

这条页面回退规则需要由 `staticwebapp.config.json` 提供，而且该文件最终必须位于部署目录 `dist` 的根部。Vite 会把 `public` 目录中的文件原样复制到 `dist`，因此先创建当 `public` 目录，用于放置这些文件：

```bash
mkdir -p public
```

创建回退规则配置文件 `public/staticwebapp.config.json` ：

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*"]
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }
}
```

`navigationFallback` 把没有对应静态文件的页面地址交给 `index.html`。`/assets/*` 保存 Vite 构建出的 JavaScript 和 CSS 文件，这些请求应继续按真实静态文件处理。`globalHeaders` 为 Azure 返回的资源增加基础响应头，避免浏览器猜测错误的内容类型，并限制跨站请求携带的来源信息。

重新构建，确认配置文件确实进入部署产物：

```bash
npm run build
ls dist/staticwebapp.config.json
```

文件流向应该是：

```text
public/staticwebapp.config.json
→ Vite build
→ dist/staticwebapp.config.json
```

本地构建产物现在已经具备 Azure 需要的页面规则，接下来准备真正接收它的云端资源。

在 Azure Portal 创建一个 Static Web Apps 资源，并把部署来源选择为 `Other`。这里选择 `Other`，是因为 RoostMap 已经在仓库中自行建立 GitHub Actions workflow，不需要 Azure 另外生成或修改 workflow。

创建资源只是在 Azure 中建立一个空的托管目标，并不会自动读取 GitHub 仓库，也不会立即发布当前应用。资源创建完成后，后续 runner 仍然需要使用 Deployment Token 才能向它上传 `dist`。

在新建的 Static Web Apps 资源 Overview 页面选择 **Manage deployment token**，复制 Deployment Token。然后进入 GitHub 仓库：

```text
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

使用下面的名称保存 token：

```text
AZURE_STATIC_WEB_APPS_API_TOKEN
```

Repository secret 会加密保存 token。workflow 以后只能在 runner 运行时通过 secret 名称读取它，页面和日志不会显示原始值。它在部署流程中的作用是：

```text
Azure Static Web Apps 生成 Deployment Token
→ GitHub Repository Secret 加密保存
→ Deploy runner 在运行时读取
→ Azure 验证 token 后接收 dist
```

真实 token 不写入项目文件、`.env.example`、workflow 明文、README 或学习笔记。GitHub 的 Secrets 页面只需要确认 `AZURE_STATIC_WEB_APPS_API_TOKEN` 已存在，不需要也无法再次查看它的完整值。

现在建立 Deploy job 所需的三个条件已经齐备：

- `dist` 中包含 `staticwebapp.config.json`；
- Azure 中已经存在 RoostMap 的 Static Web Apps 资源；
- GitHub Actions 已经可以通过 repository secret 取得部署凭据。

此时 Azure 资源仍然是等待接收文件的部署目标。真正的 Preview 上传需要有新的 Deploy job 完成。

### 6. 把通过检查的 dist 部署成 Preview

现在，部署所需的构建产物、Azure 目标和访问凭据都已经准备完成。下一步要把它们连接起来，让 Pull Request 每次通过 Quality 后都产生一个可以在浏览器中访问的 Preview。

这次部署仍然属于同一个 `pull-request.yml` workflow，但部署和质量检查承担不同职责，因此使用两个 job：

```text
Quality job
→ 构建并检查应用
→ 上传 frontend-dist

Deploy job
→ 等待 Quality 成功
→ 下载 frontend-dist
→ 上传到 Azure Preview
→ 返回 Preview URL
```

先在 `jobs` 下建立与 `quality` 同级的 `deploy` job。`needs` 表示 Deploy 依赖 Quality；只有 Quality 成功结束，GitHub 才会创建并运行后续部署任务。

```yaml
  deploy:
    name: Deploy
    needs:
      - quality
    runs-on: ubuntu-latest

    steps:
```

这种依赖关系把质量检查变成部署前提：

```text
Quality 成功
→ Deploy 运行

Quality 失败
→ Deploy 跳过
→ 未通过检查的代码不会进入 Azure
```

Deploy job 使用一台新的临时 runner，因此它看不到 Quality runner 中的 `dist`。不过，第 4 小节已经把该目录保存为 `frontend-dist` artifact。Deploy 的第一个 step 使用相同名称下载它，并在当前 runner 中还原为 `dist`：

```yaml
      - name: Download frontend build
        uses: actions/download-artifact@v8
        with:
          name: frontend-dist
          path: dist
```

这一步没有重新构建应用。Deploy runner 获得的是 Quality job 已经检查过的同一份构建结果：

```text
GitHub Actions 中的 frontend-dist
→ Download frontend build
→ Deploy runner 的 dist/
```

取得 `dist` 后，调用 Azure Static Web Apps 官方 Deploy Action 上传文件：

```yaml
      - name: Deploy preview
        id: deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: dist
          skip_app_build: true
```

这组参数分别解决不同问题：

- `azure_static_web_apps_api_token`：在运行时读取 repository secret，证明 runner 有权向当前 Azure 资源上传文件；
- `action: upload`：本次操作是上传应用，而不是关闭 Preview；
- `app_location: dist`：需要上传的文件就在当前 runner 的 `dist`；
- `skip_app_build: true`：跳过 Azure 自带的构建过程，直接部署已经通过 Quality 的产物；

Deploy Action 成功后会产生 `static_web_app_url`。后面的远程 E2E job 需要使用这个真实地址，因此给 Deploy step 设置 `id: deploy`，再把它的 URL 提升为当前 job 的输出：

```yaml
  deploy:
    name: Deploy
    needs:
      - quality
    runs-on: ubuntu-latest

    outputs:
      preview_url: ${{ steps.deploy.outputs.static_web_app_url }}
```

表达式的读取路径是：

```text
id 为 deploy 的 step
→ static_web_app_url
→ Deploy job 的 preview_url
→ 后续 job 可以通过 needs.deploy.outputs.preview_url 读取
```

加入 Deploy job 后，完整的 `.github/workflows/pull-request.yml` 如下：

```yaml
# workflow 在 GitHub Actions 页面和 Pull Request 中显示的名称
name: Pull Request Delivery

# 当目标分支为 main 的 Pull Request 被创建或更新时启动
on:
  pull_request:
    branches:
      - main
    types:
      # 第一次创建 Pull Request
      - opened
      # Pull Request 打开期间，功能分支收到新的提交
      - synchronize
      # 已关闭的 Pull Request 被重新打开
      - reopened

# 当前 workflow 只需要读取仓库代码
permissions:
  contents: read

jobs:
  # 先在独立 runner 中执行完整质量检查
  quality:
    name: Quality
    runs-on: ubuntu-latest

    steps:
      - name: Check out pull request
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      - name: Run complete quality check
        run: npm run check

      # 保存通过检查的 dist，供 Deploy job 下载
      - name: Upload frontend build
        uses: actions/upload-artifact@v7
        with:
          name: frontend-dist
          path: dist
          if-no-files-found: error
          retention-days: 1

      # 检查失败时保存 Playwright 报告
      - name: Upload Playwright diagnostics
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-quality-report
          path: playwright-report
          if-no-files-found: ignore
          retention-days: 7

  # Quality 成功后，把同一份 dist 部署成 Azure Preview
  deploy:
    name: Deploy
    needs:
      - quality
    runs-on: ubuntu-latest

    # 把 Azure 返回的地址提供给后续远程测试 job
    outputs:
      preview_url: ${{ steps.deploy.outputs.static_web_app_url }}

    steps:
      # 从当前 workflow 下载 Quality 保存的构建产物
      - name: Download frontend build
        uses: actions/download-artifact@v8
        with:
          name: frontend-dist
          path: dist

      # 使用 Deployment Token 把已有 dist 上传到 Azure
      - name: Deploy preview
        id: deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: dist
          skip_app_build: true
```

提交 Azure 配置和 Deploy job：

```bash
git add public/staticwebapp.config.json
git add .github/workflows/pull-request.yml
git commit -m "ci: deploy pull request preview"
git push
```

当前 PR 已经打开，push 会产生 `synchronize` 事件。新的 workflow 运行应形成下面的依赖关系：

```text
Quality
→ Deploy
```

运行完成后依次确认：

- Quality 成功并上传 `frontend-dist`；
- Deploy 在 Quality 之后启动；
- `Download frontend build` 成功把 artifact 还原到 `dist`；
- `Deploy preview` 成功完成上传；
- Deploy 日志或 Azure Static Web Apps 的 Environments 页面出现 Preview URL；
- 浏览器可以打开 Preview 首页；
- 直接打开或刷新 Preview 的 `/methodology` 仍能正常显示页面。

最后一项同时验证 `staticwebapp.config.json` 已随 `dist` 部署，并且 Azure 正确执行了 SPA 页面回退。此时 Preview 已经可以人工访问，后面再让 Playwright 自动测试这个真实地址。

### 7. 使用 Playwright 测试真实 Preview

Deploy job 成功后，Azure 已经生成可以访问的 Preview。接下来需要使用现有 E2E 测试验证这个真实部署结果，确认应用在 Azure 中仍能正常加载和跳转。

整个过程沿用前面已经建立的 job 依赖关系：

```text
Deploy job 完成部署
→ 取得 Azure 返回的 Preview URL
→ 把 URL 传给新的浏览器测试 job
→ Playwright 访问 Preview 并执行现有 E2E 测试
```

要完成这条流程，先让 Playwright 能根据运行环境选择测试地址，再由 GitHub Actions 提供本次部署生成的 Preview URL。

#### 7.1 配置 Playwright 测试地址

当前 `playwright.config.ts` 把测试地址固定为 `http://127.0.0.1:5173`，并在测试前启动本地 Vite。这适合本地开发，但无法直接测试已经部署到 Azure 的应用。

我们先约定使用一个环境变量 `PLAYWRIGHT_BASE_URL`专门用来接收Azure部署的地址。这个名称由当前项目自行定义，不是 Node.js、Playwright 或 GitHub 内置的变量。它只负责在执行 E2E 测试时把目标地址传给 Playwright：

```text
本地执行测试
→ 不设置 PLAYWRIGHT_BASE_URL
→ 使用本地地址

GitHub Actions 测试 Preview
→ workflow 设置 PLAYWRIGHT_BASE_URL
→ 使用 Azure Preview URL
```

这样， 原先`playwright.config.ts`配置文件中的项目测试时写死的运行地址，需要按条件选择：

```
有Azure部署地址码??
 - yes -> 将执行GitHub Actions 测试 Preview
 - no  -> 将执行本地测试
```

因此先改造 测试地址的读取：

```ts
import { defineConfig, devices } from "@playwright/test";

// Use the deployed URL when CI provides one; otherwise test the local app.
const deployedBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const localBaseURL = "http://127.0.0.1:5173";

export default defineConfig({
  ...
  use: {
    baseURL: deployedBaseURL || localBaseURL,
    trace: "retain-on-failure",
  },
  projects: [
    ...
  ],
  webServer: {
    ...
  },
});

```

配置文件由 Node.js 执行，因此可以通过 `process.env` 读取当前进程的环境变量。变量未设置时，`deployedBaseURL` 为 `undefined`；GitHub Actions 后面为它提供 Preview URL 时，`deployedBaseURL` 就是对应的远程地址。

测试 Azure Preview 时，应用已经由 Azure 提供，不需要 Playwright 再启动本地 Vite。因此 `webServer` 使用相同条件决定是否启动开发服务器：

```ts
webServer: deployedBaseURL
  ? undefined
  : {
      command: "npm run dev -- --host 127.0.0.1",
      url: localBaseURL,
      reuseExistingServer: true,
    },
```

修改后的完整 `playwright.config.ts` 如下：

```ts
import { defineConfig, devices } from "@playwright/test";

// Use the deployed URL when CI provides one; otherwise test the local app.
const deployedBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const localBaseURL = "http://127.0.0.1:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: deployedBaseURL || localBaseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  // Azure already serves deployed builds, so only start Vite for local tests.
  webServer: deployedBaseURL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1",
        url: localBaseURL,
        reuseExistingServer: true,
      },
});
```

此时 workflow 还没有设置 `PLAYWRIGHT_BASE_URL`，所以会先运行现有本地测试：

```bash
npm run test:e2e
```

Playwright 应继续启动本地 Vite 并完成测试。这一步确认新增的地址选择逻辑没有影响原来的本地测试。

#### 7.2  Preview 部署后运行 E2E

第 6 小节已经把 Azure 返回的地址保存为 Deploy job 的 `preview_url` 输出。现在增加 `deployed-smoke-test` job，让它等待 Deploy 成功，并把该输出赋值给前面约定的 `PLAYWRIGHT_BASE_URL`：

```yaml
  deployed-smoke-test:
    name: Deployed smoke test
    needs:
      - deploy
    runs-on: ubuntu-latest

    env:
      PLAYWRIGHT_BASE_URL: ${{ needs.deploy.outputs.preview_url }}
```

Preview URL 的传递过程如下：

```text
Azure Deploy Action 的 static_web_app_url
→ Deploy job 的 preview_url
→ PLAYWRIGHT_BASE_URL
→ playwright.config.ts 中的 deployedBaseURL
```

`needs: deploy` 规定了执行顺序：只有 Deploy 成功，GitHub 才会启动这个测试 job。

新的 job 使用新的 runner，其中没有项目代码、依赖和浏览器，因此先完成 checkout、依赖安装和 Chromium 安装，然后再执行 E2E 测试：

```yaml
    steps:
      - name: Check out pull request
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      - name: Require deployed URL
        run: |
          if [ -z "$PLAYWRIGHT_BASE_URL" ]; then
            echo "PLAYWRIGHT_BASE_URL is required"
            exit 1
          fi

      - name: Test deployed preview
        run: npm run test:e2e
```

如果 Preview URL 缺失，Playwright 会选择本地地址。`Require deployed URL` 会在这种情况下主动终止任务，避免远程测试错误地变成本地测试。

远程测试失败时，同样保存 Playwright HTML 报告，便于查看失败页面和测试步骤：

```yaml
      - name: Upload Playwright diagnostics
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-deployed-smoke-report
          path: playwright-report
          if-no-files-found: ignore
          retention-days: 7
```

加入 `.github/workflows/pull-request.yml` 的完整 job 如下：

```yaml
  # Deploy 成功后，从 GitHub runner 访问真实的 Azure Preview
  deployed-smoke-test:
    name: Deployed smoke test
    needs:
      - deploy
    runs-on: ubuntu-latest

    # Deploy job 的输出成为 Playwright 测试地址
    env:
      PLAYWRIGHT_BASE_URL: ${{ needs.deploy.outputs.preview_url }}

    steps:
      - name: Check out pull request
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      # URL 缺失时立即失败，避免 Playwright 错误地测试本地 Vite
      - name: Require deployed URL
        run: |
          if [ -z "$PLAYWRIGHT_BASE_URL" ]; then
            echo "PLAYWRIGHT_BASE_URL is required"
            exit 1
          fi

      - name: Test deployed preview
        run: npm run test:e2e

      # 远程测试失败时保存报告，便于定位失败页面和步骤
      - name: Upload Playwright diagnostics
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-deployed-smoke-report
          path: playwright-report
          if-no-files-found: ignore
          retention-days: 7
```

提交 Playwright 配置和 workflow：

```bash
git add playwright.config.ts
git add .github/workflows/pull-request.yml
git commit -m "test: verify deployed previews"
git push
```

Pull Request 收到新提交后，GitHub Actions 应按照下面的依赖关系执行：

```text
Quality
→ Deploy
→ Deployed smoke test
```

在 Pull Request 的 Checks 区域确认三个 job 依次通过。`Deployed smoke test` 中的 Chromium 运行在 GitHub runner，并使用 Azure Preview URL 执行现有 E2E 测试。

### 8. 清理 Preview 并建立合并门禁

当前 Pull Request 已经形成完整的验证流程：Quality 检查代码，Deploy 创建 Azure Preview，Deployed smoke test 再从浏览器验证真实部署结果。不过，这条流程还需要补完两个环节：

- Pull Request 结束后删除对应的临时 Preview；
- 把三个检查变成合并到 `main` 前必须满足的条件。

#### 8.1 完成 Preview 生命周期

当前 workflow 只监听 `opened`、`synchronize` 和 `reopened`。这些事件都发生在 Pull Request 进行期间，用来创建或更新 Preview。Pull Request 被合并或直接关闭时会产生 `closed` 事件，`closed` 事件也可以用来执行一些操作，比如清理 Preview。

先把`closed`事件加入触发类型：

```yaml
on:
  pull_request:
    branches:
      - main
    types:
      - opened
      - synchronize
      - reopened
      - closed
```

加入 `closed` 后，同一个 workflow 既会处理 PR 更新，也会处理 PR 结束。两种事件需要执行不同任务：

```text
opened / synchronize / reopened
→ Quality
→ Deploy
→ Deployed smoke test

closed
→ Close Preview
```

因此，需要给现有三个 job 增加运行条件，来区分不同的任务。 以 Quality 为例：

```yaml
  quality:
    if: github.event.action != 'closed'
    name: Quality
    runs-on: ubuntu-latest
```

Deploy 和 Deployed smoke test 使用相同条件：

```yaml
  deploy:
    if: github.event.action != 'closed'
    name: Deploy
    needs:
      - quality
    runs-on: ubuntu-latest

  deployed-smoke-test:
    if: github.event.action != 'closed'
    name: Deployed smoke test
    needs:
      - deploy
    runs-on: ubuntu-latest
```

这样，PR 结束时不会重新构建、部署或测试应用。

接着增加只处理 `closed` 事件的 `close-preview` job：

```yaml
  # Pull Request 结束后删除对应的 Azure Preview
  close-preview:
    if: github.event.action == 'closed'
    name: Close Preview
    runs-on: ubuntu-latest

    steps:
      - name: Remove preview environment
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: close
```

这个 job 不需要 checkout、下载 `dist` 或安装依赖。`action: close` 不会上传文件，而是根据当前 Pull Request 和 Deployment Token 删除对应的 Azure Preview。

四个 job 的事件分工如下：

```text
PR 创建、重新打开或收到新提交
→ Quality、Deploy、Deployed smoke test 运行
→ Close Preview 跳过

PR 合并或关闭
→ Quality、Deploy、Deployed smoke test 跳过
→ Close Preview 运行
```

提交 Preview 清理配置：

```bash
git add .github/workflows/pull-request.yml
git commit -m "ci: clean up pull request previews"
git push
```

这次 push 产生的是 `synchronize` 事件，因此仍应依次运行 Quality、Deploy 和 Deployed smoke test，Close Preview 显示为跳过。`closed` 分支要等当前 Pull Request 最终被合并或关闭时才会执行。

#### 8.2. 配置 main 合并规则

目前，Pull Request 每次收到新提交后，GitHub Actions 都会运行 Quality、Deploy 和 Deployed smoke test，并把成功或失败结果显示在 Pull Request 中。但是，workflow 只负责执行任务和报告结果，它不会自动规定“检查失败时禁止合并”。

现在需要让 GitHub 仓库根据这些结果控制 `main` 的合并入口：

```text
GitHub Actions
→ 执行三个 job
→ 产生三个检查结果

仓库的 main 合并规则
→ 读取这三个检查结果
→ 全部成功时允许合并
→ 等待或失败时阻止合并
```

GitHub 使用 branch ruleset 管理这类规则。Ruleset 的作用对象是分支；这次只保护 `main`，功能分支仍然可以正常提交和推送。

当前项目需要解决三类问题。第一类是规定代码进入 `main` 的方式。开发代码必须先进入功能分支，再通过 Pull Request 合并，因此启用：

```text
Require a pull request before merging
```

这项规则要求所有进入 `main` 的开发修改都经过 Pull Request。当前项目由自己完成开发和合并，所以不要求其他人审批；Pull Request 在这里承担的是检查入口和合并入口。

第二类是把现有自动检查变成合并条件，因此启用：

```text
Require status checks to pass before merging
```

并指定下面三个 required checks：

```text
Quality
Deploy
Deployed smoke test
```

这些名称来自 workflow 中各个 job 的 `name`：

```yaml
quality:
  name: Quality

deploy:
  name: Deploy

deployed-smoke-test:
  name: Deployed smoke test
```

GitHub Actions 运行 job 后产生同名检查，Ruleset 再根据这些检查的状态决定 Pull Request 能否合并。三个名称已经在当前 Pull Request 中实际出现，因此可以在 Ruleset 中选择。

第三类是保护 `main` 的提交历史。项目采用 Squash Merge，每个 Pull Request 最终在 `main` 中形成一个提交，因此启用：

```text
Require linear history
```

同时限制删除和强制推送：

```text
Restrict deletions
Block force pushes
```

这两项规则防止 `main` 被删除，也防止已经进入 `main` 的提交历史被强制改写。

配置完成后，一次功能提交的合并过程如下：

```text
功能分支 push 新提交
→ Pull Request 触发 workflow
→ Quality、Deploy、Deployed smoke test 进入等待或运行状态
→ Ruleset 暂时阻止合并

三个检查全部成功
→ Ruleset 满足
→ 可以执行 Squash Merge

任意检查失败
→ Ruleset 不满足
→ Pull Request 不能合并
```

明确这些规则的作用后，再进入当前 GitHub 仓库完成配置：

```text
Settings
→ Rules
→ Rulesets
→ New ruleset
→ New branch ruleset
```

先设置 Ruleset 的基本信息：

```text
Ruleset name: Protect main
Enforcement status: Active
Target branches: Include default branch
```

当前仓库的 default branch 是 `main`，因此这个目标只把规则应用到 `main`。

然后启用前面已经确定的规则：

```text
Restrict deletions
Require a pull request before merging
Require status checks to pass before merging
Require linear history
Block force pushes
```

在 `Require status checks to pass before merging` 中依次添加：

```text
Quality
Deploy
Deployed smoke test
```

确认 Ruleset 的目标分支和检查名称后，创建并启用规则。之后每次向当前功能分支 push，Pull Request 都会先显示检查正在运行，合并入口暂时不可用；三个检查全部成功后，合并入口才会恢复。

不需要故意破坏测试来验证规则。下一次正常提交就会经历“等待检查 → 检查通过 → 允许合并”的完整过程。

Preview 清理配置和 `main` Ruleset 完成后，Pull Request 的创建、更新、合并限制和临时环境清理已经连接成完整流程。

参考：[Azure Static Web Apps build configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration)、[GitHub rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)

### 9. 建立 Production 自动部署

Pull Request workflow 已经负责合并前的质量检查和 Preview 验证。三个 required checks 全部成功后，功能分支才可以通过 Squash Merge 进入 `main`。代码进入 `main` 后，需要启动另一条流程，把这个正式提交发布到 Azure Production。

两条 workflow 的职责由此分开：

```text
Pull Request Delivery
→ 在合并前检查功能分支
→ 部署并测试临时 Preview

Production Delivery
→ 在合并后读取 main 的正式提交
→ 重新构建并部署 Production
→ 测试真实 Production
```

Production 不能直接使用 PR workflow 中保存的 `dist`。那份 artifact 属于合并前的功能分支运行；正式部署应从合并后的 `main` 提交重新生成构建结果，确保 Azure 中运行的内容对应 `main` 当前状态。

因此，需要创建独立的 `.github/workflows/production.yml`。

#### 9.1 构建并部署 main

Production 发布的起点是 `main` 收到新提交。当前项目通过 Squash Merge 更新 `main`，合并完成后 GitHub 会产生一次针对 `main` 的 `push` 事件：

```text
Squash Merge 完成
→ main 出现新的 Squash Commit
→ push 事件触发 Production Delivery
```

先定义 workflow 名称、触发事件和仓库权限：

```yaml
name: Production Delivery

on:
  push:
    branches:
      - main

permissions:
  contents: read
```

`branches: main` 把这条 workflow 限定为正式分支发布。功能分支的普通 push 不会触发它。

Production deploy job 使用新的 runner，因此需要重新取得 `main` 代码并安装依赖：

```yaml
jobs:
  deploy:
    name: Production deploy
    runs-on: ubuntu-latest

    steps:
      - name: Check out main
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci
```

PR required checks 已经完成 lint、组件测试、构建和本地 E2E。代码进入 `main` 后不再重复整套合并前检查，但必须从正式提交重新执行构建：

```yaml
      - name: Build production application
        run: npm run build
```

`npm run build` 会依次执行 `tsc -b` 和 `vite build`。任何 TypeScript 或构建错误都会终止当前 job，Azure 不会收到不完整的 `dist`。

构建成功后，runner 中已经产生新的 `dist`。Deploy Action 直接把这个目录上传到 Azure：

```yaml
      - name: Deploy production
        id: deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: dist
          skip_app_build: true
```

这里仍然使用前面保存的 Deployment Token。`skip_app_build: true` 表示 Azure 不再重复构建，直接发布当前 runner 生成的 `dist`。

这条 workflow 只由 `main` 的 push 触发，因此上传操作对应 Production，不需要再传入 `production_branch`。Deploy step 成功后会返回正式站点 URL，后续浏览器测试需要读取它，所以把 URL 提升为 job output：

```yaml
  deploy:
    name: Production deploy
    runs-on: ubuntu-latest

    outputs:
      production_url: ${{ steps.deploy.outputs.static_web_app_url }}
```

Production deploy job 的过程是：

```text
读取 main 的 Squash Commit
→ npm ci 安装锁定版本的依赖
→ npm run build 生成 dist
→ 上传 dist 到 Azure Production
→ 输出 production_url
```

#### 9.2 验证 Production

Production deploy 成功只能证明文件已经上传。还需要从 GitHub runner 启动 Chromium，访问正式地址并执行现有 E2E 测试。

新增 `smoke-test` job，并让它等待 Production deploy 完成：

```yaml
  smoke-test:
    name: Production smoke test
    needs:
      - deploy
    runs-on: ubuntu-latest

    env:
      PLAYWRIGHT_BASE_URL: ${{ needs.deploy.outputs.production_url }}
```

这里复用第 7 小节约定的 `PLAYWRIGHT_BASE_URL`。数据传递过程是：

```text
Deploy Action 的 static_web_app_url
→ Production deploy 的 production_url
→ PLAYWRIGHT_BASE_URL
→ Playwright 访问正式站点
```

Production smoke test 使用新的 runner，因此仍需取得测试代码、安装依赖和 Chromium。运行测试前先确认正式地址存在：

```yaml
    steps:
      - name: Check out main
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      - name: Require deployed URL
        run: |
          if [ -z "$PLAYWRIGHT_BASE_URL" ]; then
            echo "PLAYWRIGHT_BASE_URL is required"
            exit 1
          fi

      - name: Test production deployment
        run: npm run test:e2e
```

如果测试失败，保存 Playwright 报告用于定位问题：

```yaml
      - name: Upload Playwright diagnostics
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-production-smoke-report
          path: playwright-report
          if-no-files-found: ignore
          retention-days: 7
```

完整的 `.github/workflows/production.yml` 如下：

```yaml
# main 更新后重新构建、部署并验证正式站点
name: Production Delivery

# Squash Merge 在 main 产生新提交后启动
on:
  push:
    branches:
      - main

# 当前 workflow 只需要读取仓库代码
permissions:
  contents: read

jobs:
  # --------------- job 1 -------------- #
  # 从 main 的正式提交重新构建并部署 Production
  deploy:
    name: Production deploy
    runs-on: ubuntu-latest

    # 把 Azure 返回的正式地址提供给后续测试 job
    outputs:
      production_url: ${{ steps.deploy.outputs.static_web_app_url }}

    steps:
      - name: Check out main
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build production application
        run: npm run build

      # 直接发布当前 runner 已经生成的 dist
      - name: Deploy production
        id: deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: dist
          skip_app_build: true

  # --------------- job 2 -------------- #
  # 部署成功后，从新的 runner 访问真实 Production
  smoke-test:
    name: Production smoke test
    needs:
      - deploy
    runs-on: ubuntu-latest

    # Production URL 成为 Playwright 测试地址
    env:
      PLAYWRIGHT_BASE_URL: ${{ needs.deploy.outputs.production_url }}

    steps:
      - name: Check out main
        uses: actions/checkout@v7

      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      # 地址缺失时立即失败，避免 Playwright 错误地测试本地 Vite
      - name: Require deployed URL
        run: |
          if [ -z "$PLAYWRIGHT_BASE_URL" ]; then
            echo "PLAYWRIGHT_BASE_URL is required"
            exit 1
          fi

      - name: Test production deployment
        run: npm run test:e2e

      # 正式环境测试失败时保存报告
      - name: Upload Playwright diagnostics
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: playwright-production-smoke-report
          path: playwright-report
          if-no-files-found: ignore
          retention-days: 7
```

这条 workflow 此时只存在于功能分支。创建文件或继续向功能分支 push 都不会触发 Production Delivery；它要等 Pull Request 合并，使 `production.yml` 和当前代码一起进入 `main` 后，才会被 `push: main` 启动。

运行时应形成下面的依赖关系：

```text
Production deploy
→ Production smoke test
```

Preview smoke test 是合并前的质量门禁，只有真实 Preview 通过测试，代码才能进入 `main`。Production smoke test 则在部署后验证正式站点，并把验证结果记录在 Production Delivery 中。

参考：[GitHub Actions push event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push)、[Azure Static Web Apps Deploy Action](https://github.com/Azure/static-web-apps-deploy)

### 10. 完成 Pull Request 并验证 Production

Production workflow 已经写入功能分支，但它只有进入 `main` 后才会运行。现在需要先把 Step 05 的最终文件提交到当前 Pull Request，通过合并门禁，再验证合并后自动发生的 Preview 清理和 Production 发布。

#### 10.1 提交最终变更

README 记录的是本步全部成功后的稳定状态，因此直接更新为：

```markdown
## Current status

The React application foundation, automated test foundation, responsive product shell and continuous delivery foundation are in place.

The application includes client-side routing for Home and Methodology, a shared Header, Main and Footer structure, unknown-route and route-error handling, Tailwind CSS design tokens, and project-owned shadcn/ui components.

The complete quality pipeline covers linting, component tests, the production build and Playwright browser tests. Pull requests deploy and verify Azure Static Web Apps previews; updates merged into main trigger a fresh production build, production deployment and deployed smoke test. The delivery configuration also provides SPA fallback, basic response headers, failed-test diagnostics and automatic preview cleanup.
```

README 不记录配置过程中的临时状态。它描述的是 Step 05 按当前笔记全部执行成功后，项目已经具备的能力。

提交前运行最后一次本地完整检查：

```bash
npm run check
```

检查通过后确认修改范围：

```bash
git status --short
```

本次最终提交包含 Production workflow、项目状态和已经对齐的项目文档：

```bash
git add AGENTS.md
git add .github/workflows/production.yml
git add README.md
git add docs/DEVELOPMENT_OUTLINE.md
git add docs/steps.md
git add docs/TECHNICAL_SPEC.md
git commit -m "ci: complete initial delivery pipeline"
git push
```

push 更新当前 Pull Request，并再次启动合并前流程：

```text
Quality
→ Deploy
→ Deployed smoke test
```

此时 Production Delivery 不会运行，因为提交仍然位于功能分支。Ruleset 会在三个 required checks 等待或运行期间阻止合并；它们全部成功后，Pull Request 才满足合并条件。

#### 10.2 合并并验证 Production

确认最新提交对应的 Quality、Deploy 和 Deployed smoke test 全部成功后，在 GitHub Pull Request 页面执行 Squash Merge。

合并会同时产生两个事件：

```text
Pull Request closed
→ Pull Request Delivery 运行 Close Preview
→ 删除当前 PR 的临时环境

main push
→ Production Delivery 运行 Production deploy
→ Production smoke test 访问正式站点
```

这两条 workflow 相互独立，可以同时运行。进入仓库的 Actions 页面分别检查：

```text
Pull Request Delivery
└─ Close Preview             ✅

Production Delivery
├─ Production deploy         ✅
└─ Production smoke test     ✅
```

Production Delivery 通过后，打开 Azure 返回的正式地址，确认站点可以访问；再进入 Azure Static Web Apps 的 Environments 页面，确认当前 Pull Request 对应的 Preview 已经删除。

Production smoke test 是部署后的确认步骤。如果它失败，Production 已经完成更新，当前基础流程不会自动回滚。此时不能把 Step 05 标记为完成，需要定位失败原因；如果必须恢复旧版本，则从最新 `main` 创建 revert 分支，撤销有问题的 Squash Commit，再通过新的 Pull Request 完成检查和重新部署：

```text
定位有问题的 Squash Commit
→ 创建 revert 分支
→ 提交 revert
→ 创建新的 Pull Request
→ required checks 全部通过
→ 合并并重新部署 Production
```

自动回滚、蓝绿发布和环境晋升不属于当前基础流程。

#### 10.3 同步 main 并清理分支

只有在 Production deploy、Production smoke test 和 Close Preview 全部成功后，才进行本地清理。

先切换到本地 `main`，并快进到远程最新提交：

```bash
git checkout main
git pull --ff-only
```

如果远程功能分支仍然存在，使用命令删除：

```bash
git push origin --delete ci/initial-delivery
```

Squash Merge 在 `main` 上创建了新的提交，功能分支原有 commit 不会成为 `main` 的直接祖先，因此使用 `-D` 删除本地功能分支：

```bash
git branch -D ci/initial-delivery
git fetch --prune
git status --short --branch
```

此时本地和远程的 `main` 已经包含 Step 05 的最终结果，临时 Preview 与功能分支也已经清理完成。

### Step 05 完成状态

```text
✅ 已建立 ci/initial-delivery 分支并通过初始本地检查
✅ 已理解 GitHub 平台、runner 与 Azure 的职责边界
✅ Pull Request workflow 可以响应 PR 创建和更新
✅ Quality job 已在远程 runner 中真实运行
✅ frontend-dist 可以在不同 job 之间传递
✅ React Router 页面回退规则已进入构建产物
✅ Azure Static Web Apps 资源和 Deployment Token 已建立
✅ Deploy job 已生成真实 Pull Request Preview
✅ Playwright 已支持 Local 和远程测试目标
✅ Deployed smoke test 已验证真实 Preview
✅ PR 关闭后可以自动清理 Preview
✅ main 的 required checks 已生效
✅ 失败的 Quality 检查能够阻止合并和部署
✅ Production workflow 已建立
✅ 最终 npm run check 通过
✅ README 已记录本步成功完成后的状态
✅ Pull Request 已通过 Squash Merge 进入 main
✅ Production deploy 和 Production smoke test 已通过
✅ Preview 已清理，Production URL 可以访问
✅ 本地 main 已同步，功能分支已清理
```

## Step 06 · 验证租金数据与 SA2 关联

### 这一步做什么

前面的步骤已经建立了应用外壳和交付流程，但 RoostMap 还没有经过验证的地区租金数据。要继续实现核心功能，首先要确认两份官方数据能否正确关联。

MBIE（租金） 的 Rental Bond Data 按季度记录租金统计，其中使用 `Location Id` 表示地区。Stats NZ（区域） 的 SA2 2019 数据记录统计区域的编号、名称和边界。两份数据各自提供了一部分信息：

```text
MBIE（租金） Rental Bond Data
└─ 地区对应的租金统计

Stats NZ（区域） SA2 2019
└─ 地区编号、名称和边界
```

如果 MBIE（租金） 的 `Location Id` 与 Stats NZ（区域） 的 SA2 编号表示同一个地区，就可以把租金统计与地区信息连接起来：

```text
MBIE（租金） Location Id
        ↓
Stats NZ（区域） SA2 编号
        ↓
租金统计 + 地区名称 + 地区边界
```

字段名称和编号形式相似，只能说明它们可能有关联，不能证明全国数据都能正确对应。因此，本步需要检查真实文件的字段和取值，找出可以参与关联的 MBIE（租金） 记录，再验证这些记录能否找到对应的 SA2 和地区边界。

本步完成时，需要能够根据实际检查结果回答：

```text
哪些 MBIE（租金） 记录可以参与 SA2 关联？
这些记录能否找到对应的 SA2？
对应的 SA2 是否包含地区边界？
有多少记录成功关联、不能参与关联或没有找到对应地区？
```

这些结果将决定当前两份官方数据能否支持 RoostMap 的地区租金功能。

### 1. 创建数据关联验证分支

本步要验证一条尚未确认的数据关联，因此使用独立的 `spike/data-join` 分支进行。`spike` 表示这次工作用于验证技术可行性，`data-join` 表示验证对象是两份数据的关联。

在项目根目录执行：

```bash
git switch -c spike/data-join
git status -sb
```

Git 创建并切换到新分支：

```text
Switched to a new branch 'spike/data-join'
```

`git status -sb` 的分支行显示：

```text
## spike/data-join
```

当前工作已经进入独立分支。接下来先取得需要检查的两份官方文件，再根据文件中的真实内容判断它们能否关联。

### 2. 取得并核对两份官方数据

分支准备完成后，首先要取得待验证的真实数据。

项目使用 `data/raw/` 保存下载的原始文件，并按来源分成两个目录：

```text
data/raw/
├─ mbie/
└─ stats-nz/
```

先建立这两个目录：

```bash
mkdir -p data/raw/mbie
mkdir -p data/raw/stats-nz
```

#### 2.1 取得 MBIE（租金） 租金数据

进入 MBIE（租金） 的 [Rental Bond Data](https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/) 页面，下载 detailed quarterly tenancy CSV，并保存为：

```text
data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv
```

下载完成后，先确认它确实是 CSV，再记录行数和 SHA-256：

```bash
file data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv
wc -l data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv
shasum -a 256 data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv
```

终端返回：

```text
data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv: CSV text
226081 data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv
b40a39a0ce899362df5da729ed38cf8962cc31058910693aa2301feb9d0be80e
```

当前文件共有 226,081 行。SHA-256 用来标识这次检查所使用的具体文件；即使以后下载到同名文件，也可以通过哈希值判断内容是否发生变化。文件内部的表头和记录结构将在确认来源文件后继续检查。

#### 2.2 取得 Stats NZ（区域） SA2 数据

进入 Stats NZ（区域） Datafinder 的 [Statistical Area 2 Higher Geographies 2019 Generalised](https://datafinder.stats.govt.nz/layer/98779-statistical-area-2-higher-geographies-2019-generalised/) 页面，创建以下导出：

```text
Vector format: GeoPackage / SQLite
Coordinate reference system: WGS 84 (EPSG:4326)
```

GeoPackage 可以在一个文件中保存 SA2 属性和边界。导出的 ZIP 保存为：

```text
data/raw/stats-nz/statsnz-statistical-area-2-higher-geographies-2019-generalised-GPKG.zip
```

检查下载文件的类型、SHA-256 和压缩包内容：

```bash
file data/raw/stats-nz/statsnz-statistical-area-2-higher-geographies-2019-generalised-GPKG.zip
shasum -a 256 data/raw/stats-nz/statsnz-statistical-area-2-higher-geographies-2019-generalised-GPKG.zip
unzip -l data/raw/stats-nz/statsnz-statistical-area-2-higher-geographies-2019-generalised-GPKG.zip
```

结果表明它是有效的 ZIP，SHA-256 为：

```text
f2f92af77d426b4d3c82975bfbc07d90264a6360f36639988dff19e1c71db220
```

压缩包中包含一个 GeoPackage 和四个来源说明文件：

```text
anzlic-metadata-2019-statistical-area-2.pdf
statistical-area-2-higher-geographies-2019-generalised-ISO.pdf
statistical-area-2-higher-geographies-2019-generalised.gpkg
statistical-area-2-higher-geographies-2019-generalised.txt
statistical-area-2-higher-geographies-2019-generalised.xml
```

将这些文件解压到独立目录，再确认 GeoPackage 的文件类型：

```bash
mkdir -p data/raw/stats-nz/sa2-2019
unzip -q \
  data/raw/stats-nz/statsnz-statistical-area-2-higher-geographies-2019-generalised-GPKG.zip \
  -d data/raw/stats-nz/sa2-2019

file data/raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg
```

终端确认该文件是 OGC GeoPackage 使用的 SQLite 数据库：

```text
SQLite 3.x database (OGC GeoPackage file)
```

到这里可以确认，MBIE（租金） 文件是 CSV，Stats NZ（区域） 文件包含二进制 GeoPackage。它们都是保持原样的官方输入，不适合反复写入 Git 历史，因此仓库通过 `.gitignore` 排除整个 raw 目录：

```gitignore
data/raw/
```

现在已经取得并核对了两份原始输入：一份 MBIE（租金） 租金 CSV 和一份 Stats NZ（区域） SA2 GeoPackage。文件类型和哈希值只能证明下载内容明确且可以读取；要判断它们能否关联，还需要继续检查两份文件内部的字段和数据结构。

### 3. 理解两份数据的结构

两份来源文件已经确认可以读取，但文件类型和哈希值无法说明内部字段能否关联。接下来分别查看它们的结构，先找出可能连接两份数据的字段。

#### 3.1 检查 MBIE（租金） CSV

先查看 CSV 的表头和前三条数据：

```bash
head -n 4 data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv
```

输出为：

```csv
TimeFrame,Location Id,Dwelling Type,Number Of Beds,Total Bonds,Active Bonds,Closed Bonds,Median Rent,Geometric Mean Rent,Upper Quartile Rent,Lower Quartile Rent,Log Std Dev Weekly Rent
2026-04-01,NULL,ALL,1,2064,19563,1176,NULL,NULL,NULL,NULL,NULL
2026-04-01,-99,ALL,1,22014,113820,6969,550,522,660,450,0.4144
2026-04-01,100100,ALL,1,6,9,0,425,408,475,370,0.2834
```

CSV 有 12 个字段，可以分成四组：

```text
时间
└─ TimeFrame

地区和住宅分类
├─ Location Id
├─ Dwelling Type
└─ Number Of Beds

租赁债券数量
├─ Total Bonds
├─ Active Bonds
└─ Closed Bonds

租金统计
├─ Median Rent
├─ Geometric Mean Rent
├─ Upper Quartile Rent
├─ Lower Quartile Rent
└─ Log Std Dev Weekly Rent
```

前三条数据已经显示出不同形式的 `Location Id`：`NULL`、`-99` 和六位编号 `100100`。其中一些租金字段也可能是 `NULL`。这几行只能说明这些值确实存在，尚不能说明它们在全国文件中出现多少次或应该怎样处理。

字段名称还不能完整说明统计口径，因此需要同时阅读下载页面的说明。MBIE（租金） 说明这份数据：

- 来自登记到 tenancy bond database 的私人租赁债券；
- 按 tenancy start date 统计；
- 使用 Stats NZ（区域） 的 SA2 2019 地区定义；
- 因新旧 bond management systems 的迁移和数据整理而处于 provisional 状态，后续可能修订；
- 对数量使用以 3 为基数的 fixed random rounding，并在某个选择少于 5 个 bonds 时抑制结果。

这些说明确认 `Location Id` 与 SA2 2019 有直接关系，也说明当前数据不能被理解为未经处理的精确个案记录。CSV 中实际包含哪些位置编号和分类值，仍需要根据整个文件继续检查。

#### 3.2 检查 Stats NZ（区域） GeoPackage

解压目录中的说明文件指出，这份数据保存 Stats NZ（区域） 在 2019 年定义的 SA2 边界，并把每个 SA2 对应到 territorial authority 和 regional council。当前导出已经转换为 WGS 84。

GeoPackage 本身是 SQLite 数据库。先查询 `gpkg_contents` 和 `gpkg_geometry_columns`，确认实际业务表和 geometry 定义：

```bash
sqlite3 -header -column \
  data/raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg \
  "SELECT table_name, data_type, srs_id FROM gpkg_contents;"

sqlite3 -header -column \
  data/raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg \
  "SELECT column_name, geometry_type_name, srs_id
   FROM gpkg_geometry_columns;"
```

查询结果为：

```text
table_name                                              data_type  srs_id
------------------------------------------------------  ---------  ------
statistical_area_2_higher_geographies_2019_generalised  features   4326

column_name  geometry_type_name  srs_id
-----------  ------------------  ------
geom         MULTIPOLYGON        4326
```

`features` 表示该表保存地理要素。`geom` 使用 `MULTIPOLYGON`，因为一个 SA2 可能由一个或多个多边形组成。`srs_id` 为 `4326`，与下载时选择的 WGS 84 导出坐标系统一致。

知道表名后，再查看业务表的字段：

```bash
sqlite3 -header -column \
  data/raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg \
  "PRAGMA table_info('statistical_area_2_higher_geographies_2019_generalised');"
```

与当前关联有关的字段包括：

```text
SA22019_V1_00        SA2 2019 编号
SA22019_V1_00_NAME   SA2 名称
TA2019_V1_00         territorial authority 编号
TA2019_V1_00_NAME    territorial authority 名称
REGC2019_V1_00       regional council 编号
REGC2019_V1_00_NAME  regional council 名称
LAND_AREA_SQ_KM      陆地面积
geom                 SA2 边界
```

查看几条记录，可以确认这些字段共同描述一个 SA2 及其上级地区：

```bash
sqlite3 -header -column \
  data/raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg \
  "SELECT
     SA22019_V1_00 AS sa2_code,
     SA22019_V1_00_NAME AS sa2_name,
     TA2019_V1_00_NAME AS territorial_authority,
     REGC2019_V1_00_NAME AS region,
     CASE
       WHEN geom IS NULL OR length(geom) = 0 THEN 'empty'
       ELSE 'present'
     END AS geometry
   FROM statistical_area_2_higher_geographies_2019_generalised
   ORDER BY SA22019_V1_00
   LIMIT 5;"
```

输出为：

```text
sa2_code  sa2_name                   territorial_authority  region            geometry
--------  -------------------------  ---------------------  ----------------  --------
100100    North Cape                 Far North District     Northland Region  present
100200    Rangaunu Harbour           Far North District     Northland Region  present
100300    Inlets Far North District  Far North District     Northland Region  present
100400    Karikari Peninsula         Far North District     Northland Region  present
100500    Tangonge                   Far North District     Northland Region  present
```

最后统计 SA2 编号和空 geometry：

```bash
sqlite3 -header -column \
  data/raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg \
  "SELECT
     COUNT(*) AS total_rows,
     COUNT(DISTINCT SA22019_V1_00) AS distinct_sa2_codes,
     SUM(
       CASE
         WHEN SA22019_V1_00 IS NULL OR TRIM(SA22019_V1_00) = '' THEN 1
         ELSE 0
       END
     ) AS missing_sa2_codes,
     SUM(
       CASE
         WHEN geom IS NULL OR length(geom) = 0 THEN 1
         ELSE 0
       END
     ) AS empty_geometry
   FROM statistical_area_2_higher_geographies_2019_generalised;"
```

得到：

```text
total_rows  distinct_sa2_codes  missing_sa2_codes  empty_geometry
----------  ------------------  -----------------  --------------
2255        2255                0                  16
```

GeoPackage 中共有 2,255 条记录，每条记录都有不同且非空的 SA2 编号；其中 16 条记录的 `geom` 为空。这里的查询只检查 geometry 字段是否存在内容，没有判断多边形本身是否有效。

MBIE（租金） 官方说明表明租金数据使用 SA2 2019 地区定义，Stats NZ（区域） 表中对应的编号字段是 `SA22019_V1_00`，因此可以提出下面的关联假设：

```text
MBIE（租金） Location Id = Stats NZ（区域） SA22019_V1_00
```

当前只确认了候选关联字段。MBIE（租金） 样本中已经出现 `NULL`、`-99` 和六位编号，而 Stats NZ（区域） 也有少量空 geometry；在决定哪些记录可以参与关联之前，还需要先了解这些情况在完整数据中的分布。

### 4. 对 MBIE（租金） 全国数据进行 profiling

上一节只查看了 CSV 的前三条记录，因此只能确认 `Location Id` 中出现了 `NULL`、`-99` 和六位编号。要判断候选关联字段是否适用于完整数据，还需要知道整个文件包含多少条记录、覆盖哪些季度，以及地区和住宅分类实际有哪些取值。

这些统计都来自同一个 CSV，并且在源文件更新后还要重新检查。这里建立一个小型 profiling 脚本，把同一组检查保存在一起并允许再次运行。profiling 只描述源数据中存在什么，不在读取数据的同时决定保留或删除哪些记录。

#### 4.1 读取完整 CSV

CSV 字段可能使用引号包裹，字段内容也可能包含逗号，因此不能依靠 `split(",")` 可靠地拆分每一行。项目现有依赖没有提供 CSV 解析功能，于是加入只供本地数据脚本使用的 `csv-parse`：

```bash
npm install -D csv-parse
npm ls csv-parse
```

安装结果确认当前版本为：

```text
roostmap@0.0.0
└── csv-parse@7.0.3
```

`csv-parse` 在这里负责把 CSV 行转换成以表头为属性名的对象。它属于开发依赖，不会进入浏览器应用的运行代码。

建立脚本目录，并创建 `data/scripts/profile-mbie.mjs`：

```bash
mkdir -p data/scripts
```

脚本先回答最基础的问题：文件能否完整读取、共有多少条记录、覆盖多少个季度。

```js
import { createReadStream } from "node:fs";

import { parse } from "csv-parse";

const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);

function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}

let inputRecords = 0;
const periods = new Set();

const parser = createReadStream(mbieFileUrl).pipe(
  parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }),
);

for await (const record of parser) {
  inputRecords += 1;
  const period = sourceValue(record, "TimeFrame");
  periods.add(period);
}

const sortedPeriods = [...periods].sort();

console.log(
  JSON.stringify(
    {
      inputRecords,
      periods: {
        count: sortedPeriods.length,
        start: sortedPeriods.at(0),
        end: sortedPeriods.at(-1),
      },
    },
    null,
    2,
  ),
);
```

`bom: true` 允许解析器去掉文件开头可能存在的 UTF-8 BOM；`columns: true` 使用第一行表头建立记录对象；`skip_empty_lines: true` 忽略完全空白的行。脚本使用 stream 逐条读取，不需要先把整个文件放进内存。

运行第一版脚本：

```bash
node data/scripts/profile-mbie.mjs
```

得到：

```json
{
  "inputRecords": 226080,
  "periods": {
    "count": 26,
    "start": "2020-01-01",
    "end": "2026-04-01"
  }
}
```

完整文件包含 226,080 条记录和 26 个季度。按字符串排序能够得到正确的起止时间，是因为 `TimeFrame` 统一使用 `YYYY-MM-DD` 格式。

#### 4.2 查看分类字段的完整取值

上面已经确认 CSV 包含 226,080 条记录和 26 个季度。记录数量远大于地区数量，是因为同一个季度、同一个地区还会按照住宅类型和卧室数量分别统计。现在需要回答的是：这三个分类字段在完整文件中到底出现了哪些取值？

```text
Location Id     地区编号
Dwelling Type   住宅类型
Number Of Beds  卧室分类
```

这里关注的是“有哪些不同值”，不需要保存同一个值出现的每一次。JavaScript 的 `Set` 只保留不同值，适合在逐条读取 CSV 时收集这些分类。

profiling 脚本的读取过程因此扩展为：

```text
读取开始前建立 Set
        ↓
每读到一条 record，就把当前分类值放入 Set
        ↓
文件读取结束后，再整理 Set 中的完整结果
```

这些 `Set` 要和现有的 `periods` 一样，在读取循环开始前创建。它们会在整个读取过程中持续累积数据：

```js
let inputRecords = 0;

const periods = new Set();
const locationIds = new Set();
const dwellingTypes = new Set();
const bedroomCategories = new Set();
```

循环中的 `record` 表示当前读到的一条 CSV 记录。先从这条记录取得四个字段值，再分别交给对应的 `Set`：

```js
for await (const record of parser) {
  inputRecords += 1;

  const period = sourceValue(record, "TimeFrame");
  const locationId = sourceValue(record, "Location Id");
  const dwellingType = sourceValue(record, "Dwelling Type");
  const bedrooms = sourceValue(record, "Number Of Beds");

  periods.add(period);
  locationIds.add(locationId);
  dwellingTypes.add(dwellingType);
  bedroomCategories.add(bedrooms);
}
```

`record` 只在循环的花括号内存在，所以字段读取必须在循环内完成。循环每运行一次就处理一条记录；`Set` 遇到已经存在的值时不会重复保存。读取完 226,080 条记录后，四个 `Set` 中留下的就是完整文件里的不同取值。

此时循环已经结束，可以像整理季度一样整理另外三个结果。`Location Id` 暂时只统计不同值的数量；住宅类型和卧室分类数量较少，可以排序后完整输出：

```js
const sortedPeriods = [...periods].sort();

console.log(
  JSON.stringify(
    {
      inputRecords,
      periods: {
        count: sortedPeriods.length,
        start: sortedPeriods.at(0),
        end: sortedPeriods.at(-1),
      },
      distinctLocationIds: locationIds.size,
      dwellingTypes: [...dwellingTypes].sort(),
      bedroomCategories: [...bedroomCategories].sort((left, right) =>
        left.localeCompare(right, "en-NZ", { numeric: true }),
      ),
    },
    null,
    2,
  ),
);
```

`distinctLocationIds`、`dwellingTypes` 和 `bedroomCategories` 描述的是整个文件，与 `periods` 是并列的汇总结果。`localeCompare()` 使用数字顺序排列卧室值，避免普通字符串排序把 `15` 放在 `2` 前面。

再次运行脚本：

```bash
node data/scripts/profile-mbie.mjs
```

新增统计为：

```json
{
  "distinctLocationIds": 2011,
  "dwellingTypes": [
    "ALL",
    "Apartment",
    "Boarding House",
    "Flat",
    "House",
    "Room"
  ],
  "bedroomCategories": [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "5+",
    "6",
    "7",
    "8",
    "9",
    "15",
    "ALL",
    "NA"
  ]
}
```

完整文件共有 2,011 种 `Location Id`、6 种住宅类型和 14 种卧室取值。`5` 与 `5+` 同时存在，说明它们是源数据中的两个独立分类；profiling 先保留并展示这些原始差异，不在观察数据之前改变分类含义。

#### 4.3 分开统计不同形式的 Location Id

4.2 得到 2,011 种 `Location Id`，但这个总数没有说明这些值是否都具有 Stats NZ（区域） SA2 编号的形式。第 3 节提出的关联假设要求两边编号能够对应，因此现在需要进一步看清 `Location Id` 的组成。

这里需要回答两个问题：

```text
不同的 Location Id 有多少种？
每种 Location Id 在 CSV 中出现多少行？
```

`locationIds` 这个 `Set` 已经能够回答第一个问题。`Set` 不保存重复次数，因此第二个问题需要使用 `Map`，建立“原始值 → 出现行数”的对应关系。

profiling 脚本的读取过程继续沿用 4.2 的三个阶段：

```text
循环前：建立 Map，保存整个文件的计数
循环中：读取当前 locationId，并把对应次数加 1
循环后：根据完整统计分析编号形式并输出
```

`locationIdCounts` 需要跨越全部记录持续累计，因此和几个 `Set` 一起在读取循环之前创建。此时这一组状态变量是：

```js
let inputRecords = 0;

const periods = new Set();
const locationIds = new Set();
const locationIdCounts = new Map();
const dwellingTypes = new Set();
const bedroomCategories = new Set();
```

循环读到当前记录后，`locationId` 已经从 `record` 中取得。除了把它交给 `locationIds` 去重，还要在 `locationIdCounts` 中更新出现次数。此时完整的读取循环是：

```js
for await (const record of parser) {
  inputRecords += 1;

  const period = sourceValue(record, "TimeFrame");
  const locationId = sourceValue(record, "Location Id");
  const dwellingType = sourceValue(record, "Dwelling Type");
  const bedrooms = sourceValue(record, "Number Of Beds");

  periods.add(period);
  locationIds.add(locationId);
  locationIdCounts.set(
    locationId,
    (locationIdCounts.get(locationId) ?? 0) + 1,
  );
  dwellingTypes.add(dwellingType);
  bedroomCategories.add(bedrooms);
}
```

第一次遇到某个 `locationId` 时，`Map.get()` 得到 `undefined`，`?? 0` 把它作为 `0` 次处理，然后加 `1`。再次遇到相同值时，脚本会在原有次数上继续累加。

文件读取结束后，`locationIds` 已经包含所有不同值，`locationIdCounts` 也已经保存每个值的出现行数。Stats NZ（区域） 样本中的 SA2 编号是六位数字，因此在循环结束后检查哪些 MBIE（租金） 值具有相同形式：

```js
const sortedPeriods = [...periods].sort();

const sixDigitLocationIds = [...locationIds].filter((locationId) =>
  /^\d{6}$/.test(locationId),
);

const otherNonSixDigitLocationIds = [...locationIds].filter(
  (locationId) =>
    !/^\d{6}$/.test(locationId) &&
    locationId !== "-99" &&
    locationId !== "NULL" &&
    locationId !== "",
);
```

正则表达式 `/^\d{6}$/` 要求整个字符串正好由六位数字组成。另一个列表排除六位编号以及样本中已经见过的 `-99`、`NULL` 和空字符串，用来发现是否还存在没有注意到的其他形式。

原来的 `distinctLocationIds` 只能输出一个总数。现在把位置编号信息整理成 `locationIdProfile`。它和 `periods`、`dwellingTypes`、`bedroomCategories` 仍然是并列的汇总结果：

```js
console.log(
  JSON.stringify(
    {
      inputRecords,
      periods: {
        count: sortedPeriods.length,
        start: sortedPeriods.at(0),
        end: sortedPeriods.at(-1),
      },
      locationIdProfile: {
        distinctValues: locationIds.size,
        sixDigitCandidateValues: sixDigitLocationIds.length,
        exactValueRows: {
          "-99": locationIdCounts.get("-99") ?? 0,
          NULL: locationIdCounts.get("NULL") ?? 0,
          blank: locationIdCounts.get("") ?? 0,
        },
        otherNonSixDigitValues: otherNonSixDigitLocationIds,
      },
      dwellingTypes: [...dwellingTypes].sort(),
      bedroomCategories: [...bedroomCategories].sort((left, right) =>
        left.localeCompare(right, "en-NZ", { numeric: true }),
      ),
    },
    null,
    2,
  ),
);
```

再次运行 profiling：

```bash
node data/scripts/profile-mbie.mjs
```

位置编号统计为：

```json
{
  "locationIdProfile": {
    "distinctValues": 2011,
    "sixDigitCandidateValues": 2009,
    "exactValueRows": {
      "-99": 1091,
      "NULL": 794,
      "blank": 0
    },
    "otherNonSixDigitValues": []
  }
}
```

2,011 种 `Location Id` 由 2,009 个六位编号、`-99` 和 `NULL` 组成，没有出现其他形式的值。六位格式与 Stats NZ（区域） 样本中的 SA2 编号形式一致，因此当前只能把这 2,009 个值视为候选编号；格式相同还不能证明每个编号都能关联成功。

`-99` 和 `NULL` 的结果只说明它们在源文件中分别出现了 1,091 行和 794 行。profiling 没有可靠依据解释这两个值的业务含义，因此不在这里为它们定义处理方式。

#### 4.4 检查观察记录是否重复

4.3 已经看清 `Location Id` 的组成，但同一个地区在同一个季度中还会出现不同住宅类型和卧室分类，因此 `Location Id` 不能单独标识一条租金观察。现在需要回答的是：哪几个字段共同组成一条观察，并且这个组合在完整 CSV 中是否重复？

根据字段结构，一条观察由四个维度共同描述：

```text
TimeFrame + Location Id + Dwelling Type + Number Of Beds
```

这只是一个候选组合，需要用完整文件验证。检查时可以把四个值按固定顺序连接成一个字符串键，再用 `Set` 记录已经出现的键。如果后续记录产生相同的键，就说明这个组合发生了重复。

profiling 脚本继续沿用相同的三个阶段：

```text
循环前：建立组合键 Set 和重复计数器
循环中：为当前 record 生成组合键并检查是否出现过
循环后：输出完整文件中的重复数量
```

组合键集合和重复计数需要贯穿整个读取过程，因此在循环之前创建。此时完整的状态变量是：

```js
let inputRecords = 0;
let duplicateObservationKeys = 0;

const periods = new Set();
const locationIds = new Set();
const locationIdCounts = new Map();
const dwellingTypes = new Set();
const bedroomCategories = new Set();
const observationKeys = new Set();
```

循环已经取得 `period`、`locationId`、`dwellingType` 和 `bedrooms`。完成原有统计后，把四个值连接成 `observationKey`，并在当前循环内检查它是否已经存在：

```js
for await (const record of parser) {
  inputRecords += 1;

  const period = sourceValue(record, "TimeFrame");
  const locationId = sourceValue(record, "Location Id");
  const dwellingType = sourceValue(record, "Dwelling Type");
  const bedrooms = sourceValue(record, "Number Of Beds");

  periods.add(period);
  locationIds.add(locationId);
  locationIdCounts.set(
    locationId,
    (locationIdCounts.get(locationId) ?? 0) + 1,
  );
  dwellingTypes.add(dwellingType);
  bedroomCategories.add(bedrooms);

  const observationKey = [
    period,
    locationId,
    dwellingType,
    bedrooms,
  ].join("|");

  if (observationKeys.has(observationKey)) {
    duplicateObservationKeys += 1;
  } else {
    observationKeys.add(observationKey);
  }
}
```

第一次遇到某个组合时，`has()` 返回 `false`，脚本把键放入 `observationKeys`。再次遇到相同组合时，`has()` 返回 `true`，脚本只增加重复计数。

文件读取结束后，季度和位置编号仍然按照 4.3 的方式整理。`duplicateObservationKeys` 描述整个文件，因此与其他汇总结果并列输出：

```js
const sortedPeriods = [...periods].sort();

const sixDigitLocationIds = [...locationIds].filter((locationId) =>
  /^\d{6}$/.test(locationId),
);

const otherNonSixDigitLocationIds = [...locationIds].filter(
  (locationId) =>
    !/^\d{6}$/.test(locationId) &&
    locationId !== "-99" &&
    locationId !== "NULL" &&
    locationId !== "",
);

console.log(
  JSON.stringify(
    {
      inputRecords,
      periods: {
        count: sortedPeriods.length,
        start: sortedPeriods.at(0),
        end: sortedPeriods.at(-1),
      },
      locationIdProfile: {
        distinctValues: locationIds.size,
        sixDigitCandidateValues: sixDigitLocationIds.length,
        exactValueRows: {
          "-99": locationIdCounts.get("-99") ?? 0,
          NULL: locationIdCounts.get("NULL") ?? 0,
          blank: locationIdCounts.get("") ?? 0,
        },
        otherNonSixDigitValues: otherNonSixDigitLocationIds,
      },
      dwellingTypes: [...dwellingTypes].sort(),
      bedroomCategories: [...bedroomCategories].sort((left, right) =>
        left.localeCompare(right, "en-NZ", { numeric: true }),
      ),
      duplicateObservationKeys,
    },
    null,
    2,
  ),
);
```

再次运行 profiling：

```bash
node data/scripts/profile-mbie.mjs
```

组合键统计为：

```json
{
  "duplicateObservationKeys": 0
}
```

当前源文件没有重复的四字段组合，因此这四个维度能够区分现有 CSV 中的每条观察记录。这个结论只说明组合键在当前源文件中唯一，没有改变记录内容，也没有判断记录能否与地理数据关联。

#### 4.5 统计租金字段中的缺失标记

4.4 已经确认每条观察可以由四个维度区分，但这只说明记录结构没有重复，还没有说明每条观察是否都包含租金指标。第 3 节查看的 CSV 样本中已经出现租金值为 `NULL`，因此现在需要统计这种缺失标记在完整文件中出现多少次。

CSV 提供五个租金统计字段，每个字段都需要独立计数：

```text
Median Rent
Geometric Mean Rent
Upper Quartile Rent
Lower Quartile Rent
Log Std Dev Weekly Rent
```

这些字段可以保存在一个数组中。`Object.fromEntries()` 再根据数组建立计数对象，使每个字段的初始缺失数量都是 `0`。

profiling 脚本继续沿用相同的三个阶段：

```text
循环前：建立租金字段列表和缺失计数对象
循环中：检查当前 record 的五个租金字段
循环后：输出完整文件中每个字段的缺失数量
```

字段列表和计数对象都要贯穿整个读取过程，因此在循环之前创建。此时完整的状态变量是：

```js
let inputRecords = 0;
let duplicateObservationKeys = 0;

const periods = new Set();
const locationIds = new Set();
const locationIdCounts = new Map();
const dwellingTypes = new Set();
const bedroomCategories = new Set();
const observationKeys = new Set();

const rentFields = [
  "Median Rent",
  "Geometric Mean Rent",
  "Upper Quartile Rent",
  "Lower Quartile Rent",
  "Log Std Dev Weekly Rent",
];

const missingRentValues = Object.fromEntries(
  rentFields.map((field) => [field, 0]),
);
```

循环处理当前 `record` 时，原有的分类和组合键统计保持不变。组合键检查完成后，再依次读取五个租金字段；空字符串和源文件中的 `NULL` 都计为缺失标记：

```js
for await (const record of parser) {
  inputRecords += 1;

  const period = sourceValue(record, "TimeFrame");
  const locationId = sourceValue(record, "Location Id");
  const dwellingType = sourceValue(record, "Dwelling Type");
  const bedrooms = sourceValue(record, "Number Of Beds");

  periods.add(period);
  locationIds.add(locationId);
  locationIdCounts.set(
    locationId,
    (locationIdCounts.get(locationId) ?? 0) + 1,
  );
  dwellingTypes.add(dwellingType);
  bedroomCategories.add(bedrooms);

  const observationKey = [
    period,
    locationId,
    dwellingType,
    bedrooms,
  ].join("|");

  if (observationKeys.has(observationKey)) {
    duplicateObservationKeys += 1;
  } else {
    observationKeys.add(observationKey);
  }

  for (const field of rentFields) {
    const value = sourceValue(record, field);

    if (value === "" || value === "NULL") {
      missingRentValues[field] += 1;
    }
  }
}
```

外层 `for await` 每次处理一条 CSV 记录，内层 `for` 再检查这一条记录的五个租金字段。`missingRentValues[field]` 因此保存的是对应字段在全部记录中的缺失次数。

文件读取结束后，原有汇总结果保持不变，`missingRentValues` 作为新的并列项输出。此时完整的整理和输出代码是：

```js
const sortedPeriods = [...periods].sort();

const sixDigitLocationIds = [...locationIds].filter((locationId) =>
  /^\d{6}$/.test(locationId),
);

const otherNonSixDigitLocationIds = [...locationIds].filter(
  (locationId) =>
    !/^\d{6}$/.test(locationId) &&
    locationId !== "-99" &&
    locationId !== "NULL" &&
    locationId !== "",
);

console.log(
  JSON.stringify(
    {
      inputRecords,
      periods: {
        count: sortedPeriods.length,
        start: sortedPeriods.at(0),
        end: sortedPeriods.at(-1),
      },
      locationIdProfile: {
        distinctValues: locationIds.size,
        sixDigitCandidateValues: sixDigitLocationIds.length,
        exactValueRows: {
          "-99": locationIdCounts.get("-99") ?? 0,
          NULL: locationIdCounts.get("NULL") ?? 0,
          blank: locationIdCounts.get("") ?? 0,
        },
        otherNonSixDigitValues: otherNonSixDigitLocationIds,
      },
      dwellingTypes: [...dwellingTypes].sort(),
      bedroomCategories: [...bedroomCategories].sort((left, right) =>
        left.localeCompare(right, "en-NZ", { numeric: true }),
      ),
      duplicateObservationKeys,
      missingRentValues,
    },
    null,
    2,
  ),
);
```

再次运行 profiling：

```bash
node data/scripts/profile-mbie.mjs
```

租金字段统计为：

```json
{
  "missingRentValues": {
    "Median Rent": 803,
    "Geometric Mean Rent": 803,
    "Upper Quartile Rent": 803,
    "Lower Quartile Rent": 803,
    "Log Std Dev Weekly Rent": 859
  }
}
```

前四个租金字段各有 803 条缺失标记，`Log Std Dev Weekly Rent` 有 859 条。这些数字来自全部 226,080 条原始记录，只描述字段的完整程度；脚本没有把缺失值改成 `0`，也没有因为某个租金字段缺失而移除记录。

到这里，profiling 已经依次回答了完整文件的时间范围、分类取值、位置编号形式、观察组合唯一性和租金字段完整程度。每个结论都来自脚本的实际输出，源数据仍然保持原样。

### 5. 验证 Location Id 与 SA2 编号的关联

第 3.2 节提出了下面的关联假设：

```text
MBIE（租金） Location Id = Stats NZ（区域） SA22019_V1_00
```

第 4 节已经确认 MBIE（租金） 文件中哪些 `Location Id` 具有六位 SA2 编号的形式。接下来需要检查的不是两边各有多少个编号，而是 MBIE（租金） 中的每一个候选编号能否在 Stats NZ（区域） 数据中找到。

这个问题可以转换成两个编号集合之间的比较。设 MBIE（租金） 候选编号为集合 A，Stats NZ（区域） SA2 编号为集合 B：

```text
A ∩ B  同时存在于两份数据中的编号
A - B  只存在于 MBIE（租金）、无法找到对应 SA2 的编号
```

编号出现在交集中，只能证明两边存在同一个编号。RoostMap 还需要地区边界，因此找到编号后还要检查对应 Stats NZ（区域） 记录的 geometry。

关联验证由此分成三个连续阶段：

```text
建立 MBIE（租金） 候选编号集合
→ 建立 Stats NZ（区域） SA2 编号与 geometry 的对应关系
→ 比较编号并检查匹配记录的 geometry
```

这些检查需要同时读取两份源文件，因此建立 `data/scripts/verify-data-join.mjs`。

#### 5.1 建立 MBIE（租金） 候选编号集合

集合比较需要先准备 A。第 4.3 节已经确定，只有正好由六位数字组成的 `Location Id` 才具有当前 Stats NZ（区域） SA2 编号的形式。关联脚本沿用同一条判断规则，使 profiling 和关联验证使用相同的候选范围。

新脚本先加入读取 MBIE（租金） CSV 需要的 import、文件位置和字段读取函数：

```js
import { createReadStream } from "node:fs";

import { parse } from "csv-parse";

const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);

function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}
```

这部分沿用 profiling 脚本已经验证过的 CSV 读取方式。`sourceValue()` 统一把字段转成去除首尾空白的字符串，使正则表达式检查的是整理后的编号。

接着建立空的 `Set`，逐条读取 CSV。每遇到一个六位 `Location Id`，就把它加入集合：

```js
const mbieCandidateIds = new Set();

const parser = createReadStream(mbieFileUrl).pipe(
  parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }),
);

for await (const record of parser) {
  const locationId = sourceValue(record, "Location Id");

  if (/^\d{6}$/.test(locationId)) {
    mbieCandidateIds.add(locationId);
  }
}
```

`/^\d{6}$/` 要求整个值正好包含六位数字。`Set` 自动去除重复值，因此同一个地区在不同季度、住宅类型或卧室分类中出现时，集合里仍然只保留一个编号。

先输出集合大小并运行脚本：

```js
console.log(
  JSON.stringify(
    {
      mbieCandidateIds: mbieCandidateIds.size,
    },
    null,
    2,
  ),
);
```

```bash
node data/scripts/verify-data-join.mjs
```

得到：

```json
{
  "mbieCandidateIds": 2009
}
```

这个数量与第 4.3 节的 profiling 结果一致，说明关联脚本已经按相同规则建立了集合 A。

#### 5.2 建立 Stats NZ（区域） SA2 编号与 geometry 的对应关系

集合 B 不能只保存 SA2 编号。编号匹配后还要知道对应记录是否有边界，因此需要保存下面的对应关系：

```text
SA2 编号 → geometry 是否存在
```

JavaScript 的 `Map` 可以用 SA2 编号作为键，并把 geometry 状态作为值。为了取得这些信息，脚本需要查询 GeoPackage 中已经在第 3.2 节确认过的业务表。

项目环境已经使用 `sqlite3` 检查过这个 GeoPackage。这里继续调用同一个命令，并让它返回 JSON，避免为一次只读查询再增加数据库依赖。先在文件顶部补充两个 Node.js import：

```js
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
```

`execFileSync()` 负责执行 `sqlite3`，`fileURLToPath()` 把 `new URL()` 生成的文件地址转换成命令可以读取的本地路径。

然后在 `mbieFileUrl` 后面加入 GeoPackage 的位置：

```js
const statsNzFileUrl = new URL(
  "../raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg",
  import.meta.url,
);
```

MBIE（租金） 循环结束后，查询每个 SA2 编号及其 geometry 状态：

```js
const statsNzQuery = `
  SELECT
    SA22019_V1_00 AS sa2Id,
    CASE
      WHEN geom IS NULL OR length(geom) = 0 THEN 0
      ELSE 1
    END AS hasGeometry
  FROM statistical_area_2_higher_geographies_2019_generalised;
`;

const statsNzRows = JSON.parse(
  execFileSync(
    "sqlite3",
    ["-json", fileURLToPath(statsNzFileUrl), statsNzQuery],
    { encoding: "utf8" },
  ),
);
```

SQL 中的 `CASE` 把 geometry 状态转换成 `0` 或 `1`。`sqlite3 -json` 把查询结果输出成 JSON，`JSON.parse()` 再将它变成 JavaScript 数组。

查询结果仍然是一行一个对象。把它转换成 `Map` 后，可以通过 SA2 编号直接取得 geometry 状态：

```js
const statsNzAreas = new Map(
  statsNzRows.map((row) => [
    String(row.sa2Id).trim(),
    Boolean(row.hasGeometry),
  ]),
);

const statsNzAreasWithoutGeometry = [...statsNzAreas.values()].filter(
  (hasGeometry) => !hasGeometry,
).length;
```

这里把 SQLite 的 `0` 和 `1` 转换成 JavaScript 的 `false` 和 `true`。再次运行脚本后，两边的基础数量为：

```json
{
  "mbieCandidateIds": 2009,
  "statsNzSa2Ids": 2255,
  "statsNzAreasWithoutGeometry": 16
}
```

这些数量分别与第 4.3 节和第 3.2 节的独立检查一致。集合 A 和映射 B 都已经从完整源文件中正确建立，可以开始比较实际编号。

#### 5.3 比较编号并检查 geometry

对集合 A 中的每个编号调用 `statsNzAreas.has()`，就能判断 Stats NZ（区域） 映射中是否存在同一个键。根据判断结果，将编号分别放进 `matchedIds` 和 `unmatchedIds`：

```js
const matchedIds = [...mbieCandidateIds]
  .filter((sa2Id) => statsNzAreas.has(sa2Id))
  .sort();

const unmatchedIds = [...mbieCandidateIds]
  .filter((sa2Id) => !statsNzAreas.has(sa2Id))
  .sort();
```

这两个数组共同覆盖集合 A：一个编号要么找到对应 SA2，要么没有找到。对已经匹配的编号继续调用 `statsNzAreas.get()`，可以检查对应的 geometry 状态：

```js
const matchedIdsWithoutGeometry = matchedIds.filter(
  (sa2Id) => !statsNzAreas.get(sa2Id),
);
```

最后输出两份源数据的基础数量、匹配数量和异常编号。异常项同时保留数量与具体值，出现问题时可以直接看出哪些编号需要检查：

```js
console.log(
  JSON.stringify(
    {
      mbieCandidateIds: mbieCandidateIds.size,
      statsNzSa2Ids: statsNzAreas.size,
      statsNzAreasWithoutGeometry,
      matchedIds: matchedIds.length,
      unmatchedIds: {
        count: unmatchedIds.length,
        values: unmatchedIds,
      },
      matchedIdsWithoutGeometry: {
        count: matchedIdsWithoutGeometry.length,
        values: matchedIdsWithoutGeometry,
      },
    },
    null,
    2,
  ),
);
```

运行完整脚本：

```bash
node data/scripts/verify-data-join.mjs
```

实际输出为：

```json
{
  "mbieCandidateIds": 2009,
  "statsNzSa2Ids": 2255,
  "statsNzAreasWithoutGeometry": 16,
  "matchedIds": 2009,
  "unmatchedIds": {
    "count": 0,
    "values": []
  },
  "matchedIdsWithoutGeometry": {
    "count": 0,
    "values": []
  }
}
```

2,009 个 MBIE（租金） 候选编号全部存在于 Stats NZ（区域） SA2 数据中，没有未关联编号。Stats NZ（区域） 全表虽然有 16 条记录缺少 geometry，但这些记录不在当前匹配结果中；2,009 个匹配编号都具有 geometry。

因此，当前两份源文件在地区编号层面满足下面的关联：

```text
MBIE（租金） 六位 Location Id
→ Stats NZ（区域） SA2 编号
→ 存在 geometry
```

这个结论限定在本节检查的编号与 geometry：它证明候选地区可以完成关联，不改变第 4 节记录的其他源数据情况。

### 6. 统计 MBIE（租金） 记录的关联结果

第 5 节验证的是不同地区编号之间的关系。一个地区编号会在不同季度、住宅类型和卧室分类中重复出现，因此编号全部匹配还不能说明完整 CSV 中有多少条记录完成了关联。

现在把检查单位从编号推进到记录。每条 MBIE（租金） 记录根据 `Location Id` 和 Stats NZ（区域） 查询结果，只能进入下面四种情况之一：

```text
Location Id 不是六位候选编号
Location Id 找不到对应 SA2
Location Id 找到 SA2，但对应记录没有 geometry
Location Id 找到 SA2，并且对应记录有 geometry
```

四种记录数量相加应当等于 MBIE（租金） 输入总数。这样既能得到关联成功的记录数，也能检查统计过程中是否遗漏了记录。

#### 6.1 统计每个候选编号对应的记录数

第 5 节的 `mbieCandidateIds` 只保留不同编号，无法说明每个编号在 CSV 中出现多少次。要从编号级结果回到记录级结果，需要在读取 CSV 时同时保存每个候选编号的出现次数。

先在 `mbieCandidateIds` 前面加入两个记录计数器，并建立一个 `Map`：

```js
let inputRecords = 0;
let candidateLocationRecords = 0;

const mbieCandidateIds = new Set();
const mbieCandidateIdCounts = new Map();
```

`inputRecords` 统计所有输入记录，`candidateLocationRecords` 统计使用六位候选编号的记录。`mbieCandidateIdCounts` 则保存下面的对应关系：

```text
六位 Location Id → 这个编号在 CSV 中出现的记录数
```

CSV 循环每读到一条记录，先增加输入总数。当前 `Location Id` 符合六位形式时，再增加候选记录数，并更新这个编号在 `Map` 中的次数：

```js
for await (const record of parser) {
  inputRecords += 1;

  const locationId = sourceValue(record, "Location Id");

  if (/^\d{6}$/.test(locationId)) {
    candidateLocationRecords += 1;
    mbieCandidateIds.add(locationId);
    mbieCandidateIdCounts.set(
      locationId,
      (mbieCandidateIdCounts.get(locationId) ?? 0) + 1,
    );
  }
}
```

第一次遇到某个编号时，`Map.get()` 返回 `undefined`，`?? 0` 把原有次数作为 `0`，然后加 `1`。后续再次遇到同一编号时，就在已有次数上继续累加。

不属于候选编号的记录数不需要在循环中单独维护。完整文件读取结束后，用输入总数减去候选记录数即可得到：

```js
const nonCandidateLocationRecords =
  inputRecords - candidateLocationRecords;
```

这里的 `nonCandidateLocationRecords` 只表示 `Location Id` 不符合本次关联使用的六位编号形式，不为这些源值增加其他含义。

#### 6.2 根据关联结果归类候选记录

`mbieCandidateIdCounts` 已经保存每个候选编号对应多少条记录，`statsNzAreas` 则保存这个编号是否存在以及是否有 geometry。把两个 `Map` 放在一起，就可以一次处理一个编号下的全部记录。

先建立三个结果计数器：

```js
let joinedRecords = 0;
let unmatchedLocationRecords = 0;
let missingGeometryRecords = 0;
```

然后遍历 `mbieCandidateIdCounts`。每次循环取得一个 `sa2Id` 和它对应的 `recordCount`，再按顺序判断 Stats NZ（区域） 映射：

```js
for (const [sa2Id, recordCount] of mbieCandidateIdCounts) {
  if (!statsNzAreas.has(sa2Id)) {
    unmatchedLocationRecords += recordCount;
  } else if (!statsNzAreas.get(sa2Id)) {
    missingGeometryRecords += recordCount;
  } else {
    joinedRecords += recordCount;
  }
}
```

判断顺序保证三种结果不会重叠：

```text
映射中没有编号             → unmatchedLocationRecords
映射中有编号但没有 geometry → missingGeometryRecords
编号和 geometry 都存在      → joinedRecords
```

每次增加的不是 `1`，而是当前编号对应的 `recordCount`。这样无需把 224,195 条候选记录再次逐条保存，也能得到记录级关联数量。

#### 6.3 检查记录总数是否守恒

记录已经分成四种互不重叠的结果。将它们重新相加，可以检查完整输入是否全部得到解释：

```js
const accountedRecords =
  nonCandidateLocationRecords +
  joinedRecords +
  unmatchedLocationRecords +
  missingGeometryRecords;
```

在原有编号级输出后加入 `records`，把这组记录级结果放在一起：

```js
records: {
  input: inputRecords,
  candidateLocation: candidateLocationRecords,
  nonCandidateLocation: nonCandidateLocationRecords,
  joined: joinedRecords,
  unmatchedLocation: unmatchedLocationRecords,
  missingGeometry: missingGeometryRecords,
  accounted: accountedRecords,
},
```

再次运行关联验证脚本：

```bash
node data/scripts/verify-data-join.mjs
```

新增的 `records` 结果为：

```json
{
  "records": {
    "input": 226080,
    "candidateLocation": 224195,
    "nonCandidateLocation": 1885,
    "joined": 224195,
    "unmatchedLocation": 0,
    "missingGeometry": 0,
    "accounted": 226080
  }
}
```

224,195 条记录使用六位候选编号，并且全部找到带有 geometry 的 Stats NZ（区域） SA2。1,885 条记录的 `Location Id` 不属于六位候选编号；这个数量与第 4.3 节的位置编号统计一致。候选记录中没有未找到 SA2 或缺少 geometry 的情况。

四种结果重新相加：

```text
1,885 + 224,195 + 0 + 0 = 226,080
```

`accounted` 与 `input` 相同，说明完整 CSV 中每条记录都进入了一个明确且唯一的关联结果。当前源文件共有 224,195 条记录能够通过六位 `Location Id` 关联到带有 geometry 的 SA2。

### 7. 选择代表性 SA2 样本

第 7 节继续修改第 5 节创建的 `data/scripts/verify-data-join.mjs`，不创建新的脚本文件。

第 6 节已经得到全国记录的关联数量，但总数只能说明整体关联是否完整，不能直接看出记录分布不同的地区是否都能被正确识别。现在从完整关联结果中选择少量样本，直接观察几种差异明显的数据情况。

样本不按城市名称手工列举，而是根据全国数据中的可计算特征产生：

```text
关联记录最多的 SA2       检查高频地区
关联记录最少的 SA2       检查稀疏地区
陆地面积最大的已关联 SA2 检查大面积边界
Stats NZ（区域） 中的 Chatham Islands 地区
                         检查只有边界、没有 MBIE（租金） 观察记录的地区
```

前三项来自已经完成关联的 2,009 个 SA2。最后一项来自 Stats NZ（区域） 边界数据，用来保留一个与前三项不同的边界情况。选择条件直接作用于完整源数据，因此源文件不变时会得到相同样本。

#### 7.1 为已关联地区补充可读信息

`data/scripts/verify-data-join.mjs` 中的 `statsNzAreas` 目前只保存 `SA2 编号 → geometry 状态`，足以完成第 5、6 节的计数，却无法说明选中的编号对应哪个地区。样本还需要地区名称、所属行政区、Region 和陆地面积，因此先在这个文件中找到 `const statsNzQuery`，将查询扩展为：

```js
const statsNzQuery = `
  SELECT
    SA22019_V1_00 AS sa2Id,
    SA22019_V1_00_NAME AS sa2Name,
    TA2019_V1_00_NAME AS territorialAuthority,
    REGC2019_V1_00_NAME AS region,
    LAND_AREA_SQ_KM AS landAreaSqKm,
    CASE
      WHEN geom IS NULL OR length(geom) = 0 THEN 0
      ELSE 1
    END AS hasGeometry
  FROM statistical_area_2_higher_geographies_2019_generalised;
`;
```

查询仍然只读取同一张 Stats NZ（区域） 业务表。新增字段用于解释样本，`hasGeometry` 的判断保持不变。

在同一个文件中，`statsNzRows` 解析完成后，先把每个 SA2 的完整信息保存到 `statsNzDetails`：

```js
const statsNzDetails = new Map(
  statsNzRows.map((row) => {
    const sa2Id = String(row.sa2Id).trim();

    return [
      sa2Id,
      {
        sa2Id,
        name: row.sa2Name,
        territorialAuthority: row.territorialAuthority,
        region: row.region,
        landAreaSqKm: Number(row.landAreaSqKm),
        hasGeometry: Boolean(row.hasGeometry),
      },
    ];
  }),
);
```

这个 `Map` 保存下面的关系：

```text
SA2 编号 → 该地区的名称、上级区域、陆地面积和 geometry 状态
```

第 5、6 节已有的关联判断仍然只需要 geometry 状态。由 `statsNzDetails` 再建立原来的 `statsNzAreas`，就能继续复用已有的关联逻辑：

```js
const statsNzAreas = new Map(
  [...statsNzDetails].map(([sa2Id, area]) => [sa2Id, area.hasGeometry]),
);
```

这样，同一份 Stats NZ（区域） 查询结果同时支持关联计数和样本说明，不需要再次读取 GeoPackage。

#### 7.2 根据完整数据选择样本

继续在 `data/scripts/verify-data-join.mjs` 中处理样本。`matchedIds` 已经保存全部匹配成功的 SA2 编号，`mbieCandidateIdCounts` 保存每个编号对应的 MBIE（租金） 记录数。在 `accountedRecords` 计算完成后、`console.log()` 输出之前，把两部分信息组合成用于比较的完整地区列表：

```js
const joinedAreaDetails = matchedIds.map((sa2Id) => ({
  ...statsNzDetails.get(sa2Id),
  recordCount: mbieCandidateIdCounts.get(sa2Id),
}));
```

现在列表中的每一项既有 Stats NZ（区域） 地区信息，也有对应的 MBIE（租金） 记录数。先按记录数从高到低和从低到高排序，取得高频与稀疏样本：

```js
const highestRecordCountSample = [...joinedAreaDetails].sort(
  (left, right) =>
    right.recordCount - left.recordCount ||
    left.sa2Id.localeCompare(right.sa2Id),
)[0];

const lowestRecordCountSample = [...joinedAreaDetails].sort(
  (left, right) =>
    left.recordCount - right.recordCount ||
    left.sa2Id.localeCompare(right.sa2Id),
)[0];
```

两个地区记录数相同时，继续按 `sa2Id` 排序。这个第二排序条件不会改变“最多”和“最少”的含义，只负责让并列情况始终选中同一个编号。

同样的方法可以按陆地面积选择已关联地区中面积最大的样本：

```js
const largestLandAreaSample = [...joinedAreaDetails].sort(
  (left, right) =>
    right.landAreaSqKm - left.landAreaSqKm ||
    left.sa2Id.localeCompare(right.sa2Id),
)[0];
```

前三个样本都来自 `joinedAreaDetails`，因此一定同时具有 MBIE（租金） 观察记录和 Stats NZ（区域） geometry。Chatham Islands 的样本需要从完整 Stats NZ（区域） 列表中寻找，并明确排除已经出现在 MBIE（租金） 候选编号集合中的地区：

```js
const chathamIslandsSample = [...statsNzDetails.values()]
  .filter(
    (area) =>
      area.territorialAuthority === "Chatham Islands Territory" &&
      !mbieCandidateIds.has(area.sa2Id) &&
      area.hasGeometry,
  )
  .sort(
    (left, right) =>
      right.landAreaSqKm - left.landAreaSqKm ||
      left.sa2Id.localeCompare(right.sa2Id),
  )[0];
```

这里要求地区有 geometry、没有 MBIE（租金） 候选编号，并在符合条件的 Chatham Islands 地区中选择陆地面积最大的记录。它表示“边界存在但当前没有租金观察”的数据情况。

最后给四个结果加入选择原因，并组成一个小型样本列表：

```js
const representativeSamples = [
  {
    selection: "highestRecordCount",
    ...highestRecordCountSample,
  },
  {
    selection: "lowestRecordCount",
    ...lowestRecordCountSample,
  },
  {
    selection: "largestLandArea",
    ...largestLandAreaSample,
  },
  {
    selection: "statsOnlyChathamIslands",
    ...chathamIslandsSample,
    recordCount: 0,
  },
];
```

`selection` 记录样本为何被选中；`recordCount` 则保持统一含义，表示该 SA2 在 MBIE（租金） 文件中的候选记录数。

#### 7.3 查看选择结果

最后修改 `data/scripts/verify-data-join.mjs` 末尾的 `console.log()`，在现有 JSON 输出对象中加入 `representativeSamples`：

```js
{
  // 前面的编号级和记录级结果保持不变
  representativeSamples,
}
```

运行脚本：

```bash
node data/scripts/verify-data-join.mjs
```

`representativeSamples` 的实际输出为：

```json
[
  {
    "selection": "highestRecordCount",
    "sa2Id": "179900",
    "name": "Greensboro",
    "territorialAuthority": "Hamilton City",
    "region": "Waikato Region",
    "landAreaSqKm": 0.46632181,
    "hasGeometry": true,
    "recordCount": 579
  },
  {
    "selection": "lowestRecordCount",
    "sa2Id": "102100",
    "name": "Hokianga South",
    "territorialAuthority": "Far North District",
    "region": "Northland Region",
    "landAreaSqKm": 126.08930327,
    "hasGeometry": true,
    "recordCount": 1
  },
  {
    "selection": "largestLandArea",
    "sa2Id": "341500",
    "name": "Mackenzie Lakes",
    "territorialAuthority": "Mackenzie District",
    "region": "Canterbury Region",
    "landAreaSqKm": 5134.28848751,
    "hasGeometry": true,
    "recordCount": 116
  },
  {
    "selection": "statsOnlyChathamIslands",
    "sa2Id": "343000",
    "name": "Chatham Islands",
    "territorialAuthority": "Chatham Islands Territory",
    "region": "Area Outside Region",
    "landAreaSqKm": 793.94659384,
    "hasGeometry": true,
    "recordCount": 0
  }
]
```

Greensboro 和 Hokianga South 展示了同一关联规则下记录数从 579 到 1 的差异；Mackenzie Lakes 提供了面积明显更大的已关联边界；Chatham Islands 则只有 Stats NZ（区域） geometry，没有 MBIE（租金） 候选记录。四个样本都由明确条件从完整数据中选出，可以追溯到对应的官方 SA2 编号和边界记录。

### 8. 保存一组最小关联样本

第 7 节已经从完整 MBIE（租金） CSV 和 Stats NZ（区域） GeoPackage 中选出了代表样本。如果只想重复检查这些样本之间的关联，每次都读取两份完整源文件并不必要。当前关联实际使用的是少量 `Location Id`、SA2 编号和 geometry 状态，因此可以把这些值单独保存成一组小型固定样本。

在测试和数据处理中，这种为了重复检查而保存的固定样本通常称为 fixture，所以项目使用 `data/fixtures/` 目录存放它们。这里的 fixture 只是从真实源数据中提取的一小部分字段和值。

关联从 MBIE（租金） 的 `Location Id` 开始，所以先保存这些输入值，再判断另一侧还需要哪些 Stats NZ（区域） 信息。

#### 8.1 保存最小输入

关联过程读取 MBIE（租金） 的 `Location Id`，再到 Stats NZ（区域） 数据中寻找相同的 SA2 编号并检查 geometry。租金、住宅类型和地区面积不会改变这次关联，因此这组输入只保留三个必要信息。

先建立存放固定样本的目录：

```bash
mkdir -p data/fixtures/data-join
```

创建 `data/fixtures/data-join/mbie-records.csv`，写入五个已经在完整 MBIE（租金） 文件中确认过的 `Location Id`：

```csv
Location Id
179900
102100
341500
-99
NULL
```

前三个编号分别来自第 7 节选出的高频、稀疏和大面积已关联地区。`-99` 与 `NULL` 则保留第 4.3 节发现的两种非六位值，使最小输入同时包含可以参与关联和不能作为 SA2 候选编号的情况。

`mbie-records.csv` 只提供需要查找的值，还不能判断三个六位编号是否存在，也不能判断对应边界是否可用。关联的另一侧因此需要保留 Stats NZ（区域） 的 SA2 编号和 geometry 状态。创建 `data/fixtures/data-join/sa2-areas.json`：

```json
{
  "records": [
    {
      "SA22019_V1_00": "179900",
      "hasGeometry": true
    },
    {
      "SA22019_V1_00": "102100",
      "hasGeometry": true
    },
    {
      "SA22019_V1_00": "341500",
      "hasGeometry": true
    },
    {
      "SA22019_V1_00": "343000",
      "hasGeometry": true
    }
  ]
}
```

前三条 Stats NZ（区域） 记录与 CSV 中的六位编号对应。`343000` 是第 7 节选出的 Chatham Islands，只存在于当前 Stats NZ（区域） 样本中，没有对应的 MBIE（租金） 样本记录。

这里使用源字段名 `SA22019_V1_00` 保存 SA2 编号，使固定样本与 GeoPackage 的关联字段保持一致。geometry 本身是较大的二进制内容；当前关联只需要判断它是否存在，因此保存第 7 节已经查询出的 `hasGeometry` 状态。

#### 8.2 为五条输入写出正确结果

8.1 已经保存了关联两侧的输入，但这些数据本身还没有说明什么结果才是正确的。固定样本还需要一份“答案表”，逐条写明五个 `Location Id` 应当得到的关联状态。

这里按照第 5、6 节已经确认的关联方法逐条判断。Stats NZ（区域） 输入中可以查找的编号是：

```text
179900 → hasGeometry: true
102100 → hasGeometry: true
341500 → hasGeometry: true
343000 → hasGeometry: true
```

现在从第一条 MBIE（租金） 输入开始判断：

| MBIE（租金） `Location Id` | 判断过程 | 正确结果 |
| --- | --- | --- |
| `179900` | 是六位编号；Stats NZ（区域） 中存在；geometry 存在 | `joined` |
| `102100` | 是六位编号；Stats NZ（区域） 中存在；geometry 存在 | `joined` |
| `341500` | 是六位编号；Stats NZ（区域） 中存在；geometry 存在 | `joined` |
| `-99` | 不是六位编号，不进入 SA2 查找 | `nonCandidateLocation` |
| `NULL` | 不是六位编号，不进入 SA2 查找 | `nonCandidateLocation` |

Stats NZ（区域） 输入中的 `343000` 没有出现在 MBIE（租金） 输入里，因此它不是一条未关联的 MBIE（租金） 记录。它只表示当前固定样本中存在一个没有对应 MBIE（租金） 观察的 Stats NZ（区域） SA2，单独记为 `statsOnlySa2Ids`。

五条 MBIE（租金） 输入由此得到：

```text
3 条 joined
2 条 nonCandidateLocation
0 条 unmatchedLocation
0 条 missingGeometry
```

现在创建 `data/fixtures/data-join/expected-associations.json`，把上面的逐条判断和汇总数量保存下来：

```json
{
  "records": [
    {
      "locationId": "179900",
      "status": "joined",
      "sa2Id": "179900"
    },
    {
      "locationId": "102100",
      "status": "joined",
      "sa2Id": "102100"
    },
    {
      "locationId": "341500",
      "status": "joined",
      "sa2Id": "341500"
    },
    {
      "locationId": "-99",
      "status": "nonCandidateLocation",
      "sa2Id": null
    },
    {
      "locationId": "NULL",
      "status": "nonCandidateLocation",
      "sa2Id": null
    }
  ],
  "statsOnlySa2Ids": [
    "343000"
  ],
  "counts": {
    "input": 5,
    "joined": 3,
    "nonCandidateLocation": 2,
    "unmatchedLocation": 0,
    "missingGeometry": 0
  }
}
```

`records` 是五条 MBIE（租金） 输入的答案，顺序与 `mbie-records.csv` 保持一致。能够关联的记录保存相同的 `sa2Id`；没有进入 SA2 查找的 `-99` 和 `NULL` 使用 `null`，表示它们没有关联结果。

`statsOnlySa2Ids` 保存只出现在 Stats NZ（区域） 输入中的编号，`counts` 则把五条记录的状态重新汇总。输入文件与这份已知正确的结果放在一起，组成完整的固定样本。

#### 8.3 检查固定样本文件

两个 JSON 文件必须具有正确语法，CSV 则应当包含一行表头和五行输入。使用 Node.js 读取并解析 JSON，再统计 CSV 行数：

```bash
node -e 'const fs = require("node:fs"); for (const file of ["data/fixtures/data-join/sa2-areas.json", "data/fixtures/data-join/expected-associations.json"]) JSON.parse(fs.readFileSync(file, "utf8"));'
wc -l data/fixtures/data-join/mbie-records.csv
```

JSON 解析成功时第一条命令没有输出。CSV 行数为：

```text
6 data/fixtures/data-join/mbie-records.csv
```

最后查看三份固定样本文件是否处于预期目录：

```bash
git status --short --untracked-files=all data/fixtures
```

得到：

```text
?? data/fixtures/data-join/expected-associations.json
?? data/fixtures/data-join/mbie-records.csv
?? data/fixtures/data-join/sa2-areas.json
```

现在这三份小文件已经固定了五条 MBIE（租金） 输入、四条 Stats NZ（区域） 输入以及对应的预期关联结果。它们保留真实源值，同时只包含复现当前关联情况需要的数据。

### 9. 用固定样本验证关联规则

第 8 节已经保存了关联两侧的输入，并逐条写出了正确结果。不过，人工对照只能解释这五条记录为什么得到相应状态，还不能证明同一套判断可以稳定地计算出这些结果。

现在把第 5、6 节使用的最小关联规则写成脚本：

```text
读取固定输入
→ 根据 Location Id 和 geometry 状态计算关联结果
→ 将计算结果与 8.2 的答案逐项比较
```

本节创建 `data/scripts/verify-data-join-fixture.mjs`。这个文件只读取 `data/fixtures/data-join/` 中的三份固定样本。

#### 9.1 读取固定输入

新脚本首先需要读取一份 CSV 和两份 JSON。在 `data/scripts/verify-data-join-fixture.mjs` 中加入 import 和三个文件位置：

```js
import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";

import { parse } from "csv-parse";

const mbieFixtureUrl = new URL(
  "../fixtures/data-join/mbie-records.csv",
  import.meta.url,
);

const statsNzFixtureUrl = new URL(
  "../fixtures/data-join/sa2-areas.json",
  import.meta.url,
);

const expectedFixtureUrl = new URL(
  "../fixtures/data-join/expected-associations.json",
  import.meta.url,
);
```

`createReadStream()` 和 `csv-parse` 读取 MBIE（租金） CSV，`readFile()` 读取两个 JSON。`assert` 会在计算完成后比较实际结果和正确答案。

两个 JSON 使用相同的读取方式，因此先加入一个小函数：

```js
async function readJson(fileUrl) {
  return JSON.parse(await readFile(fileUrl, "utf8"));
}
```

接着读取 `mbie-records.csv`。这个文件只有五条记录，但仍然沿用全国脚本中的 CSV 解析配置，使字段名和字段值的读取方式保持一致：

```js
const mbieRecords = [];
const parser = createReadStream(mbieFixtureUrl).pipe(
  parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }),
);

for await (const record of parser) {
  mbieRecords.push(record);
}
```

CSV 读取完成后，再读取 Stats NZ（区域） 输入和 8.2 写出的答案：

```js
const [statsNzFixture, expectedAssociations] = await Promise.all([
  readJson(statsNzFixtureUrl),
  readJson(expectedFixtureUrl),
]);
```

现在脚本内有三组数据：

```text
mbieRecords             五条待判断的 Location Id
statsNzFixture          四条 SA2 编号及其 geometry 状态
expectedAssociations    五条记录的正确答案和汇总数量
```

#### 9.2 计算实际关联结果

`sa2-areas.json` 当前仍然是对象数组。为了通过 SA2 编号直接查找 geometry 状态，在读取代码后面建立 `statsNzAreas`：

```js
const statsNzAreas = new Map(
  statsNzFixture.records.map((record) => [
    String(record.SA22019_V1_00).trim(),
    Boolean(record.hasGeometry),
  ]),
);
```

这个 `Map` 保存下面的关系：

```text
SA2 编号 → geometry 是否存在
```

接下来在同一个文件中加入 `associateRecord()`。函数每次接收一条 MBIE（租金） 输入，并按照固定顺序判断：

```js
function associateRecord(record) {
  const locationId = String(record["Location Id"] ?? "").trim();

  if (!/^\d{6}$/.test(locationId)) {
    return {
      locationId,
      status: "nonCandidateLocation",
      sa2Id: null,
    };
  }

  if (!statsNzAreas.has(locationId)) {
    return {
      locationId,
      status: "unmatchedLocation",
      sa2Id: null,
    };
  }

  if (!statsNzAreas.get(locationId)) {
    return {
      locationId,
      status: "missingGeometry",
      sa2Id: locationId,
    };
  }

  return {
    locationId,
    status: "joined",
    sa2Id: locationId,
  };
}
```

判断顺序决定了每条记录只能得到一个状态：

```text
不是六位编号                  → nonCandidateLocation
是六位编号，但 Map 中没有键    → unmatchedLocation
Map 中有键，但值为 false       → missingGeometry
Map 中有键，并且值为 true      → joined
```

用这个函数依次处理五条 MBIE（租金） 输入：

```js
const records = mbieRecords.map(associateRecord);
```

Stats NZ（区域） 输入中还包含没有对应 MBIE（租金） 记录的 `343000`。先从 MBIE（租金） 输入中取得全部六位候选编号，再找出只存在于 `statsNzAreas` 的编号：

```js
const mbieCandidateIds = new Set(
  mbieRecords
    .map((record) => String(record["Location Id"] ?? "").trim())
    .filter((locationId) => /^\d{6}$/.test(locationId)),
);

const statsOnlySa2Ids = [...statsNzAreas.keys()]
  .filter((sa2Id) => !mbieCandidateIds.has(sa2Id))
  .sort();
```

最后统计五条实际结果。计数对象先把四种状态设为 `0`，然后根据每条记录的 `status` 增加对应数量：

```js
const counts = {
  input: records.length,
  joined: 0,
  nonCandidateLocation: 0,
  unmatchedLocation: 0,
  missingGeometry: 0,
};

for (const record of records) {
  counts[record.status] += 1;
}
```

#### 9.3 对照正确答案

实际结果已经由关联规则计算完成。把逐条结果、Stats NZ（区域） 独有编号和汇总数量组合成与 `expected-associations.json` 相同的结构：

```js
const actualAssociations = {
  records,
  statsOnlySa2Ids,
  counts,
};
```

然后比较实际结果与 8.2 保存的正确答案：

```js
assert.deepStrictEqual(actualAssociations, expectedAssociations);
```

`deepStrictEqual()` 会递归比较对象中的数组、字段和值。只要任意一条记录的状态、编号、顺序或汇总数量不同，断言就会失败，Node.js 以非零状态结束；全部相同时才继续输出结果。

在脚本末尾加入通过状态和实际关联结果：

```js
console.log(
  JSON.stringify(
    {
      status: "passed",
      ...actualAssociations,
    },
    null,
    2,
  ),
);
```

运行固定样本验证：

```bash
node data/scripts/verify-data-join-fixture.mjs
```

语法检查没有输出，关联验证的关键结果为：

```text
status: passed

input: 5
joined: 3
nonCandidateLocation: 2
unmatchedLocation: 0
missingGeometry: 0

statsOnlySa2Ids: 343000
```

`passed` 表示脚本计算出的五条记录、Stats NZ（区域） 独有编号和汇总数量与固定答案全部一致；同一组输入再次运行时会经过相同判断并得到相同结果。

### 10. 汇总最终质量结论

第 9 节已经证明固定样本能够按照同一套规则得到已知答案，但它只检查了五条 MBIE（租金） 记录。全国关联脚本虽然已经输出编号和记录数量，这些数字目前仍然是分散的结果，还没有形成一个明确的通过或失败状态。

现在回到 `data/scripts/verify-data-join.mjs`，根据已经计算出的全国结果判断三件事：

```text
所有 MBIE（租金） 六位候选编号是否都找到 Stats NZ（区域） SA2
所有已匹配 SA2 是否都具有 geometry
所有 MBIE（租金） 输入记录是否都进入一个关联结果
```

三项条件全部成立时，全国关联才可以记为 `passed`。完成判断后，再把脚本输出的完整 JSON 保存下来，使本节结论与产生它的具体结果保存在一起。

#### 10.1 将全国结果转换成通过状态

第 5 节已经得到 `unmatchedIds` 和 `matchedIdsWithoutGeometry`，第 6 节已经得到 `accountedRecords` 与 `inputRecords`。这些变量正好对应三个质量条件，因此不需要重新读取或统计数据。

在 `data/scripts/verify-data-join.mjs` 中，`representativeSamples` 定义完成后、`console.log()` 之前加入：

```js
const checks = {
  allCandidateIdsMatched: unmatchedIds.length === 0,
  allMatchedIdsHaveGeometry: matchedIdsWithoutGeometry.length === 0,
  allInputRecordsAccountedFor: accountedRecords === inputRecords,
};

const status = Object.values(checks).every(Boolean) ? "passed" : "failed";
```

`checks` 把三个已有结果分别转换成 `true` 或 `false`。`Object.values(checks).every(Boolean)` 只有在三个值全部为 `true` 时才返回 `true`，因此其中任何一项失败，`status` 都会变成 `failed`。

接着在脚本末尾原有的 JSON 输出对象开头加入 `status` 和 `checks`：

```js
{
  status,
  checks,
  mbieCandidateIds: mbieCandidateIds.size,
  // 后面的编号、记录和代表样本结果保持不变
}
```

JSON 输出负责说明具体结果。命令本身还需要在检查失败时返回非零状态，因此在 `console.log()` 之后加入：

```js
if (status === "failed") {
  process.exitCode = 1;
}
```

运行全国关联脚本：

```bash
node data/scripts/verify-data-join.mjs
```

输出开头为：

```json
{
  "status": "passed",
  "checks": {
    "allCandidateIdsMatched": true,
    "allMatchedIdsHaveGeometry": true,
    "allInputRecordsAccountedFor": true
  }
}
```

三个条件全部为 `true`，因此脚本得到 `passed`。如果以后任意一个条件变成 `false`，输出会改为 `failed`，命令也会以非零状态结束。

#### 10.2 保存全国关联结果

10.1 运行脚本时，`console.log()` 已经把质量状态、编号统计、记录统计和代表样本组合成一份 JSON，并显示在终端中。现在需要保存的就是这份脚本输出，不再手动填写另一组统计数字。

先建立报告目录，再把脚本的标准输出写入 `data/reports/step-06-data-join.json`：

```bash
mkdir -p data/reports
node data/scripts/verify-data-join.mjs > data/reports/step-06-data-join.json
```

这条命令仍然由 `verify-data-join.mjs` 读取源文件并计算所有结果。Shell 的 `>` 只把 `console.log()` 输出的 JSON 写入指定文件，因此 `step-06-data-join.json` 是脚本运行的产物。

生成报告中的记录统计为：

```json
{
  "input": 226080,
  "candidateLocation": 224195,
  "nonCandidateLocation": 1885,
  "joined": 224195,
  "unmatchedLocation": 0,
  "missingGeometry": 0,
  "accounted": 226080
}
```

为了确认报告能够由相同源文件重新生成，再运行一次脚本，并把新输出与报告比较：

```bash
node data/scripts/verify-data-join.mjs > /tmp/roostmap-step-06-data-join.json
cmp -s data/reports/step-06-data-join.json /tmp/roostmap-step-06-data-join.json
echo $?
```

结果为：

```text
0
```

`cmp` 返回 `0`，说明两次脚本运行生成的 JSON 完全相同。报告中的数字来自全国关联脚本的计算结果，不是手动录入的结果。

#### 10.3 得出最终关联结论

全国脚本得到的编号级结果是：

```text
2,009 个 MBIE（租金） 六位 Location Id
→ 2,009 个全部找到 Stats NZ（区域） SA2 2019
→ 2,009 个全部具有 geometry
```

对应的记录级结果是：

```text
226,080 条 MBIE（租金） 输入记录
→ 224,195 条六位编号记录完成关联
→ 1,885 条非六位编号记录单独计数
→ 0 条候选记录未找到 SA2
→ 0 条候选记录缺少 geometry
→ 226,080 条记录全部得到解释
```

Stats NZ（区域） 全表存在 16 条缺少 geometry 的记录，但它们都不属于当前 2,009 个 MBIE（租金） 匹配编号，因此不会改变已匹配地区的 geometry 结果。第 9 节的五条固定样本也得到 `passed`，实际关联结果与逐条写出的正确答案一致。

当前两份源文件由此得到：

```text
Location Id → SA2 2019 → geometry
状态：passed
```

这个结论只说明当前 MBIE（租金） 租金数据可以通过六位 `Location Id` 与当前 Stats NZ（区域） SA2 2019 数据完成地区关联。

### 11. git 提交

确认本步文件：

```bash
git status --short
```

提交 脚本、固定样本、报告和文档：

```bash
git add .
git commit -m "chore: verify rental data and SA2 join"
git push -u origin spike/data-join
```

在 GitHub 创建 Pull Request，检查后 squash merge。合并完成后同步本地仓库：

```bash
git switch main
git pull --ff-only

```

删除分支

```bash
git branch -D spike/data-join
git push origin --delete spike/data-join
```



### Step 06 完成状态

```text
✅ 两份官方源文件已取得并完成完整性核对
✅ MBIE（租金） 与 Stats NZ（区域） 的数据结构和关联键已经确认
✅ MBIE（租金） 全国数据 profiling 已完成
✅ 2,009 个 MBIE（租金） 六位 Location Id 全部关联到带有 geometry 的 SA2
✅ 226,080 条 MBIE（租金） 输入记录全部得到解释
✅ 代表样本和最小固定样本已经建立
✅ 全国关联与固定样本验证均通过
✅ 全国关联报告可以稳定重新生成
✅ 数据脚本和文档已经完成
```

---

## Step 07 · 验证地图、图表与数据分片

### 这一步做什么

Step 06 已经确认，MBIE（租金） 的六位 `Location Id` 可以找到对应的 Stats NZ（区域） SA2，而且这些已匹配地区都具有 geometry。这个结论解决了数据能否关联的问题，但目前得到的仍然是 CSV、GeoPackage 和验证报告，浏览器还不能直接用它们组成地图与图表。

地图和历史图表需要从同一份关联结果中取得两种不同形态的数据：

```text
地图
→ 同一范围内的多个 SA2
→ 每个 SA2 的边界、稳定编号和当前租金指标

历史图表
→ 当前选中的一个 SA2
→ 按季度排列的历史租金指标
```

如果两部分各自选择地区、季度或住宅分类，用户在地图上选中的区域就可能与图表显示的数据不一致。因此，本步使用同一个 `sa2Id` 和同一组分类条件贯穿数据准备、地图绘制和历史图表。

地图相关工具分工如下：

```text
React                         保存页面选择和交互状态
react-map-gl/maplibre         把 React 状态连接到地图
MapLibre GL JS                绘制 GeoJSON 图层并处理地图交互
MapTiler Cloud                提供地图底图
Recharts                      绘制选中 SA2 的季度历史
```

除了确认地图和图表能够显示真实数据，还要确定浏览器应该怎样加载全国范围的数据。一次传输全国 SA2 geometry 可能产生较大的 data payload；按 Region 拆分可以减少单次加载量，但也会增加文件和加载切换。因此需要比较全国一次加载和 Region 按需加载的实际体积、解析时间与基本交互表现。

整条验证链路是：

```text
选择一个真实 Region 和 SA2
→ 从两份官方数据准备同一切片
→ 将 geometry 转成浏览器可读取的 GeoJSON
→ 在地图中显示 SA2 边界和租金指标
→ 用地图选择驱动同一 SA2 的历史图表
→ 比较全国数据与 Region 分片
→ 根据实际结果确定加载策略
```

本步完成后，应当得到一个加载真实最小数据切片的地图与历史图表技术样例，并且能够用测量结果说明全国数据应当怎样分片和按需加载。

### 1. 创建地图与图表验证分支

Step 06 已经合并到 `main`，因此从最新的稳定状态建立本步分支：

```bash
git switch main
git pull --ff-only
git status
git switch -c spike/map-chart
```

### 2. 确定最小真实数据切片

地图需要同一范围内的多个 SA2 边界，历史图表则需要其中一个 SA2 的连续季度记录。直接从全国数据开始会把 geometry 转换、地图绘制和加载体积混在一起，因此先选择一个真实 Region 和一个初始 SA2，固定本次技术样例使用的数据范围。

这个选择不能只凭熟悉的城市名称。Step 06 已经从完整关联结果中按记录数量选出了下面的代表样本：

```text
selection                  highestRecordCount
sa2Id                      179900
name                       Greensboro
territorialAuthority       Hamilton City
region                     Waikato Region
hasGeometry                true
recordCount                579
```

`179900` 是完整 MBIE（租金） 候选记录中出现次数最多的 SA2，并且具有 Stats NZ（区域） geometry。它所在的 Waikato Region 可以提供多个 SA2 边界用于地图，Greensboro 则提供一个数据较充足的初始选择用于历史图表。因此，本次样例固定为：

```text
Region             Waikato Region
Initial SA2        179900 · Greensboro
```

这里的 `recordCount: 579` 包含这个 SA2 的不同季度、住宅类型和卧室分类，不能直接作为某一个租金切片的历史点数量。地图与图表仍然需要继续使用完全相同的分类条件。

#### 2.1 固定地图与图表的分类条件

Step 06 第 4 节的 MBIE（租金） profiling 已经确认，数据覆盖 2020-01-01 至 2026-04-01，共 26 个季度。源文件同时提供 `ALL` 住宅类型和 `ALL` 卧室分类，项目设计将这两个官方源值作为默认切片。

本次样例因此固定下面的分类条件：

```text
Dataset latest period      2026-04-01
Dwelling Type              ALL
Number Of Beds             ALL
```

这里的 `ALL` 是 MBIE（租金） 源文件中已经存在的分类值，不是脚本把其他住宅类型或卧室数量重新相加得到的结果。地图和图表都只读取精确匹配这两个值的记录，不混入其他分类。

#### 2.2 确定地图指标与历史指标

地图需要在同一个季度比较多个 SA2，因此使用最新数据季度的 `Median Rent`。历史图表需要观察同一个 SA2 随季度变化的趋势，因此使用项目设计中规定的 `Geometric Mean Rent`。`Total Bonds` 同时保留为 Reported Bonds，用于说明每个观测的记录覆盖。

两部分的数据范围由此确定为：

```text
地图数据
Region             Waikato Region
Period             2026-04-01
Dwelling Type      ALL
Number Of Beds     ALL
Metric             Median Rent
Coverage           Total Bonds

历史图表数据
SA2                179900 · Greensboro
Periods            2020-01-01 至 2026-04-01
Dwelling Type      ALL
Number Of Beds     ALL
Metric             Geometric Mean Rent
Coverage           Total Bonds
```

地图范围中的 SA2 geometry 不因为当前季度缺少租金记录而被删除；没有精确匹配记录的地区保留边界，并将租金指标保持为缺失。历史数据也不使用其他住宅类型、卧室分类或相邻季度填补空值。

这样，地图负责比较 Waikato Region 内同一切片的多个 SA2，图表负责显示当前选中 SA2 在同一分类下的季度历史。两者通过 `sa2Id` 连接，初始值都是 `179900`。

### 3. 组合地图边界和租金数据

第 2 节已经确定本次样例使用 Waikato Region、初始地区 Greensboro，以及 `ALL / ALL` 分类。地图需要比较 Waikato 各 SA2 的最新季度租金，图表需要显示 Greensboro 在相同分类下的季度历史。

这些信息分散在两个源文件中：Stats NZ（区域） GeoPackage 保存地区身份和边界，MBIE（租金） CSV 保存季度租金。两边都使用六位 SA2 编号，因此可以通过 `sa2Id` 组合；在组合之前，先要把 GeoPackage 中的边界转换成 JavaScript 能处理的 GeoJSON geometry。

#### 3.1 解决 GeoPackage geometry 的格式差异

GeoPackage 表中的 `geom` 是二进制字段。它由 GeoPackage header 和 WKB geometry 两部分组成，而地图需要的是 GeoJSON 坐标。`sqlite3` 可以把二进制字段转成十六进制文本，但不能直接完成 WKB 到 GeoJSON 的转换。

项目因此只为本地数据脚本加入 `wkx`。它负责解析去掉 GeoPackage header 之后的 WKB，不参与浏览器应用运行：

```bash
npm install -D wkx
npm ls wkx
```

安装结果为：

```text
roostmap@0.0.0
└── wkx@0.5.0
```

Stats NZ（区域） 导出时已经选择 EPSG:4326，因此这里只转换 geometry 的存储格式，不改变坐标系。

#### 3.2 读取 Waikato Region 的 SA2 边界

现在创建 `data/scripts/prepare-map-chart-sample.mjs`，先只处理 Stats NZ（区域） 数据。这个阶段的目标是确认三件事：脚本能够限定 Waikato Region、能够把每条 geometry 转成 GeoJSON，并且没有在转换过程中丢失边界。

脚本先引入 Node.js 文件路径工具和 `wkx`，再指向已经解压的 GeoPackage：

```js
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import wkx from "wkx";

const statsNzFileUrl = new URL(
  "../raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg",
  import.meta.url,
);

const regionName = "Waikato Region";
```

从 SQLite 取得的十六进制内容仍然包含 GeoPackage header。header 中的 flags 决定 envelope 长度，所以 WKB 的开始位置不能写成一个固定数字。接着加入 `geoPackageWkb()`，先计算 header 长度，再返回真正的 WKB：

```js
function geoPackageWkb(geometryHex) {
  const geometryBuffer = Buffer.from(geometryHex, "hex");

  if (
    geometryBuffer.length < 8 ||
    geometryBuffer.toString("ascii", 0, 2) !== "GP"
  ) {
    throw new Error("Invalid GeoPackage geometry header");
  }

  const flags = geometryBuffer.readUInt8(3);
  const envelopeType = (flags >> 1) & 0b111;
  const envelopeCoordinateCounts = [0, 4, 6, 6, 8];
  const envelopeCoordinateCount = envelopeCoordinateCounts[envelopeType];

  if (envelopeCoordinateCount === undefined) {
    throw new Error(`Unsupported GeoPackage envelope type: ${envelopeType}`);
  }

  const headerLength = 8 + envelopeCoordinateCount * 8;
  return geometryBuffer.subarray(headerLength);
}
```

有了转换函数以后，再查询 Waikato Region。SQL 同时读取 SA2 编号、名称、上级地理、陆地面积和 geometry。`hex(geom)` 让 SQLite 可以通过 JSON 输出二进制内容，`ORDER BY` 保证相同源文件每次产生相同顺序：

```js
const statsNzQuery = `
  SELECT
    SA22019_V1_00 AS sa2Id,
    SA22019_V1_00_NAME AS name,
    TA2019_V1_00_NAME AS territorialAuthority,
    REGC2019_V1_00 AS regionCode,
    REGC2019_V1_00_NAME AS region,
    LAND_AREA_SQ_KM AS landAreaSqKm,
    CASE
      WHEN geom IS NULL OR length(geom) = 0 THEN NULL
      ELSE hex(geom)
    END AS geometryHex
  FROM statistical_area_2_higher_geographies_2019_generalised
  WHERE REGC2019_V1_00_NAME = 'Waikato Region'
  ORDER BY SA22019_V1_00;
`;

const statsNzRows = JSON.parse(
  execFileSync(
    "sqlite3",
    ["-json", fileURLToPath(statsNzFileUrl), statsNzQuery],
    {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    },
  ),
);
```

`hex()` 会把每个 byte 展开成两个字符，Waikato 的查询输出会明显大于原始二进制内容。这里把 `execFileSync()` 的输出缓冲区设为 32 MiB，避免完整查询结果被默认缓冲区截断。

`statsNzRows` 仍然只是数据库记录。继续把每一行整理成 GeoJSON feature：`wkx` 解析 WKB，`id` 和 `properties.sa2Id` 都保留同一个地区编号，其他属性用于识别和展示地区。

```js
const geometryFeatures = statsNzRows.map((row) => {
  const sa2Id = String(row.sa2Id).trim();

  return {
    type: "Feature",
    id: sa2Id,
    geometry: row.geometryHex
      ? wkx.Geometry.parse(geoPackageWkb(row.geometryHex)).toGeoJSON()
      : null,
    properties: {
      sa2Id,
      name: row.name,
      territorialAuthority: row.territorialAuthority,
      regionCode: String(row.regionCode).trim(),
      region: row.region,
      landAreaSqKm: Number(row.landAreaSqKm),
    },
  };
});

const missingGeometryFeatures = geometryFeatures.filter(
  (feature) => feature.geometry === null,
);

console.log(
  JSON.stringify(
    {
      region: regionName,
      areaCount: geometryFeatures.length,
      missingGeometry: missingGeometryFeatures.length,
      firstFeature: geometryFeatures[0]
        ? {
            id: geometryFeatures[0].id,
            name: geometryFeatures[0].properties.name,
            geometryType: geometryFeatures[0].geometry?.type ?? null,
          }
        : null,
    },
    null,
    2,
  ),
);
```

这时先检查脚本语法，再运行 geometry 读取：

```bash
node --check data/scripts/prepare-map-chart-sample.mjs
node data/scripts/prepare-map-chart-sample.mjs
```

运行结果为：

```json
{
  "region": "Waikato Region",
  "areaCount": 240,
  "missingGeometry": 0,
  "firstFeature": {
    "id": "166500",
    "name": "Colville",
    "geometryType": "MultiPolygon"
  }
}
```

脚本从 Stats NZ（区域） 读取到 240 个 Waikato SA2，且没有缺失 geometry。第一条记录成功转换为 `MultiPolygon`，说明 GeoPackage header 与 WKB 的分界计算正确。此时得到的是 Stats NZ（区域） 的完整 Region 范围，还没有判断哪些 SA2 在 MBIE（租金） 租金数据中出现。

#### 3.3 关联 MBIE（租金） 记录

地图不能直接把 240 个 Stats NZ（区域） SA2 都当作租金地区。项目的可发布范围要求 SA2 同时具有 Stats NZ（区域） geometry 和 MBIE（租金） 观测，因此下一步是在现有脚本中读取 MBIE（租金） CSV，并用 `sa2Id` 完成关联。

一次 CSV 读取需要得到三组信息：

```text
mbieWaikatoSa2Ids   Waikato 中曾经出现过 MBIE（租金） 观测的 SA2
currentMetrics      2026-04-01、ALL / ALL 的地图指标
historyObservations Greensboro 在 ALL / ALL 下的季度历史
```

先扩展文件顶部的 import 区域，让脚本可以流式读取 CSV：

```js
import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";

import { parse } from "csv-parse";
import wkx from "wkx";
```

在 `statsNzFileUrl` 声明结束后加入 MBIE（租金） 文件位置：

```js
const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);
```

脚本原有的 `regionName` 保持不变。在它后面加入第 2 节已经确定的季度、地区和分类条件：

```js
const latestPeriod = "2026-04-01";
const initialSa2Id = "179900";
const dwellingType = "ALL";
const bedroomCategory = "ALL";
```

MBIE（租金） 字段需要统一去掉首尾空白；数值字段中的空字符串和 `NULL` 都表示缺失，不能改写成 `0`。在这些常量后、`geoPackageWkb()` 前加入两个读取函数：

```js
function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}

function sourceNumber(record, field) {
  const value = sourceValue(record, field);

  if (value === "" || value === "NULL") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }

  return number;
}
```

文件上半部分到这里准备完成。脚本下半部分继续保留 `geometryFeatures` 和 `missingGeometryFeatures`，删除第 3.2 节末尾只检查 geometry 的 `console.log(...)`。从 `missingGeometryFeatures` 后面开始，新的代码按照“读取 MBIE（租金） → 组合指标 → 输出检查”的顺序连续加入。

先把 Waikato 的 SA2 编号整理成集合，并建立三组结果容器。CSV 使用 stream 逐条读取，不需要一次把 226,080 条记录全部保存在内存中：

```js
const waikatoSa2Ids = new Set(
  geometryFeatures.map((feature) => feature.id),
);

const mbieWaikatoSa2Ids = new Set();
const currentMetrics = new Map();
const historyObservations = [];

const parser = createReadStream(mbieFileUrl).pipe(
  parse({
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }),
);
```

读取每条记录时，先收集所有能够与 Waikato geometry 对应的六位 `Location Id`。这个判断发生在分类筛选之前，因为一个 SA2 只要存在有效 MBIE（租金） 观测，就属于关联范围。

随后只让 `ALL / ALL` 记录继续参与当前指标和历史整理：最新季度记录进入 `currentMetrics`，Greensboro 的各季度记录进入 `historyObservations`。

```js
for await (const record of parser) {
  const period = sourceValue(record, "TimeFrame");
  const sa2Id = sourceValue(record, "Location Id");
  const recordDwellingType = sourceValue(record, "Dwelling Type");
  const recordBedroomCategory = sourceValue(record, "Number Of Beds");

  if (/^\d{6}$/.test(sa2Id) && waikatoSa2Ids.has(sa2Id)) {
    mbieWaikatoSa2Ids.add(sa2Id);
  }

  if (
    recordDwellingType !== dwellingType ||
    recordBedroomCategory !== bedroomCategory
  ) {
    continue;
  }

  const reportedBonds = sourceNumber(record, "Total Bonds");

  if (period === latestPeriod && waikatoSa2Ids.has(sa2Id)) {
    currentMetrics.set(sa2Id, {
      medianRent: sourceNumber(record, "Median Rent"),
      reportedBonds,
    });
  }

  if (sa2Id === initialSa2Id) {
    historyObservations.push({
      period,
      geometricMeanRent: sourceNumber(record, "Geometric Mean Rent"),
      reportedBonds,
    });
  }
}

historyObservations.sort((left, right) =>
  left.period.localeCompare(right.period),
);
```

CSV 读取结束后，`mbieWaikatoSa2Ids` 表示 Waikato geometry 与 MBIE（租金） 观测的交集。用它筛选 `geometryFeatures`，再把当前季度指标加入每个保留的 feature。某个可发布地区缺少当前切片时仍然保留边界，对应指标保持 `null`。

```js
const publishableFeatures = geometryFeatures.filter(
  (feature) =>
    feature.geometry !== null && mbieWaikatoSa2Ids.has(feature.id),
);

const mapFeatures = publishableFeatures.map((feature) => {
  const metric = currentMetrics.get(feature.id);

  return {
    ...feature,
    properties: {
      ...feature.properties,
      medianRent: metric?.medianRent ?? null,
      reportedBonds: metric?.reportedBonds ?? null,
    },
  };
});

const initialMapFeature = mapFeatures.find(
  (feature) => feature.id === initialSa2Id,
);
```

最后加入新的检查输出。它把 Stats NZ（区域） 原始范围、MBIE（租金） 关联范围、当前切片和 Greensboro 历史分别列出，便于判断每一步的记录是否完整：

```js
console.log(
  JSON.stringify(
    {
      region: regionName,
      sourceAreaCount: geometryFeatures.length,
      associatedAreaCount: mbieWaikatoSa2Ids.size,
      publishableAreaCount: mapFeatures.length,
      missingGeometry: missingGeometryFeatures.length,
      mapSlice: {
        period: latestPeriod,
        dwellingType,
        bedroomCategory,
        metricRecords: currentMetrics.size,
        missingMetricRecords: mapFeatures.length - currentMetrics.size,
        initialFeature: initialMapFeature
          ? {
              id: initialMapFeature.id,
              name: initialMapFeature.properties.name,
              medianRent: initialMapFeature.properties.medianRent,
              reportedBonds: initialMapFeature.properties.reportedBonds,
            }
          : null,
      },
      history: {
        sa2Id: initialSa2Id,
        observations: historyObservations.length,
        start: historyObservations.at(0)?.period ?? null,
        end: historyObservations.at(-1)?.period ?? null,
      },
    },
    null,
    2,
  ),
);
```

完成这些改动后，再检查语法并运行脚本：

```bash
node --check data/scripts/prepare-map-chart-sample.mjs
node data/scripts/prepare-map-chart-sample.mjs
```

运行结果为：

```json
{
  "region": "Waikato Region",
  "sourceAreaCount": 240,
  "associatedAreaCount": 222,
  "publishableAreaCount": 222,
  "missingGeometry": 0,
  "mapSlice": {
    "period": "2026-04-01",
    "dwellingType": "ALL",
    "bedroomCategory": "ALL",
    "metricRecords": 162,
    "missingMetricRecords": 60,
    "initialFeature": {
      "id": "179900",
      "name": "Greensboro",
      "medianRent": 350,
      "reportedBonds": 171
    }
  },
  "history": {
    "sa2Id": "179900",
    "observations": 26,
    "start": "2020-01-01",
    "end": "2026-04-01"
  }
}
```

240 个 Stats NZ（区域） SA2 中有 222 个能够关联到 MBIE（租金） 观测，而且这些地区都有 geometry，因此关联范围与可发布范围数量一致。最新 `ALL / ALL` 切片覆盖其中 162 个地区；另外 60 个地区保留边界，但当前租金指标为缺失。Greensboro 取得 26 个季度的连续分类记录，范围与第 2 节确定的数据周期一致。

### 4. 建立地图与图表技术样例页面

第 3 节的脚本已经得到 Waikato 的 222 个可发布 SA2，以及 Greensboro 的 26 条季度记录。不过，这些数据目前只保存在 Node.js 进程的变量中，脚本结束后就不会继续保留。终端输出的是检查用的摘要，也没有包含全部边界坐标和历史记录，React 页面无法从这份摘要取得地图和图表需要的数据。

因此，建立页面先从打通数据入口开始：让脚本把已经整理好的结果保存为 JSON，再确认浏览器能够请求到这些内容。有了这个入口，页面才能加载同一份地图切片和历史记录。

#### 4.1 将关联结果保存为浏览器可读取的文件

Vite 的 `public` 目录用于提供静态文件。例如，放在 `public/data/` 下面的文件可以通过浏览器中的 `/data/` 路径访问。当前样例需要一份地区边界和一份单地区历史，因此把输出放在 `public/data/spike/map-chart/`，分别命名为 `waikato.geo.json` 和 `179900-history.json`。

继续修改 `data/scripts/prepare-map-chart-sample.mjs`。写入文件需要 Node.js 的 `mkdir` 和 `writeFile`，所以在文件顶部现有的 `createReadStream` import 后面加入：

```js
import { mkdir, writeFile } from "node:fs/promises";
```

脚本中的 `mapFeatures` 已经包含地区边界和最新季度指标。GeoJSON 用 `FeatureCollection` 将多个 feature 组合成一个完整对象，因此可以直接包装这组结果。历史数据则需要同时保存 SA2 编号、分类和指标名称，让读取方能够判断这些季度记录属于哪个数据切片。

在脚本末尾现有的 `console.log(...)` 结束后，接着加入下面两组数据对象。原有检查输出继续保留，用于核对每次生成前的关联结果：

```js
const mapData = {
  type: "FeatureCollection",
  features: mapFeatures,
};

const historyData = {
  sa2Id: initialSa2Id,
  dwellingType,
  bedroomCategory,
  metric: "geometricMeanRent",
  observations: historyObservations,
};
```

两个对象使用的仍然是第 3 节整理出的数据：地图保留当前指标缺失的地区边界，历史保留源记录中的缺失值。保存文件只改变数据的存放位置，不重新计算租金。

现在已经有了要保存的内容，接着确定文件位置。这里和源文件路径一样使用 `import.meta.url`，使输出位置相对于脚本文件确定，不受终端当前目录影响。在 `historyData` 声明后继续加入：

```js
const outputDirectoryUrl = new URL(
  "../../public/data/spike/map-chart/",
  import.meta.url,
);

const mapFileUrl = new URL("waikato.geo.json", outputDirectoryUrl);
const historyFileUrl = new URL(
  `${initialSa2Id}-history.json`,
  outputDirectoryUrl,
);

await mkdir(outputDirectoryUrl, { recursive: true });

await writeFile(mapFileUrl, JSON.stringify(mapData), "utf8");
await writeFile(historyFileUrl, JSON.stringify(historyData), "utf8");
```

`mkdir()` 先建立输出目录，`recursive: true` 允许上级目录尚未存在，也允许重复运行时沿用已有目录。`JSON.stringify()` 把 JavaScript 对象转成 JSON 文本；再次运行脚本时，两份文件会根据源数据重新生成。

写入完成后，继续在文件末尾加入生成摘要。只有两次 `writeFile()` 都成功结束，才会输出这些路径：

```js
console.log(
  JSON.stringify(
    {
      mapFile: fileURLToPath(mapFileUrl),
      mapFeatures: mapData.features.length,
      historyFile: fileURLToPath(historyFileUrl),
      historyObservations: historyData.observations.length,
    },
    null,
    2,
  ),
);
```

代码准备好后，在项目根目录检查语法并运行脚本：

```bash
node --check data/scripts/prepare-map-chart-sample.mjs
node data/scripts/prepare-map-chart-sample.mjs
```

这次运行应先显示原有的关联统计，再显示文件生成摘要。使用当前源文件时，摘要中的 `mapFeatures` 应为 `222`，`historyObservations` 应为 `26`；两条路径应指向项目的 `public/data/spike/map-chart/` 目录。这两个数量来自第 3 节的实际关联结果，用来确认写出的内容与内存结果一致。

文件生成后，启动 Vite：

```bash
npm run dev
```

使用终端实际显示的本地地址，在浏览器分别打开下面两条路径。如果 Vite 使用默认端口，对应地址为：

```text
http://localhost:5173/data/spike/map-chart/waikato.geo.json
http://localhost:5173/data/spike/map-chart/179900-history.json
```

地图文件应能看到 `type: "FeatureCollection"` 和 `features` 数组；历史文件应能看到 `sa2Id: "179900"`、`ALL / ALL` 分类和 `observations` 数组。这里需要确认浏览器返回的是对应 JSON，而不是应用首页或找不到文件的响应。只有浏览器能取得这两份数据，页面的数据入口才算打通。

实际运行后，生成摘要中的地图 feature 数量为 `222`，历史记录数量为 `26`。浏览器分别打开两个地址后，地图文件返回 `FeatureCollection` 和 `MultiPolygon` 坐标，历史文件返回 `179900` 的 `ALL / ALL` 季度记录。数据文件的生成和浏览器访问均已确认。

#### 4.2 为页面接入地图工具和底图

浏览器能够取得边界坐标，但 React 本身不会将坐标绘制成地图。项目选定的 `MapLibre GL JS` 负责绘制，`react-map-gl/maplibre` 则将地图包装成 React 组件。道路、地名等底图内容来自 MapTiler Cloud，与本地生成的 SA2 边界数据各自独立。

当前要先显示地图，因此在项目根目录安装负责地图绘制和 React 组件接入的两个依赖：

```bash
npm install react-map-gl maplibre-gl
npm ls react-map-gl maplibre-gl
```

组件从 `react-map-gl/maplibre` 导入，但安装的 npm 包名是 `react-map-gl`。这一对应关系来自 [react-map-gl 官方示例](https://github.com/visgl/react-map-gl#example)。安装结束后，检查 `npm ls` 能否列出两个包，具体版本以本次生成的 `package-lock.json` 为准。

地图组件还需要一个底图样式地址。样式文件描述地图使用的图层、字体和瓦片来源，MapLibre 会根据它继续请求底图资源。MapTiler 的地址需要附带当前项目的 API key，因此先登录 [MapTiler Cloud](https://cloud.maptiler.com/)，在 API keys 中为本地开发创建一个 key。

这个 key 会随浏览器请求发送出去。按照 [MapTiler 的本地测试说明](https://docs.maptiler.com/guides/developer/credentials/api-key/#local-testing)，当前通过 `http://localhost:5173` 访问页面时，在 key 的 Allowed HTTP origins 中填写 `localhost`，不带协议和端口。如果通过 `127.0.0.1` 访问，则填写 `127.0.0.1`。

在项目根目录的 `.env.local` 中保留已有配置，并加入真实 key：

```dotenv
VITE_MAPTILER_KEY=VMpKWUQFK2DPrKiLxMn0
```

`.env.local` 已受 `.gitignore` 排除。为了让项目说明保留变量名称，在 `.env.example` 原有内容后增加一个空值：

```dotenv
VITE_MAPTILER_KEY=
```

Vite 会将 `VITE_` 开头的变量暴露给浏览器代码，所以这里使用的是受来源限制的浏览器 key。环境变量修改后，需要停止当前 Vite 进程并重新启动，页面才能读到新值。

#### 4.3 在样例页面显示底图

现在可以建立承载地图的页面。它使用现有应用外壳，在页面中留出一个有明确高度的区域，再让 MapLibre 在其中绘制底图。当前样例范围是 Waikato，因此初始视角放在 Waikato 附近。

项目已有的 `src/pages/` 保存与路由对应的页面，因此在这里创建 `src/pages/MapChartPage.tsx`，与 Home、Methodology 页面保持相同的组织方式。

`Map` 在页面中创建地图，`NavigationControl` 提供缩放和方向按钮，CSS 负责按钮和署名控件的样式。本次安装的 MapLibre GL JS 为 `6.16.0`，地图瓦片的处理使用一个独立的 Worker，也就是在浏览器后台执行计算的脚本。Vite 需要打包这份脚本，并将生成的地址交给 MapLibre，所以在文件顶部一起导入：

```tsx
import Map, { NavigationControl } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
```

`?worker&url` 让 Vite 将 Worker 打包，并返回它的访问地址。地图创建之前需要知道这个地址，因此在所有 import 之后、页面函数之前加入：

```tsx
setWorkerUrl(workerUrl);
```

这对应 [MapLibre 官方的 Vite 接入方式](https://maplibre.org/maplibre-gl-js/docs/#installation)。

地图首先需要实际的绘制空间。页面给外层 `div` 设置高度，再让 `Map` 的宽高占满它。为了打开页面时就能看到 Waikato，使用附近的经纬度 `175.3, -37.8` 作为初始视角，缩放级别设为 `7`。这是显示位置，不是用来计算 SA2 边界的坐标。

底图内容通过 `mapStyle` 指定，它使用 [MapTiler Maps API](https://docs.maptiler.com/cloud/api/maps/) 的样式地址，并附带刚才配置的 key。署名控件保持显示，用于呈现底图资源的来源。页面先读取 key；缺少配置时给出提示，有配置时才创建地图。

Worker 地址配置好后，接着定义页面组件：

```tsx
export function MapChartPage() {
  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;

  if (!mapTilerKey) {
    return <p>Set VITE_MAPTILER_KEY to load the basemap.</p>;
  }

  return (
    <section className="space-y-6">
      <title>Map and chart sample | RoostMap</title>

      <div>
        <h1 className="text-3xl font-semibold">Waikato rental data sample</h1>
        <p className="mt-2 text-muted-foreground">
          2026-04-01 · All dwelling types · All bedroom categories
        </p>
      </div>

      <div className="h-[420px] overflow-hidden rounded-xl border sm:h-[560px]">
        <Map
          initialViewState={{
            longitude: 175.3,
            latitude: -37.8,
            zoom: 7,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={`https://api.maptiler.com/maps/streets-v4/style.json?key=${mapTilerKey}`}
          attributionControl={{ compact: false }}
        >
          <NavigationControl position="top-right" />
        </Map>
      </div>
    </section>
  );
}
```

`initialViewState` 只设置地图打开时的视角；拖动和缩放由地图组件继续处理。此时显示的道路和地名来自 MapTiler，页面还没有读取本地的 SA2 文件。

页面组件还没有路由入口。继续在 `src/app/router/routes.tsx` 的 import 区域加入：

```tsx
import { MapChartPage } from "@/pages/MapChartPage";
```

现有路由的页面都放在根路径的 `children` 数组中。样例也放在同一层，位于 `methodology` 后面、通配路径 `*` 前面；这一段的顺序为：

```tsx
          {
            path: "methodology",
            Component: MethodologyPage,
          },
          {
            path: "spike/map-chart",
            Component: MapChartPage,
          },
          {
            path: "*",
            Component: NotFoundPage,
          },
```

路由建立后，页面已经有访问地址，但顶部导航还没有它的入口。现有 `src/components/layout/AppShell.tsx` 通过 `navigationItems` 生成导航链接，因此沿用这组配置加入 MapChart。该数组现在包含：

```tsx
const navigationItems = [
  { label: "Home", to: "/" },
  { label: "Methodology", to: "/methodology" },
  { label: "MapChart", to: "/spike/map-chart" },
];
```

`to` 使用以 `/` 开头的站点路径，与现有两项保持一致。

重新启动开发服务器后，点击顶部 MapChart 进入样例页面。此时应先确认页面标题、Waikato 附近的底图、缩放按钮和底部署名能够显示，并且拖动和缩放有效。再点击 Home、Methodology 和 MapChart，确认能够往返切换，当前链接的高亮随页面变化。如果显示缺少 key 的提示，检查 `.env.local` 和 Vite 是否已经重启；如果底图资源返回 `401` 或 `403`，检查 MapTiler key、允许来源和账户可用状态。

#### 4.4 在页面中读取样例数据

底图来自 MapTiler，而 SA2 边界和租金记录来自本地两份 JSON。现在页面需要发出请求，并区分数据尚在加载、请求失败和成功取得数据这几种状态。

先解决如何读取文件。页面将使用边界的 `features` 和历史的 `observations`，所以先用 TypeScript 描述这两份文件实际包含的字段，让读取结果在页面中有明确的类型。

GeoJSON 已经有现成的类型定义，不需要重新描述坐标数组。在项目根目录加入只供 TypeScript 使用的类型包：

```bash
npm install -D @types/geojson
npm ls @types/geojson
```

现有 `src/features/explore/` 负责地图探索相关功能，页面使用的样例数据读取逻辑放在这个功能目录中， 创建 `src/features/explore/sample-data.ts`。

地图中的每个 feature 都有一组地区属性，`FeatureCollection` 则表示这些 feature 的集合；历史文件保存地区编号、分类和季度记录。先在文件中描述它们：

```ts
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";

type AreaProperties = {
  sa2Id: string;
  name: string;
  territorialAuthority: string;
  regionCode: string;
  region: string;
  landAreaSqKm: number;
  medianRent: number | null;
  reportedBonds: number | null;
};

type MapData = FeatureCollection<Polygon | MultiPolygon, AreaProperties>;

type HistoryData = {
  sa2Id: string;
  dwellingType: string;
  bedroomCategory: string;
  metric: "geometricMeanRent";
  observations: {
    period: string;
    geometricMeanRent: number | null;
    reportedBonds: number | null;
  }[];
};
```

`FeatureCollection<Polygon | MultiPolygon, AreaProperties>` 表示：集合里的边界可以是多边形或多重多边形，每个 feature 的属性遵循 `AreaProperties`。`number | null` 则保留租金和记录数量缺失的可能性。这些类型检查的是页面代码如何使用数据，不会在运行时验证 JSON。

页面需要同时取得地图和历史文件，因此用 `Promise.all()` 并行发出两个请求，再把结果作为一组数据返回。`fetch()` 收到 HTTP 错误时不会自动抛出异常，所以先检查响应的 `ok`，成功后再用 `json()` 解析内容。

读取函数还接收一个取消信号 `signal`，并传给两个请求，使调用方取消读取时能够中止网络请求。继续在类型声明后加入 `loadSampleData()`：

```ts
export async function loadSampleData(signal: AbortSignal) {
  const [mapResponse, historyResponse] = await Promise.all([
    fetch("/data/spike/map-chart/waikato.geo.json", { signal }),
    fetch("/data/spike/map-chart/179900-history.json", { signal }),
  ]);

  if (!mapResponse.ok || !historyResponse.ok) {
    throw new Error("Could not load the map and history data files.");
  }

  const map: MapData = await mapResponse.json();
  const history: HistoryData = await historyResponse.json();

  return { map, history };
}
```

现在调用 `loadSampleData()` 就能取得 `{ map, history }`，但请求需要时间，也可能失败。React 页面需要知道请求是否结束，并在结果到达时重新渲染。

项目选定的 TanStack Query 负责保存这些请求状态和返回结果：开始读取时标记为等待，成功时保存数据，失败时保存错误。页面读取这些状态来决定显示内容，因此在这里安装它：

```bash
npm install @tanstack/react-query
npm ls @tanstack/react-query
```

读取函数已经准备好，现在需要让 React 页面能够使用查询客户端。`QueryClient` 保存请求状态和返回结果，这份保存下来的结果就是查询缓存；`QueryClientProvider` 将客户端提供给它内部的组件，内部组件才能调用 `useQuery()`。

异步数据管理属于应用级配置，现有 `src/app/providers/` 就负责这一类依赖的接入。因此在这里创建 `src/app/providers/QueryProvider.tsx`，为应用提供同一个客户端。

先导入组件内容类型和查询工具：

```tsx
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
```

客户端创建在组件之外，组件重新渲染时就不会重新创建缓存。这个 Provider 接收 `children`，也就是需要使用查询的内部组件，并用 `QueryClientProvider` 包住它们。在 import 后继续加入：

```tsx
const queryClient = new QueryClient();

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Provider 只有进入组件树才会生效。现有 `src/app/App.tsx` 负责渲染 `RouterProvider`，在这里接入查询 Provider，可以让路由中的各个页面共用同一个客户端，切换页面时也保留查询缓存。

在 `App.tsx` 中导入 `QueryProvider`，并让它包住原有的 `RouterProvider`。这个文件的内容为：

```tsx
import { RouterProvider } from "react-router/dom";

import { QueryProvider } from "@/app/providers/QueryProvider";
import { router } from "@/app/router/router";

function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export default App;
```

此时的组件关系是：

```text
App
└─ QueryProvider
   └─ RouterProvider
      └─ 应用布局和当前页面
```

页面已经处于 Provider 内部，可以直接连接读取函数。在 `src/pages/MapChartPage.tsx` 的 import 区域加入：

```tsx
import { useQuery } from "@tanstack/react-query";

import { loadSampleData } from "@/features/explore/sample-data";
```

`useQuery()` 会通过上层 Provider 找到客户端，执行读取函数并取得状态。`queryFn` 指定怎样取得数据，`queryKey` 则给这组请求结果一个稳定名称，让客户端能够找到对应的缓存。当前只读取固定的两份文件，因此使用 `map-chart-sample` 标识这一组结果。

`useQuery()` 是 React Hook，需要在组件每次渲染时保持相同的调用顺序。因此在 `MapChartPage()` 内、原有 `const mapTilerKey = ...` 后面、缺少 key 的条件返回之前加入：

```tsx
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["map-chart-sample"],
    queryFn: ({ signal }) => loadSampleData(signal),
    retry: false,
  });
```

查询会把取消信号交给 `loadSampleData()`。这里设置 `retry: false`，失败时直接显示错误，由用户点击按钮重新请求。[TanStack Query 官方入门](https://tanstack.com/query/latest/docs/framework/react/quick-start)提供了客户端、Provider 和查询的基本用法。

接下来根据返回状态决定页面内容：`isPending` 表示尚未取得结果，`isError` 表示请求失败，`error` 保存失败原因，`refetch()` 用于再次读取。只有请求成功，才读取 `data` 中的两组记录；如果数组为空，则显示没有数据的提示。

这段判断放在原有 `if (!mapTilerKey) { ... }` 结束后、绘制页面的 `return (...)` 之前：

```tsx
  if (isPending) {
    return <p>Loading the Waikato sample data…</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p>{error.message}</p>
        <button
          className="rounded-md border px-4 py-2"
          onClick={() => void refetch()}
          type="button"
        >
          Retry loading data
        </button>
      </div>
    );
  }

  if (data.map.features.length === 0 || data.history.observations.length === 0) {
    return <p>No map or history observations are available for this sample.</p>;
  }
```

请求成功且数据非空后，页面继续显示底图。现在需要确认 React 实际取得了什么，因此把边界数量、地区编号、分类和历史记录数量显示在底图下方。下面的摘要放在现有地图容器的结束 `</div>` 之后、最外层 `</section>` 之前：

```tsx
      <div className="rounded-xl border bg-card p-4 text-sm">
        <p>Loaded SA2 boundaries: {data.map.features.length}</p>
        <p>Initial SA2: {data.history.sa2Id}</p>
        <p>
          History classification: {data.history.dwellingType} /{" "}
          {data.history.bedroomCategory}
        </p>
        <p>Quarterly observations: {data.history.observations.length}</p>
      </div>
```

到这里，页面应当同时显示可交互的底图和来自两份 JSON 的摘要。打开样例页面后，在浏览器 Network 中确认两个本地 JSON 请求成功，并核对页面是否显示 `222` 个边界、初始 SA2 `179900`、`ALL / ALL` 和 `26` 条季度记录。

为了检查请求失败时的表现，在 Chrome 开发者工具的 Network request blocking 中临时屏蔽 `*179900-history.json*`，刷新页面，检查是否出现错误和重试按钮。取消屏蔽后点击重试，应重新取得数据。这个检查能够确认成功路径之外，请求失败也有明确反馈。

最后在项目根目录运行现有检查：

```bash
npm run check
```



### 5. 绘制 SA2 专题地图

第 4 节的页面已经能显示底图，并通过查询取得 `data.map`。页面摘要中的 `222` 表示文件包含 222 个 SA2，但这些坐标还没有交给地图绘制。

现在把这份 GeoJSON 接到现有地图上。先确认边界能够显示，再让颜色反映当前季度的 Median Rent，最后通过悬停和点击核对地图上的地区编号与记录是否一致。所有改动继续在 `src/pages/MapChartPage.tsx` 中进行，使用已经加载的 `data.map`。

#### 5.1 将 SA2 边界加入底图

MapLibre 将“数据从哪里来”和“数据怎样画出来”分开处理。`Source` 接收数据，`Layer` 决定画法：多边形内部由 `fill` 图层填充，边缘由 `line` 图层描绘。同一份 GeoJSON 可以同时供这两种图层使用。

这些组件来自已经安装的 `react-map-gl/maplibre`。扩展 `MapChartPage.tsx` 顶部原有的地图组件 import，并加入图层配置的类型：

```tsx
import Map, { Layer, NavigationControl, Source } from "react-map-gl/maplibre";
import type { LayerProps } from "react-map-gl/maplibre";
```

其余 import 和 `setWorkerUrl(workerUrl)` 保留。为了先确认坐标和范围，填充图层暂时使用统一的蓝绿色，再加一层细线区分相邻地区。在 `setWorkerUrl(workerUrl)` 后、`MapChartPage()` 函数之前定义：

```tsx
const sa2FillLayer: LayerProps = {
  id: "sa2-fill",
  type: "fill",
  paint: {
    "fill-color": "#57c8b8",
    "fill-opacity": 0.55,
  },
};

const sa2BoundaryLayer: LayerProps = {
  id: "sa2-boundaries",
  type: "line",
  paint: {
    "line-color": "#536a6b",
    "line-width": 1,
  },
};
```

图层的 `id` 是地图内部识别图层的名称，和单个地区的 `sa2Id` 不同。两个图层的配置放在组件之外，因为它们不需要随组件每次渲染重新创建。

页面的 `<Map>` 目前只有 `NavigationControl`。在它后面加入 `Source`，将 `data.map` 交给地图，并在 Source 内依次放置填充和边界图层。现有 `<Map>` 内的内容变为：

```tsx
          <NavigationControl position="top-right" />

          <Source id="sa2-areas" type="geojson" data={data.map}>
            <Layer {...sa2FillLayer} />
            <Layer {...sa2BoundaryLayer} />
          </Source>
```

这里的 `data` 来自页面现有的 `useQuery()`，不是再次读取文件。Layer 直接放在 Source 内部，会使用这个 Source 的数据。[Source](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/source) 和 [Layer](https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/layer) 的官方说明介绍了这种组合方式。

保存后打开现有样例页面，检查 Waikato 附近是否出现半透明填色和地区分界线。拖动、缩放时，边界应当跟随地图移动，而不是固定在页面某个位置。此时所有地区颜色相同，先用它确认 geometry 已经进入地图绘制流程。

#### 5.2 用当前季度租金区分地区

边界显示出来后，就可以让颜色表达租金。每个 feature 的 `properties.medianRent` 已经保存 `2026-04-01`、`ALL / ALL` 切片的每周租金中位数，不需要在页面重新计算。

颜色规则由 MapLibre 表达式描述。`get` 读取当前 feature 的属性，`case` 处理缺失值，`step` 按数值分段选择颜色。当前样例用每周 NZ$400 和 NZ$600 作为显示分段；这两个数只定义本次地图色阶，不代表官方租金等级或负担能力结论。

| Median Rent | 显示颜色 |
|---|---|
| 小于 NZ$400 | 蓝绿色 |
| NZ$400 至不足 NZ$600 | 黄色 |
| NZ$600 及以上 | 红棕色 |
| `null` | 灰色 |

缺少当前观测的地区仍然保留边界，因此需要单独的灰色，而不是把缺失租金当作零。将刚才的 `sa2FillLayer` 定义更新为下面的完整配置，`sa2BoundaryLayer` 继续沿用：

```tsx
const sa2FillLayer: LayerProps = {
  id: "sa2-fill",
  type: "fill",
  paint: {
    "fill-color": [
      "case",
      ["==", ["get", "medianRent"], null],
      "#94a3b8",
      [
        "step",
        ["number", ["get", "medianRent"]],
        "#57c8b8",
        400,
        "#e6ad5c",
        600,
        "#c45d55",
      ],
    ],
    "fill-opacity": 0.55,
  },
};
```

`number` 确认参与分段的是数字；外层 `case` 已经将 `null` 分到灰色，不会拿它参与租金分段。表达式读取的是每个 feature 自己的属性，因此同一图层就能为多个地区绘制不同颜色。[MapLibre 表达式说明](https://maplibre.org/maplibre-style-spec/expressions/)提供了这些运算的定义。

页面还需要说明颜色含义。紧接在地图容器的结束 `</div>` 后、原有数据摘要之前加入图例：

```tsx
<div className="space-y-2 text-sm">
  <p>Median weekly rent · NZD · 2026-04-01 · ALL / ALL</p>
  <ul className="flex flex-wrap gap-x-5 gap-y-2">
    <li>
      <span className="mr-2 inline-block h-3 w-3 bg-[#57c8b8]" />
      Under $400
    </li>
    <li>
      <span className="mr-2 inline-block h-3 w-3 bg-[#e6ad5c]" />
      $400–under $600
    </li>
    <li>
      <span className="mr-2 inline-block h-3 w-3 bg-[#c45d55]" />
      $600 and over
    </li>
    <li>
      <span className="mr-2 inline-block h-3 w-3 bg-[#94a3b8]" />
      No observation
    </li>
  </ul>
  <p className="text-muted-foreground">
    Sources: MBIE（租金） rental bond data; Stats NZ（区域） SA2 2019 boundaries.
  </p>
</div>
```

保存后，地图应当按租金区间显示不同颜色，同时保留灰色地区。

#### 5.3 核对悬停、选择与地区记录

地图已经能按租金填色，但仅看颜色还无法知道指针所在的多边形是哪一个地区。先让页面显示悬停地区的编号和名称，用它确认地图上的形状能够对应到原始记录。

地图事件返回的是渲染后的 feature。源文件虽然把 `id` 保存为字符串，但 MapLibre 的瓦片处理可能将数字形式的字符串转成数字。因此，不能仅凭源文件里的 `id` 类型，就假定事件中的类型也相同。

每个 feature 的 `properties.sa2Id` 已经保存了字符串编号。Source 的 `promoteId` 可以指定使用这个属性作为渲染时的 feature id，让地图事件、图层过滤和原始记录都使用同一个字符串编号。在 `MapChartPage.tsx` 中，为已有 Source 加上 `promoteId="sa2Id"`，此时这一段为：

```tsx
  <Source
    id="sa2-areas"
    type="geojson"
    data={data.map}
    promoteId="sa2Id"
  >
    <Layer {...sa2FillLayer} />
    <Layer {...sa2BoundaryLayer} />
  </Source>
```

Source 的 `id="sa2-areas"` 识别整份地图数据，`promoteId="sa2Id"` 则指定每个地区的身份字段。它不修改 JSON 文件，也不按数组位置重新编号。[MapLibre Source 说明](https://maplibre.org/maplibre-style-spec/sources/#promoteid)介绍了这个选项。

身份字段确定后，页面需要记住指针当前所在的地区。鼠标移动会改变这个值，所以用 React 状态保存它。在文件顶部加入 `useState`，并将现有地图类型 import 扩展为下面这一行：

```tsx
import { useState } from "react";
import type { LayerProps, MapLayerMouseEvent } from "react-map-gl/maplibre";
```

在 `MapChartPage()` 函数开头、现有 `useQuery()` 之前加入悬停状态：

```tsx
  const [hoveredSa2Id, setHoveredSa2Id] = useState<string | null>(null);
```

这里的字符串表示当前地区编号，`null` 表示没有悬停地区。状态只保存编号，名称和指标仍然从已经加载的 `data.map` 中取得。

接下来处理鼠标移动。地图还包含底图的道路和文字，因此把命中范围限定为 `sa2-fill`；这样事件中的 `features` 只包含命中的 SA2 填充图形。处理函数从第一个命中结果读取编号，没有命中时清除悬停状态。

这个函数放在页面已有的空数组判断结束后、绘制页面的 `return (...)` 之前：

```tsx
  function handleMapMove(event: MapLayerMouseEvent) {
    const id = event.features?.[0]?.id;
    setHoveredSa2Id(typeof id === "string" ? id : null);
  }
```

`MapLayerMouseEvent` 描述地图鼠标事件的类型。`event.features?.[0]` 允许指针没有命中地区；此时取不到编号，状态会恢复为 `null`。

函数有了，再把它交给现有 `<Map>`。在 Map 的属性区域加入命中范围、移动和离开事件，原有视角、样式地址、尺寸和署名配置保留。此时地图这一段为：

```tsx
<Map
  initialViewState={{
    longitude: 175.3,
    latitude: -37.8,
    zoom: 7,
  }}
  style={{ width: "100%", height: "100%" }}
  mapStyle={`https://api.maptiler.com/maps/streets-v4/style.json?key=${mapTilerKey}`}
  attributionControl={{ compact: false }}
  interactiveLayerIds={["sa2-fill"]}
  onMouseMove={handleMapMove}
  onMouseLeave={() => setHoveredSa2Id(null)}
>
  <NavigationControl position="top-right" />
  <Source
    id="sa2-areas"
    type="geojson"
    data={data.map}
    promoteId="sa2Id"
  >
    <Layer {...sa2FillLayer} />
    <Layer {...sa2BoundaryLayer} />
  </Source>
</Map>
```

`interactiveLayerIds` 设置前面说明的命中范围，`onMouseMove` 将事件交给处理函数；鼠标离开地图时，`onMouseLeave` 清除悬停编号。

现在编号能够随鼠标移动变化，还需要把它对应的名称显示出来。紧接在 `handleMapMove()` 函数后，根据当前编号查找原始 feature：

```tsx
  const hoveredArea = data.map.features.find(
    (feature) => feature.id === hoveredSa2Id,
  );
```

`find()` 返回编号相符的地区；没有悬停时找不到记录。因此在图例之后、原有数据摘要之前加入文字区域，分别显示地区信息或移动鼠标的提示：

```tsx
<div className="space-y-2 rounded-xl border bg-card p-4 text-sm">
  <p>
    Hovered SA2:{" "}
    {hoveredArea
      ? `${hoveredArea.id} · ${hoveredArea.properties.name}`
      : "Move the pointer over an area"}
  </p>
</div>
```

保存并刷新页面，先观察文字：指针移入填色地区时，应显示对应编号和名称；移到地区之外或离开地图时，应恢复提示。这一步用来确认“地图命中 → 字符串编号 → 原始记录”的关联。

文字能够识别地区后，再让地图本身突出同一个地区。在已有 Source 内、`<Layer {...sa2BoundaryLayer} />` 后面加入悬停线图层：

```tsx
<Layer
  id="sa2-hover"
  type="line"
  filter={["==", ["id"], hoveredSa2Id ?? ""]}
  paint={{ "line-color": "#2f6f9f", "line-width": 3 }}
/>
```

这个图层使用同一份 Source，但 `filter` 只保留编号等于 `hoveredSa2Id` 的地区。没有悬停时，`?? ""` 提供空字符串，不会命中任何 SA2。保存后，蓝色轮廓应当和下方显示的地区名称一起变化。

悬停状态在鼠标移开时会消失，阅读租金时则需要保留一个地区。为此加入点击选择：点击哪个地区，就保存哪个编号；鼠标继续移动不会改变这项选择。

在函数开头已有的 `hoveredSa2Id` 状态声明后，增加选择状态，初始编号沿用第 2 节确定的 Greensboro：

```tsx
  const [selectedSa2Id, setSelectedSa2Id] = useState("179900");
```

点击事件使用相同的命中范围。只有点击到地区时才更新选择，点击地区之外则保留原值。在 `handleMapMove()` 后、`hoveredArea` 查询之前加入：

```tsx
  function handleMapClick(event: MapLayerMouseEvent) {
    const id = event.features?.[0]?.id;

    if (typeof id === "string") {
      setSelectedSa2Id(id);
    }
  }
```

在现有 Map 的 `onMouseMove`、`onMouseLeave` 属性后加入点击回调：

```tsx
          onClick={handleMapClick}
```

与悬停记录一样，选中地区也通过编号回到原始数据。紧接在 `hoveredArea` 声明后加入：

```tsx
  const selectedArea = data.map.features.find(
    (feature) => feature.id === selectedSa2Id,
  );
```

这次需要显示名称、Median Rent 和 Reported Bonds。数值为 `null` 时显示没有观测，避免让缺失数据变成零租金。将下面的内容放入已有的悬停文字区域，接在 `Hovered SA2` 的 `</p>` 后、该区域结束的 `</div>` 前：

```tsx
        {selectedArea && (
          <>
            <h2 className="text-lg font-semibold">Selected SA2</h2>
            <p>{selectedArea.id} · {selectedArea.properties.name}</p>
            <p>
              Median weekly rent: {selectedArea.properties.medianRent === null
                ? "No observation"
                : `NZ$${selectedArea.properties.medianRent}`}
            </p>
            <p>Reported Bonds: {selectedArea.properties.reportedBonds ?? "No observation"}</p>
          </>
        )}
```

保存后，初始记录应为 `179900`、Greensboro、Median Rent `350`、Reported Bonds `171`，这些是第 3 节已经核对过的值。点击其他地区后，选中记录应发生变化；只移动鼠标时，悬停文字变化，但选中记录保持不变。

选中记录也需要在地图上保留标记。沿用悬停线图层的做法，在 Source 内的 `sa2-hover` 图层后加入选中线图层：

```tsx
            <Layer
              id="sa2-selected"
              type="line"
              filter={["==", ["id"], selectedSa2Id]}
              paint={{ "line-color": "#102a2d", "line-width": 4 }}
            />
```

选中图层按 `selectedSa2Id` 过滤，并最后绘制，使深色轮廓位于其他 SA2 图层上方。此时 Source 的子图层按“租金填色、普通边界、悬停轮廓、选中轮廓”排列，Source 上的 `promoteId="sa2Id"` 继续保留。

再观察同一组操作：悬停时名称和蓝色轮廓对应同一地区，点击后文字记录和深色轮廓对应同一地区，移开鼠标后选择仍然保留。点击灰色地区时，边界仍可选中，租金显示 `No observation`。

最后选取一个地区，用编号在地图 JSON 中找到原始 feature，核对名称、租金和 Reported Bonds，再把租金与图例分段对照。这样可以检查事件命中、文字数值和地图颜色是否确实来自同一条记录。

完成浏览器核对后，在项目根目录运行：

```bash
npm run lint
npm run build
```

检查通过并核对实际地图结果后，再记录本节的验证结论。

### 6. 连接地图选择与历史图表

选择地图中的 SA2 后，将同一个 `sa2Id` 交给 Recharts 显示季度历史，并验证分类切片、缺失季度、稀疏记录以及文字或表格结果。

地图已经通过 `selectedSa2Id` 保存选中的地区，但页面读取的历史文件只包含 Greensboro。选择其他地区后，要展示它自己的租金变化，首先需要能用这个编号找到它的季度记录。

现有数据准备脚本已经能完成边界读取、CSV 关联和文件生成，不过这些处理都连续写在文件顶层。

本节安排：

| 小节 | 内容 | 状态 |
|---|---|---|
| 6.1 整理数据准备脚本 | 按数据流封装读取、关联、摘要和写入功能 | 已完成 |
| 6.2 按 SA2 收集历史记录 | 收集 Waikato 各地区的季度记录，并核对地区数和记录总数 | 已完成 |
| 6.3 按季度整理各地区的历史 | 统一季度顺序，保留缺失季度和空数据 | 已完成 |
| 6.4 保存大区历史文件 | 生成 `waikato-history.json`，按 SA2 编号保存各地区历史 | 已完成 |
| 6.5 接入大区历史数据 | 页面加载大区文件，按选中编号取得对应地区记录 | 已完成 |
| 6.6 绘制历史图表并验证联动 | 显示选中地区的季度趋势，检查切换、缺失、稀疏和空数据 | 已完成 |

本节完成时，点击地图中的地区，历史图表和文字或表格记录应切换到同一个 SA2，并使用同一组住宅类型、卧室分类和历史指标。缺失值保留为缺失，加载失败和没有历史记录时有明确反馈。

#### 6.1 整理数据准备脚本

现有数据准备脚本 `data/scripts/prepare-map-chart-sample.mjs` 已经能完成边界读取、CSV 关联和文件生成。但当前的脚本内容执行逻辑较为混乱，对应后续的功能升级不容易统一管理，且不易阅读。 因此，我们先对现有的脚本依据数据流向做一次重构，并封装相关的功能函数。

按照脚本功能，主流程应该是：

```

 读取边界 → 扫描租金 CSV → 合并为地图数据 → 输出核对摘要 → 写出文件。
 
```

先定义 `main()` 

```js
async function main() {
  // 1. 读取边界 
  // 2. 扫描租金 CSV  
  // 3. 合并为地图数据  
  // 4. 输出核对摘要  
  // 5. 写出文件 
}
await main();
```

这样，直接能按数据流，在入口函数中调用相关的封装好的功能函数。

对通用数据、参数等，统一在脚本开头设置配置区域:

```js
// ─────────────────────────────────────────────
// 配置：数据源路径、输出路径与本次样例的筛选条件
// ─────────────────────────────────────────────

const statsNzFileUrl = new URL(
  "../raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg",
  import.meta.url,
);

const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);

// 保存到 public 目录，供开发服务器通过 /data/spike/map-chart/ 提供文件。
const outputDirectoryUrl = new URL(
  "../../public/data/spike/map-chart/",
  import.meta.url,
);

const regionName = "Waikato Region"; // 目标大区
const latestPeriod = "2026-04-01"; // 地图使用的季度
const initialSa2Id = "179900"; // 图表初始展示的 SA2
const dwellingType = "ALL"; // 住宅类型筛选
const bedroomCategory = "ALL"; // 卧室分类筛选

// ─────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────

async function main() {
  ...
}
await main();
```

接着按脚本数据流功能封装功能函数。

读取边界功能封装：GeoPackage 使用 SQLite 存储数据，这里通过 Node.js 内置的 `node:sqlite` 直接查询。在 import 区域引入 `DatabaseSync`，移除原来的 `node:child_process` 导入，无需安装新的依赖。

`readStatsNzRows()` 以只读方式打开 GeoPackage，按大区查询属性和 `geom` 字段。`geom` 直接返回 `Uint8Array` 字节数组；查询完成后关闭数据库，取得的行对象交给 `toGeometryFeature(row)` 转成 GeoJSON feature。

转换 geometry 时，`geoPackageWkb()` 先把字节数组转为 Buffer，便于读取头部，再按原有规则去掉 GeoPackage 头部和 envelope，取出 WKB。`toGeometryFeature()` 将它交给 `wkx` 转成 GeoJSON。三个函数分别负责查询记录、转换一行记录和提取几何数据；主流程将用 `readStatsNzRows().map(toGeometryFeature)` 得到完整的边界数组。

```js
// ─────────────────────────────────────────────
// 边界：读取 Stats NZ（区域） 的 SA2 数据并转换为 GeoJSON features
// ─────────────────────────────────────────────

/**
 * 使用 Node.js 内置 SQLite 接口，只读查询目标大区的 SA2 属性和边界。
 * geom 二进制字段直接返回 Uint8Array，供后续解析为 GeoJSON。
 * @returns {object[]} 数据库行对象数组
 */
function readStatsNzRows() {
  const query = `
    SELECT
      SA22019_V1_00 AS sa2Id,
      SA22019_V1_00_NAME AS name,
      TA2019_V1_00_NAME AS territorialAuthority,
      REGC2019_V1_00 AS regionCode,
      REGC2019_V1_00_NAME AS region,
      LAND_AREA_SQ_KM AS landAreaSqKm,
      geom
    FROM statistical_area_2_higher_geographies_2019_generalised
    WHERE REGC2019_V1_00_NAME = ?
    ORDER BY SA22019_V1_00;
  `;

  const database = new DatabaseSync(statsNzFileUrl, { readOnly: true });

  try {
    return database.prepare(query).all(regionName);
  } finally {
    database.close();
  }
}

/**
 * 将一行 SA2 数据库记录转换为 GeoJSON feature。
 * SA2 编号保持字符串，供后续与租金数据关联和地图选择使用。
 * @param {object} row readStatsNzRows 返回的一行记录
 * @returns {object} GeoJSON feature
 */
function toGeometryFeature(row) {
  const sa2Id = String(row.sa2Id).trim();

  return {
    type: "Feature",
    id: sa2Id,
    geometry: row.geom?.byteLength
      ? wkx.Geometry.parse(geoPackageWkb(row.geom)).toGeoJSON()
      : null,
    properties: {
      sa2Id,
      name: row.name,
      territorialAuthority: row.territorialAuthority,
      regionCode: String(row.regionCode).trim(),
      region: row.region,
      landAreaSqKm: Number(row.landAreaSqKm),
    },
  };
}

/**
 * 从 GeoPackage 几何数据中取出 WKB，供 wkx 解析。
 *
 * GeoPackage 几何由「头部 + 可选 envelope + WKB」组成：
 *   - 固定头部 8 字节：魔数 "GP"(2) + 版本(1) + flags(1) + SRS ID(4)
 *   - flags 的第 1~3 位表示 envelope 类型，决定 envelope 的坐标个数
 *   - envelope 中每个坐标值占 8 字节
 *
 * @param {Uint8Array} geometryBytes 从 geom 字段读取的 GeoPackage 几何字节
 * @returns {Buffer} 去掉头部和 envelope 之后的 WKB
 */
function geoPackageWkb(geometryBytes) {
  // 将字节数组转为 Buffer，以读取头部并截取 WKB，字节内容保持不变。
  const geometryBuffer = Buffer.from(geometryBytes);

  if (
    geometryBuffer.length < 8 ||
    geometryBuffer.toString("ascii", 0, 2) !== "GP"
  ) {
    throw new Error("Invalid GeoPackage geometry header");
  }

  const flags = geometryBuffer.readUInt8(3);
  const envelopeType = (flags >> 1) & 0b111;

  // 下标即 envelope 类型：0 无、1 XY、2 XYZ、3 XYM、4 XYZM。
  const envelopeCoordinateCounts = [0, 4, 6, 6, 8];
  const envelopeCoordinateCount = envelopeCoordinateCounts[envelopeType];

  if (envelopeCoordinateCount === undefined) {
    throw new Error(`Unsupported GeoPackage envelope type: ${envelopeType}`);
  }

  const headerLength = 8 + envelopeCoordinateCount * 8;
  return geometryBuffer.subarray(headerLength);
}
```

扫描租金 CSV功能封装：

有了边界编号，就可以扫描 MBIE（租金） CSV。`scanMbieCsv(waikatoSa2Ids)` 接收这个编号集合，逐行读取全国租金记录：先收集其中出现过的 Waikato 编号，再按住宅类型和卧室分类筛选，分别保存指定季度的地图指标和 Greensboro 的各季度历史。

循环中，`sourceValue()` 负责取出字段并去掉两端空白；需要租金或 Reported Bonds 数值时，`sourceNumber()` 先调用它取得文本，再转换成数字，来源空值保留为 `null`。

因此，`scanMbieCsv()` 负责读取和筛选，两项辅助函数负责字段转换。读取结束后，返回的对象同时包含地区编号集合、当前指标 Map 和初始地区历史数组，供下一阶段使用。

```js
/**
 * 流式扫描 MBIE（租金） CSV，同一次遍历收集三组结果：
 *   1. mbieWaikatoSa2Ids：MBIE（租金） 中出现过的 Waikato SA2 编号（关联范围，不限分类）
 *   2. currentMetrics：指定季度的地图指标，按 SA2 保存
 *   3. historyObservations：初始 SA2 的各季度历史，按日期升序
 *
 * @param {Set<string>} waikatoSa2Ids 目标大区的 SA2 编号集合
 * @returns {Promise<{
 *   mbieWaikatoSa2Ids: Set<string>,
 *   currentMetrics: Map<string, {medianRent: number|null, reportedBonds: number|null}>,
 *   historyObservations: {period: string, geometricMeanRent: number|null, reportedBonds: number|null}[],
 * }>}
 */
async function scanMbieCsv(waikatoSa2Ids) {
  const mbieWaikatoSa2Ids = new Set();
  const currentMetrics = new Map();
  const historyObservations = [];

  // 流式读取 CSV，按表头将每一行解析成字段对象。
  const parser = createReadStream(mbieFileUrl).pipe(
    parse({
      bom: true,
      columns: true,
      skip_empty_lines: true,
    }),
  );

  // parser 是异步数据流，for await 会等待下一条记录，直到文件读取结束。
  for await (const record of parser) {
    const period = sourceValue(record, "TimeFrame");
    const sa2Id = sourceValue(record, "Location Id");
    const recordDwellingType = sourceValue(record, "Dwelling Type");
    const recordBedroomCategory = sourceValue(record, "Number Of Beds");

    // 关联范围统计所有分类，因此在住宅类型和卧室分类筛选之前收集编号。
    if (/^\d{6}$/.test(sa2Id) && waikatoSa2Ids.has(sa2Id)) {
      mbieWaikatoSa2Ids.add(sa2Id);
    }

    // 后续地图指标和历史记录使用本次指定的住宅类型与卧室分类。
    if (
      recordDwellingType !== dwellingType ||
      recordBedroomCategory !== bedroomCategory
    ) {
      continue;
    }

    const reportedBonds = sourceNumber(record, "Total Bonds");

    // 地图只取指定季度，按 SA2 保存 Median Rent 和 Reported Bonds。
    if (period === latestPeriod && waikatoSa2Ids.has(sa2Id)) {
      currentMetrics.set(sa2Id, {
        medianRent: sourceNumber(record, "Median Rent"),
        reportedBonds,
      });
    }

    // 初始地区保留各季度的 Geometric Mean Rent 和 Reported Bonds。
    if (sa2Id === initialSa2Id) {
      historyObservations.push({
        period,
        geometricMeanRent: sourceNumber(record, "Geometric Mean Rent"),
        reportedBonds,
      });
    }
  }

  // 将初始地区历史按日期升序排列。
  historyObservations.sort((left, right) =>
    left.period.localeCompare(right.period),
  );

  return { mbieWaikatoSa2Ids, currentMetrics, historyObservations };
}

/**
 * 读取 CSV 字段并去掉两端空白；字段不存在时按空字符串处理。
 * @param {object} record CSV 解析出的一行记录
 * @param {string} field 字段名（CSV 表头）
 * @returns {string}
 */
function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}

/**
 * 读取 CSV 数值字段。
 * 来源中的空值（空字符串或 "NULL"）返回 null 而不是 0，
 * 避免「无数据」被误当成「数值为零」；非数字内容直接抛错。
 * @param {object} record CSV 解析出的一行记录
 * @param {string} field 字段名（CSV 表头）
 * @returns {number|null}
 */
function sourceNumber(record, field) {
  const value = sourceValue(record, field);

  if (value === "" || value === "NULL") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }

  return number;
}
```

合并为地图数据功能封装：

扫描完成后，已经有边界数组、出现过租金记录的地区编号，以及当前季度指标。`buildMapFeatures()` 接收这三项结果，先筛选同时具有 geometry 和 MBIE（租金） 观测的地区，再按 SA2 编号将当前指标附加到边界属性上。

某个地区即使缺少当前季度指标，只要符合上述地区范围，仍保留边界，并把缺失指标设为 `null`。函数返回的 `mapFeatures` 就是要保存的地图 features。

```js
// ─────────────────────────────────────────────
// 组装：合并边界与指标，生成可发布的地图 features
// ─────────────────────────────────────────────

/**
 * 生成可发布的地图 features。
 * 发布范围要求同时具有边界和 MBIE（租金） 观测，不以当前季度是否有指标为条件；
 * 当前指标按 SA2 附加到边界属性上，没有指标的地区保留 null。
 *
 * @param {object[]} geometryFeatures 目标大区的全部边界 features
 * @param {Set<string>} mbieWaikatoSa2Ids MBIE（租金） 中出现过的 SA2 编号
 * @param {Map<string, object>} currentMetrics 指定季度的指标，按 SA2 索引
 * @returns {object[]} 附带 medianRent / reportedBonds 的 features
 */
function buildMapFeatures(
  geometryFeatures,
  mbieWaikatoSa2Ids,
  currentMetrics,
) {
  return geometryFeatures
    .filter(
      (feature) =>
        feature.geometry !== null && mbieWaikatoSa2Ids.has(feature.id),
    )
    .map((feature) => {
      const metric = currentMetrics.get(feature.id);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          medianRent: metric?.medianRent ?? null,
          reportedBonds: metric?.reportedBonds ?? null,
        },
      };
    });
}
```

输出核对摘要功能封装：主要包括

地图 features 整理好后，需要核对处理前后的地区数量、当前指标覆盖情况和初始地区历史区间。`buildCheckSummary()` 接收这些已有结果，统计数量并找到 Greensboro 的当前指标，返回摘要对象。

参数较多，因此用一个对象传入，在函数参数中按属性名取出。主流程取得返回值后统一打印，便于运行脚本时核对各阶段的结果。

```js
// ─────────────────────────────────────────────
// 输出：核对摘要
// ─────────────────────────────────────────────

/**
 * 生成核对摘要：数据源与可发布地区数量、缺失边界和缺失指标的数量、
 * 初始地区的当前指标，以及初始地区历史的记录数和起止季度。
 *
 * @param {object} data
 * @param {object[]} data.geometryFeatures 目标大区的全部边界 features
 * @param {Set<string>} data.mbieWaikatoSa2Ids MBIE（租金） 中出现过的 SA2 编号
 * @param {object[]} data.mapFeatures 可发布的地图 features
 * @param {Map<string, object>} data.currentMetrics 指定季度的指标
 * @param {object[]} data.historyObservations 初始地区的历史观测
 * @returns {object}
 */
function buildCheckSummary({
  geometryFeatures,
  mbieWaikatoSa2Ids,
  mapFeatures,
  currentMetrics,
  historyObservations,
}) {
  const missingGeometryCount = geometryFeatures.filter(
    (feature) => feature.geometry === null,
  ).length;

  const initialMapFeature = mapFeatures.find(
    (feature) => feature.id === initialSa2Id,
  );

  return {
    region: regionName,
    sourceAreaCount: geometryFeatures.length,
    associatedAreaCount: mbieWaikatoSa2Ids.size,
    publishableAreaCount: mapFeatures.length,
    missingGeometry: missingGeometryCount,
    mapSlice: {
      period: latestPeriod,
      dwellingType,
      bedroomCategory,
      metricRecords: currentMetrics.size,
      missingMetricRecords: mapFeatures.length - currentMetrics.size,
      initialFeature: initialMapFeature
        ? {
          id: initialMapFeature.id,
          name: initialMapFeature.properties.name,
          medianRent: initialMapFeature.properties.medianRent,
          reportedBonds: initialMapFeature.properties.reportedBonds,
        }
        : null,
    },
    history: {
      sa2Id: initialSa2Id,
      observations: historyObservations.length,
      start: historyObservations.at(0)?.period ?? null,
      end: historyObservations.at(-1)?.period ?? null,
    },
  };
}

```

写出文件功能封装：主要包括

接着把结果保存为页面能够请求的文件。这里由一个 `writeOutputFiles(mapFeatures, historyObservations)` 函数完成：将地图 features 包装成 GeoJSON `FeatureCollection`，将初始地区历史与编号、分类和指标名称组成历史对象，再分别写入原有的两份文件。

`mkdir()` 和 `writeFile()` 都是异步操作，所以函数使用 `async`，并通过 `await` 等待写入完成。最后返回文件路径和记录数量，主流程再打印这份生成摘要。

```js
// ─────────────────────────────────────────────
// 文件写入
// ─────────────────────────────────────────────

/**
 * 组装地图 GeoJSON 与初始地区历史 JSON，创建输出目录并写入文件（覆盖同名文件）。
 * @param {object[]} mapFeatures 可发布的地图 features
 * @param {object[]} historyObservations 初始地区按日期升序的季度观测
 * @returns {Promise<object>} 文件路径与记录数量
 */
async function writeOutputFiles(mapFeatures, historyObservations) {
  // 地图使用的 GeoJSON FeatureCollection。
  const mapData = {
    type: "FeatureCollection",
    features: mapFeatures,
  };

  // 图表使用的初始地区历史数据。
  const historyData = {
    sa2Id: initialSa2Id,
    dwellingType,
    bedroomCategory,
    metric: "geometricMeanRent",
    observations: historyObservations,
  };

  const mapFileUrl = new URL("waikato.geo.json", outputDirectoryUrl);
  const historyFileUrl = new URL(
    `${initialSa2Id}-history.json`,
    outputDirectoryUrl,
  );

  await mkdir(outputDirectoryUrl, { recursive: true });

  await writeFile(mapFileUrl, JSON.stringify(mapData), "utf8");
  await writeFile(historyFileUrl, JSON.stringify(historyData), "utf8");

  return {
    mapFile: fileURLToPath(mapFileUrl),
    mapFeatures: mapData.features.length,
    historyFile: fileURLToPath(historyFileUrl),
    historyObservations: historyData.observations.length,
  };
}
```

主程序函数实现完整的数据流逻辑：

```js
async function main() {
  // 1. 读取 Stats NZ（区域） 边界，并建立 Waikato SA2 编号集合。
  const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
  const waikatoSa2Ids = new Set(geometryFeatures.map((feature) => feature.id));

  // 2. 扫描 MBIE（租金） CSV，收集关联范围、当前季度指标和初始地区历史。
  const { mbieWaikatoSa2Ids, currentMetrics, historyObservations } =
    await scanMbieCsv(waikatoSa2Ids);

  // 3. 合并边界与指标，得到可发布的地图 features。
  const mapFeatures = buildMapFeatures(
    geometryFeatures,
    mbieWaikatoSa2Ids,
    currentMetrics,
  );

  // 4. 输出核对摘要，用于检查关联范围、指标覆盖情况和历史区间。
  const checkSummary = buildCheckSummary({
    geometryFeatures,
    mbieWaikatoSa2Ids,
    mapFeatures,
    currentMetrics,
    historyObservations,
  });
  console.log(JSON.stringify(checkSummary));

  // 5. 写出地图与历史文件，写入成功后再输出文件路径和记录数量。
  const writeResult = await writeOutputFiles(mapFeatures, historyObservations);
  console.log(JSON.stringify(writeResult));
}
```

完整脚本结构和引用如下：

```js
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { parse } from "csv-parse";
import wkx from "wkx";

// ─────────────────────────────────────────────
// 配置：数据源路径、输出路径与本次样例的筛选条件
// ─────────────────────────────────────────────

...

// ─────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────

async function main() {
  ...
}
await main();

// ─────────────────────────────────────────────
// 功能函数
// ─────────────────────────────────────────────

...

```

运行测试重构的脚本

```bash
node --check data/scripts/prepare-map-chart-sample.mjs                           
node data/scripts/prepare-map-chart-sample.mjs
```

运行结果：

```
{"region":"Waikato Region","sourceAreaCount":240,"associatedAreaCount":222,"publishableAreaCount":222,"missingGeometry":0,"mapSlice":{"period":"2026-04-01","dwellingType":"ALL","bedroomCategory":"ALL","metricRecords":162,"missingMetricRecords":60,"initialFeature":{"id":"179900","name":"Greensboro","medianRent":350,"reportedBonds":171}},"history":{"sa2Id":"179900","observations":26,"start":"2020-01-01","end":"2026-04-01"}}
{"mapFile":"/Users/aqiang/Desktop/myGitHub/upload/ReactProject/RoostMap/public/data/spike/map-chart/waikato.geo.json","mapFeatures":222,"historyFile":"/Users/aqiang/Desktop/myGitHub/upload/ReactProject/RoostMap/public/data/spike/map-chart/179900-history.json","historyObservations":26}
```

输出目录中得到2份文件。

#### 6.2 按 SA2 收集历史记录

目前脚本只收集了 Greensboro 的历史数据。地图中选择其他地区时，也需要取得对应地区的季度记录。因此，接下来调整 `scanMbieCsv()`，我们需要把历史收集范围扩大到 Waikato 的各个 SA2，并按地区编号分别保存。

在扫描 MBIE（租金） CSV租房数据的功能函数`scanMbieCsv()`中，原来的 `historyObservations` 是用来保存单个地区数据的数组。而我们现在需要保存多个地区的数据，因此，需要使用一个新的Map结构的变量来实现。Map 的键是 SA2 编号，值是这个地区的记录数组。例如，通过`historyObservations.get("179900")` 就能关联取得 Greensboro 的季度记录。

在 `scanMbieCsv()` 内，把原先的数组 `historyObservations` 结构替换成 Map结构

```js
const historyObservations = new Map();
```

扫描 CSV 时，先沿用已有的住宅类型和卧室分类筛选。记录属于 Waikato大区，按编号找到它的数组并加入当前季度的数据；第一次遇到某个编号时，先为它创建空数组。这样，同一地区的记录会积累到同一个数组中。

在 `scanMbieCsv()` 内，  循环末尾，原来只判断 `sa2Id === initialSa2Id` 的代码改为：

```js
if (waikatoSa2Ids.has(sa2Id)) {
  let observations = historyObservations.get(sa2Id);

  if (!observations) {
    observations = [];
    historyObservations.set(sa2Id, observations);
  }

  observations.push({
    period,
    geometricMeanRent: sourceNumber(record, "Geometric Mean Rent"),
    reportedBonds,
  });
}
```

CSV 扫描结束后，对各地区的数据进行排序。Map 中每个值都是一个地区的记录数组，分别遍历这些数组，按日期升序排列：

```js
for (const observations of historyObservations.values()) {
  observations.sort((left, right) =>
    left.period.localeCompare(right.period),
  );
}
```

函数继续返回三项结果，其中 `historyObservations` 现在是整个历史 Map：

```js
return { mbieWaikatoSa2Ids, currentMetrics, historyObservations };
```

`main()` 继续把历史 Map 传给摘要和文件写入函数。选择某个地区的数据，由使用它的函数按编号读取。

在 `buildCheckSummary()` 内，找到初始地区的地图 feature 后，取得它的历史数组：

```js
const initialHistory = historyObservations.get(initialSa2Id) ?? [];
```

本节扩大了历史收集范围，还需要核对 Map 中有多少地区、一共收集了多少条记录。地区数直接使用 `historyObservations.size`，记录总数则遍历各地区数组并累加长度。在 `buildCheckSummary()` 的 `initialHistory` 声明之后、`return` 之前加入：

```js
// 统计所有地区在当前分类下的历史记录总数。
let totalHistoryRecords = 0;
for (const observations of historyObservations.values()) {
  totalHistoryRecords += observations.length;
}
```

将这两项统计放入返回对象的 `history` 中，原有初始地区的核对字段继续保留：

```js
history: {
  areaCount: historyObservations.size,
  totalRecords: totalHistoryRecords,
  sa2Id: initialSa2Id,
  observations: initialHistory.length,
  start: initialHistory.at(0)?.period ?? null,
  end: initialHistory.at(-1)?.period ?? null,
},
```

当前 `writeOutputFiles()` 仍保存初始地区文件，`historyData` 中的 `observations` 同样从 Map 取得：

```js
observations: historyObservations.get(initialSa2Id) ?? [],
```

运行并验证历史收集结果：

```bash
node --check data/scripts/prepare-map-chart-sample.mjs
node data/scripts/prepare-map-chart-sample.mjs
```

`main()` 已经打印 `buildCheckSummary()` 返回的摘要，运行后查看其中的 `history`。使用当前源文件和 `ALL / ALL` 分类，应得到：

| 字段 | 预期值 | 含义 |
|---|---|---|
| `areaCount` | 222 | Map 中有历史记录的 SA2 数量 |
| `totalRecords` | 3958 | 这些地区的季度记录总数 |
| `observations` | 26 | Greensboro 的历史记录数 |

这样，摘要同时核对整区历史的收集范围和原有初始地区记录。当前历史文件仍只保存 Greensboro；各地区记录在 Map 中，由后续整理和写入使用。

#### 6.3 按季度整理各地区的历史

各地区的记录收集完成后，还需要按时间整理。不同地区可能缺少不同季度，例如有一月和七月的记录，却没有四月的记录。整理时需要保留四月的位置，并用 `null` 表示缺失，才能在图表中看出这段数据中断。

这部分分为两步：先收集 CSV 中的全部季度，再按这些季度整理每个地区的记录。

季度范围收集：

`scanMbieCsv()` 已经逐行读取 CSV，可以同时收集每行的 `TimeFrame`。相同季度会出现很多次，用 Set 保存日期就能自动去重。在函数的 `historyObservations` 声明后、`parser` 前定义：

```js
const periods = new Set();
```

接着在循环开头读取日期时，将它加入集合。日期收集放在地区和分类筛选之前，保留整个源文件包含的季度：

```js
const period = sourceValue(record, "TimeFrame");
periods.add(period);
```

CSV 读取结束后，把 Set 转成数组并排序，得到从早到晚的季度列表。日期统一使用 `YYYY-MM-DD` 格式，可以直接按字符串排序。在各地区历史排序代码后、`return` 前加入：

```js
const sortedPeriods = [...periods].sort();
```

季度列表与各地区记录一起交给主流程，因此 `scanMbieCsv()` 的返回对象增加 `sortedPeriods`：

```js
return {
  mbieWaikatoSa2Ids,
  currentMetrics,
  historyObservations,
  sortedPeriods,
};
```

返回类型注释相应增加 `sortedPeriods: string[]`。

历史记录整理功能封装：

接着定义 `buildHistories()` 整理历史。它需要三项数据：`mapFeatures` 确定处理哪些地区，`historyObservations` 提供各地区已有的记录，`sortedPeriods` 确定季度顺序。

函数逐个处理地图中的地区，先取得该地区的记录，再建立“日期对应记录”的 Map。随后按季度列表依次查找：有记录就保留，没有记录就为这个季度放入数值为 `null` 的占位。完全没有当前分类观测的地区保留空数组。

函数定义放在 `buildMapFeatures()` 结束后、`buildCheckSummary()` 之前：

```js
// 按地图可选地区整理历史数组，保留缺失季度。
function buildHistories(mapFeatures, historyObservations, sortedPeriods) {
  const histories = {};

  for (const feature of mapFeatures) {
    const areaObservations = historyObservations.get(feature.id) ?? [];
    const observedQuarters = new Map(
      areaObservations.map((observation) => [
        observation.period,
        observation,
      ]),
    );

    histories[feature.id] = observedQuarters.size === 0
      ? []
      : sortedPeriods.map((period) =>
          observedQuarters.get(period) ?? {
            period,
            geometricMeanRent: null,
            reportedBonds: null,
          },
        );
  }

  return histories;
}
```

外层 `for` 按地区遍历，内层的数组 `.map()` 按季度排列记录，`observedQuarters.get(period)` 负责查找这个季度的数据。来源中已有的空值继续保留，补入的占位也只表示缺失，不算新的官方观测。

最后返回 `histories` 对象，以 SA2 编号作为属性名，保存各地区整理好的数组。比如，`histories["179900"]` 就是 Greensboro 的季度历史。

#### 6.4 保存大区历史文件

历史数据整理好后，就可以保存到文件中。`histories` 已经按编号区分各个 SA2，因此将整个 Waikato 的历史集中保存为一份 `waikato-history.json`，读取时仍然按地区编号取得对应数组。

写出文件功能调整：

`writeOutputFiles()` 原来接收 Greensboro 的历史数组，现在改为接收整个大区的 `histories` 和季度列表 `sortedPeriods`。历史文件同时保存大区名称、住宅类型、卧室分类、指标名称和季度范围，读取文件时就能确认这些记录使用了哪些条件。

地图文件继续使用已有的 `mapFeatures`。调整后的写入函数如下：

```js
/**
 * 保存地图数据和大区历史数据，返回文件路径与覆盖范围。
 * @param {object[]} mapFeatures 地图可选地区的 features
 * @param {Object<string, object[]>} histories 按 SA2 编号保存的季度历史
 * @param {string[]} sortedPeriods 按时间升序排列的季度日期
 * @returns {Promise<object>} 文件路径、地区数量和季度范围
 */
async function writeOutputFiles(mapFeatures, histories, sortedPeriods) {
  const mapData = {
    type: "FeatureCollection",
    features: mapFeatures,
  };

  const historyData = {
    region: regionName,
    dwellingType,
    bedroomCategory,
    metric: "geometricMeanRent",
    periods: sortedPeriods,
    histories,
  };

  const mapFileUrl = new URL("waikato.geo.json", outputDirectoryUrl);
  const historyFileUrl = new URL("waikato-history.json", outputDirectoryUrl);

  await mkdir(outputDirectoryUrl, { recursive: true });
  await writeFile(mapFileUrl, JSON.stringify(mapData), "utf8");
  await writeFile(historyFileUrl, JSON.stringify(historyData), "utf8");

  return {
    mapFile: fileURLToPath(mapFileUrl),
    mapFeatures: mapData.features.length,
    historyFile: fileURLToPath(historyFileUrl),
    historyAreas: Object.keys(histories).length,
    periods: sortedPeriods.length,
    start: sortedPeriods.at(0),
    end: sortedPeriods.at(-1),
  };
}
```

写入完成后，函数返回文件路径、地区数量和季度范围，供主流程打印核对。`historyAreas` 统计文件中的 SA2 数量，其中也包括当前分类下历史数组为空的地区。

主流程调用调整：

扫描 CSV 时，主流程接收历史 Map，并增加接收 `sortedPeriods`。生成地图 features 后，将它们一起交给 `buildHistories()` 整理各地区历史，再把结果传给 `writeOutputFiles()` 保存。

摘要函数继续从历史 Map 中取得 Greensboro 的记录，核对原始记录的数量和时间范围。完整的主流程为：

```js
async function main() {
  // 1. 读取边界，并建立当前大区的 SA2 编号集合。
  const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
  const waikatoSa2Ids = new Set(geometryFeatures.map((feature) => feature.id));

  // 2. 扫描 CSV，取得地图指标、各地区历史和季度范围。
  const {
    mbieWaikatoSa2Ids,
    currentMetrics,
    historyObservations,
    sortedPeriods,
  } = await scanMbieCsv(waikatoSa2Ids);

  // 3. 分别整理地图 features 和各地区季度历史。
  const mapFeatures = buildMapFeatures(
    geometryFeatures,
    mbieWaikatoSa2Ids,
    currentMetrics,
  );
  const histories = buildHistories(
    mapFeatures,
    historyObservations,
    sortedPeriods,
  );

  // 4. 保留原有的数据核对摘要。
  const checkSummary = buildCheckSummary({
    geometryFeatures,
    mbieWaikatoSa2Ids,
    mapFeatures,
    currentMetrics,
    historyObservations,
  });
  console.log(JSON.stringify(checkSummary));

  // 5. 写出地图与大区历史文件，再打印生成摘要。
  const writeResult = await writeOutputFiles(
    mapFeatures,
    histories,
    sortedPeriods,
  );
  console.log(JSON.stringify(writeResult));
}
```

原有的 `await main();` 保留一次。脚本顶部的历史文件说明也相应更新为 `waikato-history.json`，表示文件包含 Waikato 各 SA2 的季度历史。

运行并核对生成结果：

```bash
node --check data/scripts/prepare-map-chart-sample.mjs
node data/scripts/prepare-map-chart-sample.mjs
```



#### 6.5 接入大区历史数据

`waikato-history.json` 已经保存整个大区的历史。页面需要先读取这份文件，再用地图保存的 `selectedSa2Id` 找到对应地区的数组。切换地区时只改变取出的数组，不重新下载历史文件。

历史数据类型：

`src/features/explore/sample-data.ts` 负责读取样例数据。原来的 `HistoryData` 只描述一个地区，现在需要描述大区文件中的 `histories`。先把单条季度记录单独定义为 `HistoryObservation`，放在 `MapData` 类型之后，再定义大区结构：

```ts
export type HistoryObservation = {
  period: string;
  geometricMeanRent: number | null;
  reportedBonds: number | null;
};

type HistoryData = {
  region: string;
  dwellingType: string;
  bedroomCategory: string;
  metric: "geometricMeanRent";
  periods: string[];
  histories: Record<string, HistoryObservation[]>;
};
```

`Record<string, HistoryObservation[]>` 描述的是 JSON 中的普通对象：属性名是 SA2 编号，属性值是该地区的季度数组。因此，可以通过 `history.histories["179900"]` 取得 Greensboro 的历史。

读取大区文件：

同一文件的 `loadSampleData()` 继续并行读取地图和历史，历史请求改为大区文件：

```ts
const [mapResponse, historyResponse] = await Promise.all([
  fetch("/data/spike/map-chart/waikato.geo.json", { signal }),
  fetch("/data/spike/map-chart/waikato-history.json", { signal }),
]);
```

请求状态仍由已有的 `useQuery` 管理。加载提示、失败提示和重试按钮继续使用现有逻辑。

按地图选择取得历史：

在 `src/pages/MapChartPage.tsx` 中，空边界意味着无法选择地图地区；某个地区没有历史则只影响它的历史显示。因此，数据加载后的空数据判断只检查地图：

```tsx
if (data.map.features.length === 0) {
  return <p>No map boundaries are available for this sample.</p>;
}
```

`selectedArea` 已经根据 `selectedSa2Id` 找到地区名称和当前指标。紧接着，用同一个编号取得历史数组：

```tsx
const selectedArea = data.map.features.find(
  (feature) => feature.id === selectedSa2Id,
);

// 从已加载的大区文件按编号取出历史，没有记录时使用空数组。
const selectedHistory = data.history.histories[selectedSa2Id] ?? [];
```

这样，点击事件只需要继续调用已有的 `setSelectedSa2Id(id)`。React 重新渲染页面时，`selectedArea` 和 `selectedHistory` 会一起变成新地区的数据，不需要再保存一份历史选择状态。

页面底部原来的文件摘要只显示初始地区，现在用选中地区的信息核对数据是否对应。在已有地区信息卡片后显示：

```tsx
{selectedArea && (
  <div className="space-y-2 rounded-xl border bg-card p-4 text-sm">
    <h2 className="text-xl font-semibold">
      Rent history · {selectedArea.properties.name}
    </h2>
    <p>SA2 {selectedSa2Id}</p>
    <p>
      History classification: {data.history.dwellingType} /{" "}
      {data.history.bedroomCategory}
    </p>
    <p>Quarterly slots: {selectedHistory.length}</p>
    {selectedHistory.length === 0 && (
      <p>No history observations are available for this area and classification.</p>
    )}
  </div>
)}
```

运行页面后，先核对 Greensboro 的名称、编号和 26 个季度位置，再点击其他地区，确认名称和编号随选择变化。这里统计的是数组长度，其中可能包含空值占位，并不等于实际有租金的季度数。Network 中应请求 `waikato-history.json`，切换地区时不再请求单个地区文件。

#### 6.6 绘制历史图表并验证联动

页面已经能取得选中地区的季度数组。接下来将 `period` 作为横轴、`geometricMeanRent` 作为纵轴，观察租金随季度的变化。地图显示的是当前季度的 Median Rent，历史图表显示的是 Geometric Mean Rent；两者使用同一地区和 `ALL / ALL` 分类，但指标名称需要分别标明。

引入图表组件：

当前需要绘制折线，因此安装技术栈中选定的 Recharts。按照[官方安装说明](https://github.com/recharts/recharts#installation)，同时安装与项目 React 版本一致的 `react-is`：

```bash
npm install recharts react-is@19.2.8
npm ls recharts react-is
```

本次安装的 Recharts 为 `3.10.1`，直接依赖的 `react-is` 为 `19.2.8`，与 React 一致。

历史图表属于 Explore 功能。在 `src/features/explore/RentHistoryChart.tsx` 中组织这部分显示，页面负责提供选中的数据，组件负责画图及显示季度记录。

组件需要地区编号、名称、分类和历史数组。先引入 Recharts 组件及已有记录类型，并定义参数。日期在数据中仍保留原值，`formatQuarter()` 只负责把标签显示为 `2020 Q1` 这样的形式：

```tsx
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HistoryObservation } from "@/features/explore/sample-data";

type RentHistoryChartProps = {
  sa2Id: string;
  areaName: string;
  dwellingType: string;
  bedroomCategory: string;
  observations: HistoryObservation[];
};

function formatQuarter(period: string) {
  const year = period.slice(0, 4);
  const quarter = Math.ceil(Number(period.slice(5, 7)) / 3);
  return `${year} Q${quarter}`;
}
```

区分空历史和缺失租金：

`observations.length` 是季度位置数；`observedRentCount` 只统计租金不为 `null` 的位置。判断使用 `!== null`，数值为 `0` 的真实记录也会保留。

接着在同一文件定义组件主体。空数组直接显示提示；有季度记录时显示数量，并为季度趋势和季度记录各留出显示位置：

```tsx
export function RentHistoryChart({
  sa2Id,
  areaName,
  dwellingType,
  bedroomCategory,
  observations,
}: RentHistoryChartProps) {
  // 区分季度位置与实际有租金的记录，缺失季度仍留在原数组中。
  const observedRentCount = observations.filter(
    (observation) => observation.geometricMeanRent !== null,
  ).length;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Rent history · {areaName}</h2>
        <p className="text-sm">
          SA2 {sa2Id} · Dwelling type: {dwellingType} · Bedroom category:{" "}
          {bedroomCategory}
        </p>
        <p className="text-sm text-muted-foreground">
          Geometric Mean Rent · NZD per week
        </p>
      </div>

      {observations.length === 0 ? (
        <p>No history observations are available for this area and classification.</p>
      ) : (
        <>
          <p className="text-sm">
            {observations.length} quarters · {observedRentCount} rent observations
          </p>
          {/* 季度趋势 */}

          {/* 季度记录 */}
        </>
      )}
    </section>
  );
}
```

绘制季度趋势：

有季度数组不代表一定有租金值。如果全部为 `null`，需要提示没有可绘制的租金；否则把完整数组交给折线图。在组件主体的 `季度趋势` 位置加入：

```tsx
{observedRentCount === 0 ? (
  <p>No rent values are available for these quarters.</p>
) : (
  <>
    {/* 使用完整季度数组：null 形成断点，圆点保留孤立的观测。 */}
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={observations} margin={{ top: 16, right: 16, bottom: 12, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickFormatter={formatQuarter}
            minTickGap={28}
            interval="preserveStartEnd"
          />
          <YAxis width={64} tickFormatter={(value) => `$${value}`} />
          <Tooltip
            labelFormatter={(label) => formatQuarter(String(label))}
            formatter={(value) => [`NZ$${value}`, "Geometric Mean Rent"]}
          />
          <Line
            type="linear"
            dataKey="geometricMeanRent"
            stroke="#2f6f9f"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <p className="text-sm text-muted-foreground">
      Gaps indicate missing rent observations.
    </p>
  </>
)}
```

外层容器提供高度，`ResponsiveContainer` 随可用宽度调整图表。横轴通过 `dataKey="period"` 读取日期，折线通过 `dataKey="geometricMeanRent"` 读取租金。保留完整数组并设置 `connectNulls={false}`，可以让缺失季度形成断点；圆点则让没有相邻线段的单次观测仍然可见。

显示季度记录：

图表便于观察趋势，具体租金和 Reported Bonds 还需要逐条核对。表格直接遍历同一个 `observations`，不另行取数或筛掉空值。在组件主体的 `季度记录` 位置加入：

```tsx
{/* 表格与图表共用同一数组，便于核对租金及 Reported Bonds。 */}
<details>
  <summary className="cursor-pointer">Quarterly records</summary>
  <div className="mt-3 overflow-x-auto">
    <table className="w-full text-left text-sm">
      <caption className="pb-3 text-left">
        {areaName} · {sa2Id} · {dwellingType} / {bedroomCategory}
      </caption>
      <thead>
        <tr className="border-b">
          <th className="px-2 py-2">Quarter</th>
          <th className="px-2 py-2">Geometric Mean Rent (NZD/week)</th>
          <th className="px-2 py-2">Reported Bonds</th>
        </tr>
      </thead>
      <tbody>
        {observations.map((observation) => (
          <tr key={observation.period} className="border-b">
            <td className="px-2 py-2">{formatQuarter(observation.period)}</td>
            <td className="px-2 py-2">
              {observation.geometricMeanRent === null
                ? "No observation"
                : `NZ$${observation.geometricMeanRent}`}
            </td>
            <td className="px-2 py-2">
              {observation.reportedBonds ?? "No observation"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</details>
```

`details` 让读者按需展开记录。缺失租金和押金数量显示 `No observation`，不会被转换成零。

连接页面与图表：

组件可以接收历史数组后，回到 `src/pages/MapChartPage.tsx`，在现有业务模块导入处加入：

```tsx
import { RentHistoryChart } from "@/features/explore/RentHistoryChart";
```

页面底部的历史摘要由这个组件承担。已有地区信息卡片后保留以下历史视图，原摘要不再重复显示：

```tsx
{selectedArea && (
  <RentHistoryChart
    sa2Id={selectedSa2Id}
    areaName={selectedArea.properties.name}
    dwellingType={data.history.dwellingType}
    bedroomCategory={data.history.bedroomCategory}
    observations={selectedHistory}
  />
)}
```

数据流保持为：地图点击更新 `selectedSa2Id` → 页面取得对应名称和历史数组 → `RentHistoryChart` 同时更新标题、折线和表格。

核对联动：

打开 `/spike/map-chart`，初始地区应为 Greensboro。展开 Quarterly records，核对首个季度 `2020 Q1` 的租金为 `NZ$388`、Reported Bonds 为 `393`，最后一个季度 `2026 Q2` 的租金为 `NZ$395`、Reported Bonds 为 `171`。

点击 Coromandel，标题和表格编号应一起变为 `166700`。它有 26 个季度位置，其中 16 个有租金；缺失位置在表格中显示 `No observation`，折线在这些位置断开。缩小到手机宽度，图表应随容器缩小，表格可以在自己的容器内横向滚动。

请求失败仍通过现有错误面板处理。在 Chrome 的 Network request blocking 中临时屏蔽 `*waikato-history.json*` 后刷新，应出现失败提示；取消屏蔽并点击 Retry loading data，应恢复初始地区的历史。

固定关键行为：

地区切换会同时影响图表和表格，因此组件测试需要验证两者是否使用同一地区的数据，同时覆盖断点、孤立观测、空历史和失败重试。在 `src/pages/MapChartPage.test.tsx` 中，地图用按钮发出同样的选区事件；数据读取、页面状态和折线绘制仍使用实际实现。jsdom 没有页面布局，测试只为图表提供固定尺寸。

<details>
<summary>地图与历史联动的组件测试代码</summary>

```tsx
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapChartPage } from "@/pages/MapChartPage";

// 用按钮发出地图的选区事件；历史请求、页面状态与 Recharts 折线仍实际运行。
vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, onClick }: {
    children: ReactNode;
    onClick: (event: { features: { id: string }[] }) => void;
  }) => (
    <div>
      <button onClick={() => onClick({ features: [{ id: "166700" }] })}>Select Coromandel</button>
      <button onClick={() => onClick({ features: [{ id: "166800" }] })}>Select Empty Area</button>
      {children}
    </div>
  ),
  Source: ({ children }: { children: ReactNode }) => children,
  Layer: () => null,
  NavigationControl: () => null,
}));
vi.mock("maplibre-gl", () => ({ setWorkerUrl: vi.fn() }));

// jsdom 没有页面布局，为真实折线提供固定尺寸。
vi.mock("recharts", async (importOriginal) => ({
  ...await importOriginal<typeof import("recharts")>(),
  ResponsiveContainer: ({ children }: {
    children: ReactElement<{ width: number; height: number }>;
  }) => cloneElement(children, { width: 640, height: 320 }),
}));

const periods = ["2020-01-01", "2020-04-01", "2020-07-01", "2020-10-01", "2021-01-01"];

function area(sa2Id: string, name: string) {
  return {
    type: "Feature",
    id: sa2Id,
    geometry: { type: "Polygon", coordinates: [[[175, -38], [176, -38], [175, -37], [175, -38]]] },
    properties: { sa2Id, name, medianRent: 350, reportedBonds: 171 },
  };
}

function history(values: (number | null)[]) {
  return values.map((geometricMeanRent, index) => ({
    period: periods[index],
    geometricMeanRent,
    reportedBonds: geometricMeanRent === null ? null : 12,
  }));
}

function serveSample(coromandelValues: (number | null)[] = [400, 410, null, 430, 440]) {
  const fetchMock = vi.fn(async (input: string) => {
    if (input.endsWith("waikato.geo.json")) {
      return Response.json({
        type: "FeatureCollection",
        features: [area("179900", "Greensboro"), area("166700", "Coromandel"), area("166800", "Empty Area")],
      });
    }
    if (input.endsWith("waikato-history.json")) {
      return Response.json({
        region: "Waikato Region",
        dwellingType: "ALL",
        bedroomCategory: "ALL",
        metric: "geometricMeanRent",
        periods,
        histories: {
          "179900": history([388, 314, 323, 322, 403]),
          "166700": history(coromandelValues),
          "166800": [],
        },
      });
    }
    throw new Error(`Unexpected data request: ${input}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MapChartPage /></QueryClientProvider>);
}

beforeEach(() => vi.stubEnv("VITE_MAPTILER_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("map history selection", () => {
  it("switches the chart and table together, preserves gaps and handles an empty area", async () => {
    const fetchMock = serveSample();
    renderPage();
    expect(await screen.findByRole("heading", { name: "Rent history · Greensboro" })).toBeInTheDocument();
    expect(screen.getByText("5 quarters · 5 rent observations")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select Coromandel" }));
    expect(screen.getByRole("heading", { name: "Rent history · Coromandel" })).toBeInTheDocument();
    expect(screen.getByText("5 quarters · 4 rent observations")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Quarterly records"));
    const table = screen.getByRole("table");
    const missingQuarter = within(table).getByText("2020 Q3").closest("tr")!;
    expect(within(missingQuarter).getAllByText("No observation")).toHaveLength(2);
    expect(within(table).getByText("NZ$430")).toBeInTheDocument();
    // 两个 M 表示缺失季度两侧各有独立线段，没有跨空值连接。
    const path = document.querySelector(".recharts-line-curve");
    expect(path?.getAttribute("d")?.match(/M/g)).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Select Empty Area" }));
    expect(screen.getByText("No history observations are available for this area and classification.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Coromandel" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("keeps an isolated zero-valued observation as a visible point", async () => {
    serveSample([null, null, 0, null, null]);
    renderPage();
    await screen.findByRole("heading", { name: "Rent history · Greensboro" });
    fireEvent.click(screen.getByRole("button", { name: "Select Coromandel" }));
    expect(screen.getByText("5 quarters · 1 rent observations")).toBeInTheDocument();
    expect(document.querySelectorAll(".recharts-line-dot")).toHaveLength(1);
    fireEvent.click(screen.getByText("Quarterly records"));
    expect(within(screen.getByRole("table")).getByText("NZ$0")).toBeInTheDocument();
  });

  it("shows missing values without replacing them with zero", async () => {
    serveSample([null, null, null, null, null]);
    renderPage();
    await screen.findByRole("heading", { name: "Rent history · Greensboro" });
    fireEvent.click(screen.getByRole("button", { name: "Select Coromandel" }));
    expect(screen.getByText("No rent values are available for these quarters.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Quarterly records"));
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("No observation")).toHaveLength(10);
    expect(within(table).queryByText("NZ$0")).not.toBeInTheDocument();
  });

  it("recovers from a failed history request using the retry button", async () => {
    const fetchMock = serveSample();
    fetchMock.mockImplementationOnce(async () => Response.json({ type: "FeatureCollection", features: [] }));
    fetchMock.mockImplementationOnce(async () => new Response(null, { status: 503 }));
    renderPage();
    expect(await screen.findByText("Could not load the map and history data files.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading data" }));
    expect(await screen.findByRole("heading", { name: "Rent history · Greensboro" })).toBeInTheDocument();
  });
});
```

</details>

先运行这组测试，再运行项目现有检查：

```bash
npm run test -- src/pages/MapChartPage.test.tsx
npm run check
```

本次检查通过：新增 4 项联动测试；项目共 12 项单元与组件测试通过，生产构建通过，4 项现有应用外壳浏览器测试通过。

真实 Waikato 文件的浏览器核对也通过：点击地图中的 Coromandel 后，标题、折线及 26 行季度记录同步切换，切换地区没有额外请求历史文件；

### 7. 测量全国数据与 Region 分片

Waikato 的地图选择与历史图表已经连通，当前页面读取这个大区的地图和历史文件。数据范围扩大到全国后，需要比较一次下载全国数据与只下载所选大区的数据，会怎样影响加载和交互。

本节先用同一批记录生成全国对照数据和大区分片，再让页面按大区选择加载，最后比较数据体积、加载过程和交互表现，根据实测结果判断加载方案。

#### 7.1 准备全国数据和大区分片

这一节要准备两种内容一致的文件：全国数据放在一起，以及同一批数据按 Region 分开保存。它们使用相同的原始数据、季度和分类，才能用来比较加载方式。

新脚本使用 `data/scripts/prepare-map-chart-comparison.mjs`。先在 `main()` 中确定数据处理的先后关系：边界给出租金关联的地区范围，关联结果组成地图与历史，最后才能保存全国文件和大区分片。

```js
async function main() {
  // 1. 读取全国 SA2 边界，建立地区编号集合。
  // 2. 扫描 MBIE（租金） CSV，取得这些地区的租金记录和季度范围。
  // 3. 整理地图指标与各地区的季度历史。
  // 4. 将整理好的全国数据写成文件。
  // 5. 按 Region 分组，保存各大区文件及文件目录。
}

```

**1. 读取全国边界**

主流程首先需要一组全国 SA2，先封装读取与转换功能。脚本顶部使用 SQLite 和 `wkx`，并给出边界文件路径：

```js
import { DatabaseSync } from "node:sqlite";
import wkx from "wkx";

const statsNzFileUrl = new URL(
  "../raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg",
  import.meta.url,
);
```

`readStatsNzRows()` 负责只读查询全国 SA2 的编号、名称、大区和 `geom`。它返回数据库记录数组，读取结束后关闭连接：

```js
function readStatsNzRows() {
  const query = `
    SELECT
      SA22019_V1_00 AS sa2Id,
      SA22019_V1_00_NAME AS name,
      TA2019_V1_00_NAME AS territorialAuthority,
      REGC2019_V1_00 AS regionCode,
      REGC2019_V1_00_NAME AS region,
      LAND_AREA_SQ_KM AS landAreaSqKm,
      geom
    FROM statistical_area_2_higher_geographies_2019_generalised
    ORDER BY SA22019_V1_00;
  `;

  const database = new DatabaseSync(statsNzFileUrl, { readOnly: true });

  try {
    return database.prepare(query).all();
  } finally {
    database.close();
  }
}
```

数据库记录中的 `geom` 带有 GeoPackage 头部，不能直接交给 WKB 解析器。用 `geoPackageWkb()` 截取其中的 WKB 字节，处理方式与第 6 小节相同：

```js
function geoPackageWkb(geometryBytes) {
  // 将字节数组转为 Buffer，以读取头部并截取 WKB，字节内容保持不变。
  const geometryBuffer = Buffer.from(geometryBytes);

  if (
    geometryBuffer.length < 8 ||
    geometryBuffer.toString("ascii", 0, 2) !== "GP"
  ) {
    throw new Error("Invalid GeoPackage geometry header");
  }

  const flags = geometryBuffer.readUInt8(3);
  const envelopeType = (flags >> 1) & 0b111;

  // 下标即 envelope 类型：0 无、1 XY、2 XYZ、3 XYM、4 XYZM。
  const envelopeCoordinateCounts = [0, 4, 6, 6, 8];
  const envelopeCoordinateCount = envelopeCoordinateCounts[envelopeType];

  if (envelopeCoordinateCount === undefined) {
    throw new Error(`Unsupported GeoPackage envelope type: ${envelopeType}`);
  }

  const headerLength = 8 + envelopeCoordinateCount * 8;
  return geometryBuffer.subarray(headerLength);
}
```

接着封装 `toGeometryFeature()`。它接收一条数据库记录，调用刚定义的 `geoPackageWkb()` 解析边界，并把 SA2 编号、名称和 Region 放入 GeoJSON feature：

```js
function toGeometryFeature(row) {
  const sa2Id = String(row.sa2Id).trim();

  return {
    type: "Feature",
    id: sa2Id,
    geometry: row.geom?.byteLength
      ? wkx.Geometry.parse(geoPackageWkb(row.geom)).toGeoJSON()
      : null,
    properties: {
      sa2Id,
      name: row.name,
      territorialAuthority: row.territorialAuthority,
      regionCode: String(row.regionCode).trim(),
      region: row.region,
      landAreaSqKm: Number(row.landAreaSqKm),
    },
  };
}
```

读取和转换函数都有了实现，主程序便可以使用它们。

`main()` 中先接入读取与转换，再提取编号形成 `sa2Ids`：

```js
const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
const sa2Ids = new Set(geometryFeatures.map((feature) => feature.id));
```

`geometryFeatures` 保存地区属性和坐标，`sa2Ids` 只保存编号。两者用途不同：前者提供地图内容，后者用 `.has()` 判断一个租金记录是否属于这批地区。

<details>
<summary>当前阶段代码结构：读取全国边界</summary>

```js
import { DatabaseSync } from "node:sqlite";
import wkx from "wkx";

const statsNzFileUrl = new URL(
  "../raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg",
  import.meta.url,
);

// readStatsNzRows()、geoPackageWkb() 和 toGeometryFeature()
// 使用上文刚定义的实现。

async function main() {
  const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
  const sa2Ids = new Set(geometryFeatures.map((feature) => feature.id));

  console.log(JSON.stringify({
    sourceAreas: geometryFeatures.length,
    distinctSa2Ids: sa2Ids.size,
    firstArea: {
      id: geometryFeatures[0].id,
      region: geometryFeatures[0].properties.region,
      geometryType: geometryFeatures[0].geometry?.type ?? null,
    },
  }, null, 2));
}

await main();
```

</details>

在项目根目录运行当前脚本：

```bash
node --check data/scripts/prepare-map-chart-comparison.mjs
node data/scripts/prepare-map-chart-comparison.mjs
```

本次读取结果为：

```json
{
  "sourceAreas": 2255,
  "distinctSa2Ids": 2255,
  "firstArea": {
    "id": "100100",
    "region": "Northland Region",
    "geometryType": "MultiPolygon"
  }
}
```

记录数与不同编号数都是 2,255，首条记录已经转换成 `MultiPolygon`，并带有 Region 信息。这样就取得了本次租金关联使用的地区范围。

**2. 扫描租金记录**

现在 `main()` 已有地区编号集合，需要找到这些地区的租金。`scanMbieCsv(sa2Ids)` 逐行读取 MBIE（租金） CSV，通过 `sa2Ids.has(sa2Id)` 判断编号是否能匹配边界表。

扫描同时处理两个范围：关联编号不限住宅与卧室分类；地图指标和历史则使用 `ALL / ALL`，其中地图只取 `2026-04-01`。这样不会因为某个地区当前季度没有指标，就丢掉它在其他季度的历史。

扫描函数返回四组结果：

| 结果 | 用途 |
| --- | --- |
| `matchedSa2Ids` | 保存 MBIE（租金） 中出现过、能匹配边界表的 SA2 编号 |
| `currentMetrics` | 按 SA2 保存指定季度的 Median Rent 和 Reported Bonds |
| `historyObservations` | 按 SA2 保存各季度的 Geometric Mean Rent 和 Reported Bonds |
| `sortedPeriods` | 保存 CSV 中去重、排序后的全部季度日期 |

扫描功能需要 CSV 读取工具、文件路径和筛选条件，它们放在脚本顶部的 import 与配置区：

```js
import { createReadStream } from "node:fs";
import { parse } from "csv-parse";

const mbieFileUrl = new URL(
  "../raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv",
  import.meta.url,
);

const latestPeriod = "2026-04-01";
const dwellingType = "ALL";
const bedroomCategory = "ALL";
```

先定义字段读取函数。`sourceValue()` 去掉字段两端的空白，供编号、日期和分类判断使用：

```js
function sourceValue(record, field) {
  return String(record[field] ?? "").trim();
}
```

数值字段由 `sourceNumber()` 处理。它调用 `sourceValue()` 取得文本，将来源空值保留为 `null`，其余值转成数字：

```js
function sourceNumber(record, field) {
  const value = sourceValue(record, field);

  if (value === "" || value === "NULL") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }

  return number;
}
```

有了字段读取功能，再实现 `scanMbieCsv()`。循环先收集季度和匹配编号，再按住宅、卧室分类筛选；符合条件的记录分别进入当前指标和历史。扫描结束后按日期整理历史，返回前面列出的四组结果：

```js
async function scanMbieCsv(sa2Ids) {
  const matchedSa2Ids = new Set();
  const currentMetrics = new Map();
  const historyObservations = new Map();
  // 收集源文件的全部季度，供各地区历史按同一时间范围排列。
  const periods = new Set();

  // 流式读取 CSV，按表头将每一行解析成字段对象。
  const parser = createReadStream(mbieFileUrl).pipe(
    parse({
      bom: true,
      columns: true,
      skip_empty_lines: true,
    }),
  );

  // parser 是异步数据流，for await 会等待下一条记录，直到文件读取结束。
  for await (const record of parser) {
    const period = sourceValue(record, "TimeFrame");
    periods.add(period);
    const sa2Id = sourceValue(record, "Location Id");
    const recordDwellingType = sourceValue(record, "Dwelling Type");
    const recordBedroomCategory = sourceValue(record, "Number Of Beds");

    // 关联范围统计所有分类，因此在住宅类型和卧室分类筛选之前收集编号。
    if (/^\d{6}$/.test(sa2Id) && sa2Ids.has(sa2Id)) {
      matchedSa2Ids.add(sa2Id);
    }

    // 后续地图指标和历史记录使用本次指定的住宅类型与卧室分类。
    if (
      recordDwellingType !== dwellingType ||
      recordBedroomCategory !== bedroomCategory
    ) {
      continue;
    }

    const reportedBonds = sourceNumber(record, "Total Bonds");

    // 地图只取指定季度，按 SA2 保存 Median Rent 和 Reported Bonds。
    if (period === latestPeriod && sa2Ids.has(sa2Id)) {
      currentMetrics.set(sa2Id, {
        medianRent: sourceNumber(record, "Median Rent"),
        reportedBonds,
      });
    }

    // 地区保留各季度的 Geometric Mean Rent 和 Reported Bonds。
    if (sa2Ids.has(sa2Id)) {
      let observations = historyObservations.get(sa2Id);

      if (!observations) {
        observations = [];
        historyObservations.set(sa2Id, observations);
      }

      observations.push({
        period,
        geometricMeanRent: sourceNumber(record, "Geometric Mean Rent"),
        reportedBonds,
      });
    }
  }

  // Map 中每个值都是一个地区的记录数组，分别按季度升序排列。
  for (const observations of historyObservations.values()) {
    observations.sort((left, right) =>
      left.period.localeCompare(right.period),
    );
  }

  const sortedPeriods = [...periods].sort();

  return {
    matchedSa2Ids,
    currentMetrics,
    historyObservations,
    sortedPeriods,
  };
}
```

扫描函数定义完成后，在 `main()` 建立 `sa2Ids` 后，调用扫描函数并接收这些结果：

```js
const {
  matchedSa2Ids,
  currentMetrics,
  historyObservations,
  sortedPeriods,
} = await scanMbieCsv(sa2Ids);
```

扫描功能接入后，主程序分别打印匹配地区、当前指标、历史地区和季度的数量。

<details>
<summary>当前阶段代码结构：读取边界并扫描租金</summary>

```js
// import、文件路径和筛选配置沿用本节前文。
// 边界读取、geometry 转换和 CSV 字段读取函数也已经定义。

async function main() {
  const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
  const sa2Ids = new Set(geometryFeatures.map((feature) => feature.id));
  const {
    matchedSa2Ids,
    currentMetrics,
    historyObservations,
    sortedPeriods,
  } = await scanMbieCsv(sa2Ids);

  console.log(JSON.stringify({
    sourceAreas: geometryFeatures.length,
    matchedAreas: matchedSa2Ids.size,
    metricAreas: currentMetrics.size,
    historyAreas: historyObservations.size,
    periods: sortedPeriods.length,
  }, null, 2));
}

await main();
```

</details>

```bash
node --check data/scripts/prepare-map-chart-comparison.mjs
node data/scripts/prepare-map-chart-comparison.mjs
```

本次扫描结果为：

```json
{
  "sourceAreas": 2255,
  "matchedAreas": 2009,
  "metricAreas": 1622,
  "historyAreas": 2003,
  "periods": 26
}
```

2,009 个地区在 MBIE（租金） 中有匹配编号，但当前季度有指标记录的地区只有 1,622 个，`ALL / ALL` 分类下有历史记录的地区有 2,003 个。这些数量不同，说明地图地区范围不能直接用当前指标记录来决定。

**3. 整理地图与历史**

主流程接下来要把边界和租金组成两份对应的数据。`buildMapFeatures()` 先保留有 geometry、且出现在 `matchedSa2Ids` 中的地区，再按编号附上当前指标；缺少当前指标的属性保留 `null`。

```js
function buildMapFeatures(
  geometryFeatures,
  matchedSa2Ids,
  currentMetrics,
) {
  return geometryFeatures
    .filter(
      (feature) =>
        feature.geometry !== null && matchedSa2Ids.has(feature.id),
    )
    .map((feature) => {
      const metric = currentMetrics.get(feature.id);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          medianRent: metric?.medianRent ?? null,
          reportedBonds: metric?.reportedBonds ?? null,
        },
      };
    });
}
```

历史以这批地图地区为范围，由 `buildHistories()` 按统一季度轴整理。有历史的地区保留全部季度，缺少观测的位置填入 `null`；整个分类下没有历史记录的地区保存空数组。

```js
function buildHistories(mapFeatures, historyObservations, sortedPeriods) {
  const histories = {};

  for (const feature of mapFeatures) {
    const areaObservations = historyObservations.get(feature.id) ?? [];
    const observedQuarters = new Map(
      areaObservations.map((observation) => [
        observation.period,
        observation,
      ]),
    );

    histories[feature.id] = observedQuarters.size === 0
      ? []
      : sortedPeriods.map((period) =>
        observedQuarters.get(period) ?? {
          period,
          geometricMeanRent: null,
          reportedBonds: null,
        },
      );
  }

  return histories;
}
```


因此 `main()` 在扫描结束后依次调用这两个函数：

```js
const mapFeatures = buildMapFeatures(
  geometryFeatures,
  matchedSa2Ids,
  currentMetrics,
);
const histories = buildHistories(
  mapFeatures,
  historyObservations,
  sortedPeriods,
);
```

先生成 `mapFeatures`，再用它确定 `histories` 的地区集合，这样两份数据始终使用同一批 SA2。前三项任务接入后的主流程如下，运行后核对地图地区数和历史对象的键数量：

<details>
<summary>当前阶段代码结构：完成全国地图与历史整理</summary>

```js
// 配置和前面已经定义的功能函数保持不变。

async function main() {
  const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
  const sa2Ids = new Set(geometryFeatures.map((feature) => feature.id));
  const {
    matchedSa2Ids,
    currentMetrics,
    historyObservations,
    sortedPeriods,
  } = await scanMbieCsv(sa2Ids);

  const mapFeatures = buildMapFeatures(
    geometryFeatures,
    matchedSa2Ids,
    currentMetrics,
  );
  const histories = buildHistories(
    mapFeatures,
    historyObservations,
    sortedPeriods,
  );

  console.log(JSON.stringify({
    sourceAreas: geometryFeatures.length,
    matchedAreas: matchedSa2Ids.size,
    mapAreas: mapFeatures.length,
    historyAreas: Object.keys(histories).length,
    periods: sortedPeriods.length,
  }, null, 2));
}

await main();
```

</details>

```bash
node --check data/scripts/prepare-map-chart-comparison.mjs
node data/scripts/prepare-map-chart-comparison.mjs
```

本次整理结果为：

```json
{
  "sourceAreas": 2255,
  "matchedAreas": 2009,
  "mapAreas": 2009,
  "historyAreas": 2009,
  "periods": 26
}
```

地图和历史对象各包含 2,009 个地区。上一轮有历史记录的是 2,003 个地区，这一轮其余 6 个地区也有对应的键，值为空数组；它们没有被补成零租金。至此，全国地图与历史已在内存中形成，可以开始保存文件。

**4. 保存全国文件**

主流程的第四项将内存中的结果写成 JSON。地图使用 `FeatureCollection`；历史保存范围名称、分类、季度列表和 `histories`。两份文件都写入 `public/data/spike/map-chart/comparison/`。

文件写入需要 `mkdir`、`writeFile` 和输出目录，在脚本顶部的 import 与配 置区定义：

```js
import { mkdir, writeFile } from "node:fs/promises";

const outputDirectoryUrl = new URL(
  "../../public/data/spike/map-chart/comparison/",
  import.meta.url,
);
```

用 `writeDataset()` 接收这一组数据。它的 `fileStem` 参数决定文件名前缀，例如 `national` 对应 `national.geo.json` 和 `national-history.json`；返回值提供地区数量和浏览器访问路径。

```js
async function writeDataset(fileStem, region, features, histories, periods) {
  const mapFile = `${fileStem}.geo.json`;
  const historyFile = `${fileStem}-history.json`;
  const mapData = { type: "FeatureCollection", features };
  const historyData = {
    region,
    dwellingType,
    bedroomCategory,
    metric: "geometricMeanRent",
    periods,
    histories,
  };

  await writeFile(
    new URL(mapFile, outputDirectoryUrl),
    JSON.stringify(mapData),
    "utf8",
  );
  await writeFile(
    new URL(historyFile, outputDirectoryUrl),
    JSON.stringify(historyData),
    "utf8",
  );

  return {
    areaCount: features.length,
    mapFile: `/data/spike/map-chart/comparison/${mapFile}`,
    historyFile: `/data/spike/map-chart/comparison/${historyFile}`,
  };
}
```

`main()` 在地图与历史整理完成后创建输出目录，再把全国结果交给这个函数：

```js
await mkdir(outputDirectoryUrl, { recursive: true });
const national = await writeDataset(
  "national", "New Zealand", mapFeatures, histories, sortedPeriods,
);
console.log(JSON.stringify(national, null, 2));
```

写入功能接入后的主流程如下，前面三步的调用用注释概括：

<details>
<summary>当前阶段代码结构：保存全国对照文件</summary>

```js
// import、配置以及前四步定义的功能函数沿用上文。

async function main() {
  // 读取边界、扫描 CSV，并整理出 mapFeatures、histories 和 sortedPeriods。
  // 具体调用顺序与上一阶段相同。

  await mkdir(outputDirectoryUrl, { recursive: true });
  const national = await writeDataset(
    "national",
    "New Zealand",
    mapFeatures,
    histories,
    sortedPeriods,
  );

  console.log(JSON.stringify(national, null, 2));
}

await main();
```

</details>

```bash
node --check data/scripts/prepare-map-chart-comparison.mjs
node data/scripts/prepare-map-chart-comparison.mjs
```

终端在关联摘要之后输出：

```json
{
  "areaCount": 2009,
  "mapFile": "/data/spike/map-chart/comparison/national.geo.json",
  "historyFile": "/data/spike/map-chart/comparison/national-history.json"
}
```

地区数量仍是 2,009，输出路径指向刚写出的全国地图和历史文件。

**5. 按 Region 保存同一批数据**

全国文件保存后，最后一项任务是把同一批记录按大区分开。每个 feature 已带有 `regionCode`，`groupFeaturesByRegion()` 用它作为 `Map` 的键，将同一大区的 features 收集到一个数组中：

```js
function groupFeaturesByRegion(mapFeatures) {
  const regions = new Map();

  for (const feature of mapFeatures) {
    const { regionCode, region } = feature.properties;
    if (!regions.has(regionCode)) {
      regions.set(regionCode, { regionCode, name: region, features: [] });
    }
    regions.get(regionCode).features.push(feature);
  }

  return [...regions.values()].sort((left, right) =>
    left.regionCode.localeCompare(right.regionCode),
  );
}
```

分组只改变记录属于哪个数组，不重新计算坐标或租金。主流程取得各组后，还需要为每组取出对应历史：按 feature 的 SA2 编号访问 `histories`，得到 `[编号, 历史数组]` 配对，再由 `Object.fromEntries()` 组成该大区的历史对象。

`main()` 在全国文件保存之后完成这次遍历：

```js
const regions = groupFeaturesByRegion(mapFeatures);
await mkdir(new URL("regions/", outputDirectoryUrl), { recursive: true });
const regionFiles = [];

for (const { regionCode, name, features } of regions) {
  const regionHistories = Object.fromEntries(
    features.map((feature) => [feature.id, histories[feature.id]]),
  );
  const files = await writeDataset(
    `regions/${regionCode}`, name, features, regionHistories, sortedPeriods,
  );
  regionFiles.push({ regionCode, name, ...files });
}
```

每组继续使用 `writeDataset()`，因此大区文件与全国文件的结构相同。`regionFiles` 收集大区编号、名称、地区数量及两份文件的路径，将它保存为 `regions/index.json`，就能根据大区编号找到对应文件。

最后把分组与写入接入主流程。辅助函数均已在前文定义，这里保留完整的调用顺序，并在循环结束后保存目录、打印全国地区数、各分片合计地区数和大区数量：

<details>
<summary>当前阶段代码结构：完成全国文件与 Region 分片</summary>

```js
// 所有配置和功能函数均已在前文定义。

async function main() {
  const geometryFeatures = readStatsNzRows().map(toGeometryFeature);
  const sa2Ids = new Set(geometryFeatures.map((feature) => feature.id));
  const {
    matchedSa2Ids,
    currentMetrics,
    historyObservations,
    sortedPeriods,
  } = await scanMbieCsv(sa2Ids);

  const mapFeatures = buildMapFeatures(
    geometryFeatures,
    matchedSa2Ids,
    currentMetrics,
  );
  const histories = buildHistories(
    mapFeatures,
    historyObservations,
    sortedPeriods,
  );

  await mkdir(outputDirectoryUrl, { recursive: true });
  const national = await writeDataset(
    "national",
    "New Zealand",
    mapFeatures,
    histories,
    sortedPeriods,
  );
  console.log(JSON.stringify(national, null, 2));

  const regions = groupFeaturesByRegion(mapFeatures);
  await mkdir(new URL("regions/", outputDirectoryUrl), { recursive: true });
  const regionFiles = [];

  for (const { regionCode, name, features } of regions) {
    const regionHistories = Object.fromEntries(
      features.map((feature) => [feature.id, histories[feature.id]]),
    );
    const files = await writeDataset(
      `regions/${regionCode}`,
      name,
      features,
      regionHistories,
      sortedPeriods,
    );
    regionFiles.push({ regionCode, name, ...files });
  }

  const index = {
    period: latestPeriod,
    dwellingType,
    bedroomCategory,
    regions: regionFiles,
  };
  await writeFile(
    new URL("regions/index.json", outputDirectoryUrl),
    JSON.stringify(index),
    "utf8",
  );

  console.log(JSON.stringify({
    nationalAreas: mapFeatures.length,
    partitionAreas: regionFiles.reduce(
      (sum, region) => sum + region.areaCount,
      0,
    ),
    regions: regionFiles.length,
  }, null, 2));
}

await main();
```

</details>

```bash
node --check data/scripts/prepare-map-chart-comparison.mjs
node data/scripts/prepare-map-chart-comparison.mjs
```

本次输出的最后一组摘要为：

```json
{
  "nationalAreas": 2009,
  "partitionAreas": 2009,
  "regions": 16
}
```

各分片合计 2,009 个地区，与全国数量相等。`groupFeaturesByRegion()` 会遍历 `mapFeatures`，并按照每条记录的 `regionCode` 将它放入一个 Region 分组，因此本轮生成范围符合预期。

#### 7.2 根据选择加载大区数据

7.1 已经把全国数据拆成 16 组 Region 文件，并生成 `regions/index.json` 记录每组文件的路径。页面此时仍固定读取 Waikato，因此新的分片还没有进入页面的数据流。

本节把页面的数据入口分成两层：先读取 Region 目录，确定用户选择的范围；再读取该 Region 的地图和历史文件。页面只保存 Region 编号和 SA2 编号，地图、信息卡与历史图表都从这两个选择推导出来。

**1. 建立按 Region 读取的数据入口**

目录中的每个条目同时给出 Region 信息和两份数据文件。`src/features/explore/sample-data.ts` 先用类型保留这层关系：

```ts
export type RegionEntry = {
  regionCode: string;
  name: string;
  areaCount: number;
  mapFile: string;
  historyFile: string;
};

type RegionIndexData = {
  period: string;
  dwellingType: string;
  bedroomCategory: string;
  regions: RegionEntry[];
};
```

页面还要根据 GeoJSON 计算地图范围，因此现有 `MapData` 同时改为导出类型。随后用两个函数对应两层数据入口：

```ts
export async function loadRegionIndex(
  signal: AbortSignal,
): Promise<RegionIndexData> {
  const response = await fetch(
    "/data/spike/map-chart/comparison/regions/index.json",
    { signal },
  );

  if (!response.ok) {
    throw new Error("Could not load the Region index.");
  }

  return response.json() as Promise<RegionIndexData>;
}

export async function loadRegionData(
  region: RegionEntry,
  signal: AbortSignal,
) {
  const [mapResponse, historyResponse] = await Promise.all([
    fetch(region.mapFile, { signal }),
    fetch(region.historyFile, { signal }),
  ]);

  if (!mapResponse.ok || !historyResponse.ok) {
    throw new Error(`Could not load the ${region.name} data files.`);
  }

  return {
    map: await mapResponse.json() as MapData,
    history: await historyResponse.json() as HistoryData,
  };
}
```

`loadRegionIndex()` 只回答“有哪些 Region”；`loadRegionData()` 接收其中一个目录条目，并保证地图和历史来自同一个 Region。原来只认识 Waikato 固定路径的 `loadSampleData()` 不再需要。

**2. 让页面查询跟随 Region 选择**

页面增加 `selectedRegionCode`，继续分别保存悬停和点击选中的 SA2。`03` 作为当前技术样例的默认 Region，`179900` 保留原先默认展示的 Greensboro：

```tsx
const [selectedRegionCode, setSelectedRegionCode] = useState("03");
const [hoveredSa2Id, setHoveredSa2Id] = useState<string | null>(null);
const [selectedSa2Id, setSelectedSa2Id] = useState<string | null>("179900");
```

目录查询完成后，页面从中找到当前 Region，再启动对应的数据查询：

```tsx
const regionIndexQuery = useQuery({
  queryKey: ["map-chart-region-index"],
  queryFn: ({ signal }) => loadRegionIndex(signal),
  staleTime: Infinity,
  retry: false,
});

const selectedRegion = regionIndexQuery.data?.regions.find(
  (region) => region.regionCode === selectedRegionCode,
);

const regionDataQuery = useQuery({
  queryKey: ["map-chart-region", selectedRegionCode],
  queryFn: ({ signal }) => {
    if (!selectedRegion) {
      throw new Error("The selected Region was not found.");
    }

    return loadRegionData(selectedRegion, signal);
  },
  enabled: selectedRegion !== undefined,
  staleTime: Infinity,
  retry: false,
});
```

`enabled` 阻止第二个查询在目录就绪前运行；Region 编号进入查询键后，每个 Region 都有独立缓存。生成后的 JSON 在样例运行期间不会变化，因此 `staleTime: Infinity` 可以避免切回已访问 Region 时再次请求。

目录和 Region 数据各自保留加载、错误与重试状态。只有两个查询都完成后，页面才继续读取 `regionDataQuery.data`，因此请求失败不会留下只有地图或只有历史的半套页面。

**3. 从当前数据得到有效 SA2 和地图范围**

切换 Region 后，旧 SA2 可能不在新地图中。页面先查找当前 `selectedSa2Id`；找不到时使用该 Region 的第一条 feature，并统一从 `properties.sa2Id` 取得业务编号：

```tsx
const data = regionDataQuery.data;
const firstArea = data.map.features[0];

if (!firstArea) {
  return <p>No map boundaries are available for {selectedRegion.name}.</p>;
}

const selectedArea = data.map.features.find(
  (feature) => feature.properties.sa2Id === selectedSa2Id,
) ?? firstArea;
const activeSa2Id = selectedArea.properties.sa2Id;
const selectedHistory = data.history.histories[activeSa2Id] ?? [];
```

不同 Region 不能继续共用 Waikato 的固定中心点。当前数据只包含 `Polygon` 和 `MultiPolygon`，因此逐层访问坐标并记录经纬度最小值和最大值，就能得到地图边界：

```tsx
type MapBounds = [[number, number], [number, number]];

function getMapBounds(map: MapData): MapBounds {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  function visitCoordinates(value: unknown) {
    if (!Array.isArray(value)) return;

    if (typeof value[0] === "number" && typeof value[1] === "number") {
      const [longitude, latitude] = value;
      west = Math.min(west, longitude);
      south = Math.min(south, latitude);
      east = Math.max(east, longitude);
      north = Math.max(north, latitude);
      return;
    }

    for (const child of value) visitCoordinates(child);
  }

  for (const feature of map.features) {
    visitCoordinates(feature.geometry.coordinates);
  }

  return [[west, south], [east, north]];
}
```

这个函数只处理当前页面已经支持的两种 geometry，不引入新的地理计算依赖。

**4. 让选择器和三个视图使用同一份状态**

Region 选择器直接来自目录。选择改变时清空旧 Region 的悬停和点击编号，随后由新数据选出有效的 `activeSa2Id`：

```tsx
<select
  id="region-select"
  value={selectedRegionCode}
  onChange={(event) => {
    setSelectedRegionCode(event.target.value);
    setHoveredSa2Id(null);
    setSelectedSa2Id(null);
  }}
>
  {regionIndexQuery.data.regions.map((region) => (
    <option key={region.regionCode} value={region.regionCode}>
      {region.name}
    </option>
  ))}
</select>
```

地图用当前 GeoJSON 的边界初始化。`key` 随 Region 变化，使切回缓存数据时也会重新应用该 Region 的初始范围：

```tsx
<Map
  key={selectedRegionCode}
  initialViewState={{
    bounds: getMapBounds(data.map),
    fitBoundsOptions: { padding: 40 },
  }}
>
  {/* 现有 Source、Layer 和 NavigationControl 保持不变。 */}
</Map>
```

页面标题、图例、选择轮廓、信息卡和历史图表不再读取写死的 Waikato 信息，而是分别使用 `selectedRegion`、目录日期、当前分类和 `activeSa2Id`。这样一次 Region 切换会同时更新数据文件、地图范围和 SA2 详情，不会留下前一个 Region 的文字或图表。

**5. 验证切换、缓存和失败恢复**

组件测试的 fetch mock 增加 Region 目录、Waikato 和 Auckland 两组响应。测试仍保留原有的地图与历史联动检查，并补充三个与本节变化直接相关的场景：

- 从 Waikato 切换到 Auckland 后，标题和数据文件一起改变。
- 返回 Waikato 后，Waikato 文件没有再次请求，说明查询键与缓存生效。
- Waikato 历史文件第一次返回 `503` 时显示错误；点击重试后恢复同一个 Region。

缓存检查针对具体文件，而不是依赖所有 fetch 的总次数：

```tsx
fireEvent.change(screen.getByLabelText("Region"), {
  target: { value: "02" },
});
expect(await screen.findByRole("heading", {
  name: "Auckland Region rental data sample",
})).toBeInTheDocument();

fireEvent.change(screen.getByLabelText("Region"), {
  target: { value: "03" },
});
expect(fetchMock.mock.calls.filter(([input]) =>
  input.endsWith("regions/03.geo.json")
)).toHaveLength(1);
```

完成实现后运行页面测试和生产构建：

```bash
npm run test -- src/pages/MapChartPage.test.tsx
npm run build
```

页面测试共 5 个用例，全部通过；完整单元测试共 13 个用例，全部通过，生产构建也成功完成。至此，Region 目录、按需加载、地图切换、SA2 联动和失败恢复已经连成同一条页面数据流。

#### 7.3 比较数据体积和解析成本

7.2 已经证明页面可以按 Region 请求数据，并在返回已加载 Region 时复用缓存。现在需要回答最后一个问题：与一次读取全国数据相比，这种分片方式是否真的减少了页面开始工作前的数据成本。

两种方案使用相同的 React 页面、地图组件和应用 bundle，变化的只有业务 JSON。因此本节不重复测量不受方案影响的应用代码，也不搭建新的页面或性能监控系统；比较对象只包括同一范围的地图文件和历史文件。

**1. 确定可以直接比较的三个指标**

每个数据范围都由 `*.geo.json` 和 `*-history.json` 两个文件组成。本次比较记录：

- 原始体积：浏览器解压后需要保存和解析的 JSON 文本总量。
- gzip 体积：服务器启用常见压缩后，大致需要传输的数据量。
- 解析时间：Node.js 连续解析地图和历史 JSON 的时间中位数。

解析时间会受机器和 Node.js 版本影响，因此它只用于比较同一次运行中的相对差异，不当作页面加载时间。地图绘制和选择联动已经在 7.2 使用真实 Region 文件验证，本节不再人为复制一套全国页面。

**2. 用同一函数测量一组地图和历史**

测量逻辑保存在 `data/scripts/measure-map-chart-data.mjs`。`measureDataset()` 同时读取一组地图和历史文件，避免只比较 geometry 而忽略历史数据：

```js
async function measureDataset(files) {
  const [mapText, historyText] = await Promise.all([
    readFile(new URL(files.mapFile, comparisonDirectoryUrl), "utf8"),
    readFile(new URL(files.historyFile, comparisonDirectoryUrl), "utf8"),
  ]);

  const map = JSON.parse(mapText);
  const parseSamples = [];

  for (let iteration = 0; iteration < parseIterations; iteration += 1) {
    const startedAt = performance.now();
    JSON.parse(mapText);
    JSON.parse(historyText);
    parseSamples.push(performance.now() - startedAt);
  }

  return {
    label: files.label,
    areas: map.features.length,
    rawBytes: Buffer.byteLength(mapText) + Buffer.byteLength(historyText),
    gzipBytes:
      gzipSync(mapText).byteLength + gzipSync(historyText).byteLength,
    medianParseMs: median(parseSamples),
  };
}
```

原始体积和 gzip 体积由同一份文本计算。解析重复 7 次后取中位数，可以减小某一次系统调度波动造成的影响，同时保持脚本足够轻量。

**3. 从 Region 目录选择代表范围**

脚本先测量全国文件，再读取 `regions/index.json`，用相同函数测量全部 Region。所有结果按原始体积排序后，自动取得最大分片、当前使用的 Waikato 和最小分片：

```js
const regions = await Promise.all(
  index.regions.map((region) => measureDataset({
    label: region.name,
    mapFile: `regions/${region.regionCode}.geo.json`,
    historyFile: `regions/${region.regionCode}-history.json`,
  })),
);

const byRawSize = [...regions].sort(
  (left, right) => left.rawBytes - right.rawBytes,
);
const smallest = byRawSize[0];
const largest = byRawSize.at(-1);
const waikato = regions.find(
  (region) => region.label === "Waikato Region",
);
```

最大和最小分片由当前文件决定，不把某个 Region 名称提前写进判断逻辑。这样重新生成数据后，比较仍会覆盖两端范围。

**4. 运行同一批文件的比较**

先检查脚本语法，再读取 7.1 生成的文件：

```bash
node --check data/scripts/measure-map-chart-data.mjs
node data/scripts/measure-map-chart-data.mjs
```

本次运行得到：

| 数据范围 | SA2 数量 | 原始体积 | gzip 体积 | JSON 解析中位数 |
| --- | ---: | ---: | ---: | ---: |
| 全国 | 2,009 | 50.95 MiB | 17.30 MiB | 478.96 ms |
| Auckland（最大分片） | 542 | 7.87 MiB | 2.53 MiB | 118.73 ms |
| Waikato | 222 | 5.98 MiB | 2.01 MiB | 51.29 ms |
| Nelson（最小分片） | 23 | 0.27 MiB | 0.08 MiB | 2.19 ms |

这些数字来自同一次本地运行。gzip 结果用于估算传输差异，解析时间用于观察相对趋势；它们不包含底图瓦片、React 渲染或网络延迟。

**5. 根据结果确定当前加载方式**

Waikato 的原始数据和 gzip 数据都约为全国文件的 12%，解析中位数约为全国的 11%。即使是最大的 Auckland 分片，gzip 后也只有 2.53 MiB，明显小于全国的 17.30 MiB。

页面一次只展示一个 Region，因此先下载其余 15 个 Region 不会增加当前视图的信息，却会增加传输和解析成本。7.2 已经支持 Region 独立缓存，用户返回已访问 Region 时也不需要重复请求。基于这两项结果，当前技术样例保留按 Region 加载，不再增加全国文件加载模式。

### 8. 验证技术样例并形成结论

前面的小节已经分别验证了数据关联、地图与历史联动、Region 按需加载和文件体积。本节不再增加功能，而是把这些结果放在一起，确认技术样例是否回答了最初的问题。

#### 8.1 汇总已有验证

数据侧使用同一批 MBIE（租金） 和 Stats NZ（区域） 记录生成全国文件与 16 组 Region 分片。全国共有 2,009 个可发布 SA2，各分片合计仍为 2,009 个，因此分组没有丢失或重复地区；地图和历史文件也使用相同的 SA2 集合。

页面侧的 5 个地图组件测试覆盖：

- 地图选择同步更新信息卡、折线和季度表格。
- 缺失季度保持 `null`，折线不会跨越空档连接，数值 `0` 也不会被当作缺失。
- 没有历史记录的 SA2 显示明确空状态。
- Region 切换读取对应文件，返回已访问 Region 时复用缓存。
- Region 数据请求失败后可以重试恢复。

现有应用外壳浏览器测试继续覆盖首页、导航、未知地址和主题持久化。真实 Waikato 数据的浏览器检查已经确认 GeoJSON 可以由 MapLibre 绘制，点击 SA2 后可以显示对应的 26 个季度记录。

本轮检查结果为：

```text
ESLint                         passed
Unit and component tests       13 passed
Production build               passed
Application shell E2E tests     4 passed
```

#### 8.2 检查加载方案的证据

全国地图与历史文件 gzip 后合计 17.30 MiB，Waikato 分片为 2.01 MiB，最大的 Auckland 分片为 2.53 MiB。Waikato 的解析中位数也约为全国文件的 11%。这些结果与页面一次只显示一个 Region 的使用方式一致，支持继续采用按 Region 加载。

这个结论只比较会随方案变化的业务 JSON。React bundle、底图瓦片和设备网络没有混入数据分片结论，因此不会把其他加载成本误认为 Region 分片带来的变化。

#### 8.3 技术样例结论

Step 07 的技术样例已经确认：

- Stats NZ（区域） SA2 边界可以与 MBIE（租金） 租金记录通过六位 SA2 编号关联。
- 同一份关联结果可以同时支持当前季度地图和季度历史图表。
- 地图选择、缺失值、空历史、Region 切换和请求失败都有明确表现。
- 按 Region 加载明显减少当前页面的数据传输与解析成本。

当前样例使用 SA2 2019 边界、`ALL / ALL` 分类和 `2026-04-01` 地图季度。这些条件明确限定了本次结论的适用范围，也足以证明地图、图表和 Region 数据加载方案可以继续用于项目。

### 9. 记录结果并完成 Git 操作

原始官方数据、全国测量文件和其他本地生成文件继续由 `.gitignore` 排除。技术样例页面会在运行时请求 Region 目录和当前 Region 的地图、历史文件，因此这些页面必需的静态资源需要随代码进入 Git：

```text
public/data/spike/map-chart/comparison/regions/
├── index.json
├── {regionCode}.geo.json
└── {regionCode}-history.json
```

`.gitignore` 只为这个目录开放例外：

```bash
# Raw and generated data
data/raw/
public/data/*

# Keep directories traversable, then include only deployed Region data
!public/data/**/
!public/data/spike/map-chart/comparison/regions/*.json
```

Vite 构建时会将其中的文件复制到 `dist/data/spike/map-chart/comparison/regions/`，GitHub runner 因而可以生成包含完整样例数据的部署产物。`national.geo.json`、`national-history.json`、原始官方文件和其他未被页面请求的文件不进入本次提交。

提交前重新执行本次分支使用的检查：

```bash
node --check data/scripts/prepare-map-chart-comparison.mjs
node --check data/scripts/measure-map-chart-data.mjs
node data/scripts/measure-map-chart-data.mjs

npm run lint
npm run test
npm run build
npm run test:e2e

test -f dist/data/spike/map-chart/comparison/regions/index.json

git diff --check
git status --short
```

本地开发通过 `.env.local` 读取 `VITE_MAPTILER_KEY`，但这个文件不会进入 Git。Preview 和 Production 都在 GitHub runner 中执行 Vite 构建，Azure Static Web Apps 只接收已经生成的 `dist`，因此 MapTiler key 必须在 GitHub Actions 的构建阶段提供，不能等部署完成后再通过 Azure application settings 补入。

在 GitHub 仓库的 `Settings → Secrets and variables → Actions` 中建立 repository secret：

```text
Name:  VITE_MAPTILER_KEY
Value: MapTiler Cloud 中创建的浏览器 API key
```

Pull Request 的 `dist` 由 `.github/workflows/pull-request.yml` 中的完整检查生成，因此在该步骤传入 secret：

```yaml
- name: Run complete quality check
  env:
    VITE_MAPTILER_KEY: ${{ secrets.VITE_MAPTILER_KEY }}
  run: npm run check
```

Production 会从 `main` 重新构建，在 `.github/workflows/production.yml` 的构建步骤传入同一个变量：

```yaml
- name: Build production application
  env:
    VITE_MAPTILER_KEY: ${{ secrets.VITE_MAPTILER_KEY }}
  run: npm run build
```

`VITE_` 变量会进入浏览器产物，Actions secret 只能避免把 key 直接写进仓库，不能让它在客户端保持不可见。MapTiler Cloud 中还需要为这个 key 设置 `Allowed HTTP Origins`，加入实际部署域名；填写域名本身，不包含协议和路径。需要验证 Preview 时，也加入对应的 Preview 域名。

这些设置只对之后生成的前端产物生效。配置完成后重新构建和部署，页面才能取得 key 并加载底图。

git 提交和推送

```bash
git add .
git commit -m "spike: validate maps, charts, and regional data partitioning"

git push -u origin spike/map-chart

```

在 GitHub 创建 Pull Request，检查后 squash merge。合并完成后同步本地仓库并删除功能分支：

```bash
git switch main
git pull --ff-only
git branch -D spike/map-chart
git push origin --delete spike/map-chart

```

### Step 07 完成状态

```text
✅ 已固定地图与历史图表使用的真实数据切片和分类条件
✅ Stats NZ（区域） geometry 已转换为浏览器可读取的 GeoJSON
✅ MBIE（租金） 租金指标已与 SA2 边界完成关联
✅ MapLibre 地图已显示真实 SA2 边界和当前季度租金
✅ 地图悬停与选择可以显示对应地区信息
✅ 地图选择可以驱动同一 SA2 的历史图表和季度表格
✅ 缺失季度、空历史和数据请求失败已有明确表现
✅ 全国数据和 16 组 Region 分片可以稳定生成
✅ Region 切换、查询缓存和失败重试已经验证
✅ 全国文件与 Region 分片的体积和解析成本已经测量
✅ 页面必需的 Region 静态数据已经进入构建产物
✅ GitHub Actions 构建已经接入 VITE_MAPTILER_KEY
✅ MapTiler key 已限制为允许的部署域名
✅ lint、单元与组件测试、生产构建和 E2E 测试全部通过
✅ 地图与图表技术样例已通过 Pull Request 合并到 main
```

---

## Step 08 · 建立第一个正式数据纵向切片

### 这一步做什么

Step 06 已经确认 MBIE（租金） 租金记录可以通过六位 SA2 编号与 Stats NZ（区域） geometry 稳定关联。Step 07 又确认同一份关联结果能够同时支持地图和历史图表，并用测量结果说明浏览器应当按 Region 加载数据，而不是一次加载全国边界。

但 Step 07 的文件和页面只为验证可行性而准备。页面直接读取样例目录中的 GeoJSON 和历史文件，文件结构由样例脚本临时决定，没有版本、来源记录和运行时验证；地图和图表各自假设数据的形状，同一个指标在不同文件中的含义也没有统一约束。正式产品的列表、地图和详情必须依赖同一套数据定义，样例阶段的约定不能承担这个职责。

因此，本步建立第一条正式纵向切片。“纵向”指从数据源一直贯穿到用户界面：同一份数据依次经过转换、发布、读取和页面显示，每一层都使用相同的定义。

本步只处理 Step 07 已经使用过的 Waikato Region，页面只显示每个区域在 MBIE（租金） `ALL / ALL` 源分类下的当前租金。范围限定在一个 Region 和一种分类，是为了先让一条完整链路在真实数据上正确运行，而不把全国数据量、筛选和搜索交互混入同一次验证。

整条链路是：

```text
区域列表需要的数据 contract
→ 用小型 fixture 计算每个区域的当前租金
→ 生成版本化 Waikato release
→ manifest 驱动的数据 repository
→ Explore 列表与地图
→ 最小 Area Detail
→ 数据来源、周期与 provisional 说明
→ 替换技术样例并完成交付
```

本步完成后，从官方源记录到页面上显示的每个数值都应当能够逐项追踪：浏览器读取的数据先通过 contract 验证，生成的数据带有版本、来源和校验值，页面同时说明数据周期、provisional 状态和来源。整条链路经过测试、CI 和 Preview 验证，技术样例页面不再属于产品的一部分。

### 1. 建立正式数据切片分支

Step 07 已经通过 Pull Request 合并到 `main`。本步开始实现正式产品功能，而不再是可行性验证，因此分支使用 `feat` 类别；`data-first-slice` 说明这次交付的是第一条正式数据切片。

```bash
git switch main
git pull --ff-only
git switch -c feat/data-first-slice
git status --short --branch
```

`git status` 的分支行显示：

```text
## feat/data-first-slice
```

### 2. 定义区域列表需要的数据 contract

在这条链路中，转换脚本负责产出数据，页面负责读取数据。两边必须遵守同一份关于“数据是什么”的定义，否则脚本写出的字段和页面期待的字段迟早会出现偏差。因此，在生成任何正式文件之前，先确定页面需要的数据，并把它的结构和含义固定下来。

#### 2.1 检查样例阶段的数据读取方式

Step 07 的页面通过 `src/features/explore/sample-data.ts` 读取样例文件。Region 目录是这样取得的：

```ts
return response.json() as Promise<RegionIndexData>;
```

地图文件则直接标注为 `MapData`：

```ts
const map: MapData = await mapResponse.json();
```

`RegionIndexData` 和 `MapData` 是 TypeScript 类型。TypeScript 只在编译阶段检查代码，编译完成后类型信息会被完全移除，浏览器运行的 JavaScript 中并不存在它们。`response.json()` 返回的值在类型上是 `any`，`as` 和类型标注都只是告诉编译器“相信这份数据就是这种形状”，并不会真的检查文件内容。

因此，如果某个数据文件把租金写成字符串 `"520"`，或者缺少 `sa2Id`，代码仍然可以通过编译。错误会一直传到组件中，最后表现为排序异常、地图颜色错误或页面显示 `undefined`。这时问题出现的位置离真正的原因很远，很难判断是数据文件、读取逻辑还是组件出了错。

同一个文件中还能看到第二个问题。地图属性用 `region` 表示 Region 名称，Region 目录用 `name`，历史文件又有自己的 `region` 字段。每个样例文件各自定义结构，项目中不存在一份统一的数据定义。

正式数据链路因此需要满足两个要求：

```text
同一个概念在所有文件中只有一种定义
数据进入应用时，在运行时检查它是否符合这个定义
```

#### 2.2 确定区域列表需要的数据

本步的页面是 Waikato 的区域列表和地图。列表中的每一行、地图上的每个 SA2，都要回答同一组问题：

```text
这是哪个区域          SA2 编号、名称、所属 Region 和 territorial authority
现在的租金是多少      Median Rent
有多少记录支撑        Reported Bonds
这个数值来自哪个季度
一年来变化了多少      12 个月变化
```

这些内容来自两份官方数据。区域信息直接来自 Stats NZ（区域） 的 GeoPackage，每个 SA2 一条，不随季度变化；租金相关的数值则要从 MBIE（租金） 的季度记录中计算出来。两部分来源不同、产生方式不同，所以分开定义，再通过 Step 06 已经确认的 SA2 编号组合成列表中的一行。

“现在的租金”需要定义清楚。整个数据集有一个最新季度，Step 06 确认为 `2026-04-01`。但并不是每个 SA2 都有这个季度的记录。如果某个 SA2 的最后一条有效记录来自更早的季度，把它和其他区域的最新季度放在一起显示，旧数值就会被误读为当前市场价格。因此当前租金同时记录两个季度：

```text
datasetLatestPeriod    整个数据集的最新季度
observationPeriod      这个 SA2 最后一个 Median Rent 不为空的季度
```

Median Rent 和 Reported Bonds 都取自 `observationPeriod`。两个季度相同，说明数值属于最新季度；两者不同，页面就必须标明它是旧季度的租金。12 个月变化按项目设计的定义，比较最新季度和四个季度前的 Geometric Mean Rent。

列表中一行数据的结构因此是：

```text
AreaWithCurrentRent        列表中的一行
├── 区域信息（Area）       sa2Id、name、regionCode、regionName、
│                          territorialAuthorityCode、territorialAuthorityName
└── currentRent            当前租金（CurrentRent）：
                           datasetLatestPeriod、observationPeriod、
                           medianRent、reportedBonds、yearOverYearChange
```

#### 2.3 用 schema 描述区域信息

2.1 的第二个要求是在运行时检查数据，常见做法是使用 schema。schema 是一个在运行时真实存在的 JavaScript 对象，它描述数据必须满足的规则，并且可以拿一份实际数据来检查是否符合这些规则。

项目使用 Zod 编写 schema。先安装依赖：

```bash
npm install zod
npm ls zod --depth=0
```

依赖树中显示：

```text
`-- zod@4.6.7
```

先从区域信息中最基础的两个字段开始。Step 06 已经确认，MBIE（租金） 的 `Location Id` 与 Stats NZ（区域） 的六位 SA2 编号对应，因此一个区域至少有一个六位编号和一个名称。

用 Zod 把这两个字段写成区域信息的第一个 schema，保存在 `src/data/contracts.ts`：

```ts
import { z } from "zod";

export const areaSchema = z
  .object({
    sa2Id: z.string().regex(/^\d{6}$/),
    name: z.string().min(1),
  })
  .strict();
```

这里的每一部分都对应一条规则：

```text
z.object({...})        数据必须是包含这些字段的对象
z.string()             字段值必须是字符串
.regex(/^\d{6}$/)      sa2Id 必须恰好是六位数字
.min(1)                name 不能是空字符串
.strict()              对象中不能出现未定义的额外字段
```

`.strict()` 的作用是发现结构漂移。如果生成脚本改了字段名，例如把 `name` 写成 `areaName`，缺少 `name` 会让验证失败，多出来的 `areaName` 也会被明确报告，而不是被静默忽略。

schema 通过 `parse` 检查数据。下面的代码只用于说明它的行为，不写入文件：

```ts
const area = areaSchema.parse({ sa2Id: "179900", name: "Greensboro" });
// area 的值是验证通过的对象

areaSchema.parse({ sa2Id: "unknown", name: "Greensboro" });
// 抛出 ZodError，错误信息中包含出错字段 sa2Id
```

验证成功时，`parse` 返回通过检查的数据；验证失败时，`parse` 直接抛出错误，不返回任何值，后面使用这份数据的代码也就不会执行。

区域信息还需要所属 Region 和 territorial authority。Step 06 查看 GeoPackage 时已经确认，Stats NZ（区域） 为每个 SA2 提供 regional council 和 territorial authority 的编号与名称。这四个字段与 `name` 一样不能为空，因此把“非空字符串”提取成一个共享规则，再补全区域信息。

补全后的区域信息 schema 为：

```ts
import { z } from "zod";

const nonEmptyStringSchema = z.string().min(1);

export const areaSchema = z
  .object({
    sa2Id: z.string().regex(/^\d{6}$/),
    name: nonEmptyStringSchema,
    regionCode: nonEmptyStringSchema,
    regionName: nonEmptyStringSchema,
    territorialAuthorityCode: nonEmptyStringSchema,
    territorialAuthorityName: nonEmptyStringSchema,
  })
  .strict();
```

Region 名称统一使用 `regionName`，不再出现样例文件中 `region` 和 `name` 并存的情况。

#### 2.4 描述当前租金

当前租金的五个字段，每一个的规则都来自 Step 06 的 profiling 或 2.2 的定义：

```text
datasetLatestPeriod   季度。TimeFrame 统一使用 YYYY-MM-DD，每个值都是季度第一天，
                      所以只可能落在 1、4、7、10 月
observationPeriod     同样是季度；这个 SA2 从未有过有效租金时为 null
medianRent            Median Rent 有 803 条 NULL 标记。缺失不能写成 0，否则会被当成
                      “租金为 0”参与排序，所以允许为 null，存在时不能小于 0
reportedBonds         Total Bonds 在产品中显示为 Reported Bonds。它是计数，
                      允许为 null，存在时必须是非负整数
yearOverYearChange    两个租金之比减 1，是一个普通数值；任一季度缺少租金时为 null
```

两个季度字段使用同一条规则，因此先把季度规则定义成 `periodSchema`，再用它和上表中的其他规则组成当前租金的 schema：

```ts
const periodSchema = z.string().regex(/^\d{4}-(01|04|07|10)-01$/);

export const currentRentSchema = z
  .object({
    datasetLatestPeriod: periodSchema,
    observationPeriod: periodSchema.nullable(),
    medianRent: z.number().nonnegative().nullable(),
    reportedBonds: z.number().int().nonnegative().nullable(),
    yearOverYearChange: z.number().nullable(),
  })
  .strict();
```

新出现的三条规则：

```text
.nullable()      值可以是 null
.nonnegative()   数字不能小于 0
.int()           数字必须是整数
```

#### 2.5 组合成列表中的一行

列表中的一行是区域信息加上当前租金。`extend` 在已有 schema 的基础上增加字段，并保留原来的 `.strict()` 设置，所以不需要重复书写区域信息的规则。把当前租金作为 `currentRent` 字段加到区域信息上，就得到列表中一行的 schema：

```ts
export const areaWithCurrentRentSchema = areaSchema.extend({
  currentRent: currentRentSchema,
});
```

#### 2.6 用测试固定 contract 的边界

schema 中的每条规则都来自前面的证据。测试把这些规则变成可以重复执行的检查：以后任何人修改 schema，只要放宽或改错了规则，测试就会失败。

列表读取的是完整的一行，所以测试直接使用 `areaWithCurrentRentSchema`，只覆盖有明确依据的边界：

```text
符合定义的一行可以通过
不符合格式的 SA2 编号和季度被拒绝
从未有过有效租金的区域，当前租金各项保持为 null
字符串形式的租金被拒绝，不会被静默转换成数字
定义之外的字段被拒绝
```

测试先准备一行符合定义的数据，每个测试只修改其中一个字段，这样失败时就能确定是哪条规则在起作用。名称、上级地理名称、Median Rent 和 Reported Bonds 使用 Step 07 核对过的 Greensboro；编号和变化率只需要是符合规则的值。

修改单个字段用到展开写法：`{ ...validRow, sa2Id: "unknown" }` 先把 `validRow` 的全部字段复制到新对象中，再用后面写出的字段覆盖同名字段，`validRow` 本身不会被修改。判断数据是否被拒绝时使用 `safeParse`：它与 `parse` 使用相同的规则，但不抛出错误，而是返回一个包含 `success` 的结果对象，适合在测试中直接判断验证是否通过。

按这个思路，在 `src/data/contracts.test.ts` 中为上面五条边界各写一个测试：

```ts
import { describe, expect, it } from "vitest";

import { areaWithCurrentRentSchema } from "@/data/contracts";

const validRow = {
  sa2Id: "179900",
  name: "Greensboro",
  regionCode: "03",
  regionName: "Waikato Region",
  territorialAuthorityCode: "016",
  territorialAuthorityName: "Hamilton City",
  currentRent: {
    datasetLatestPeriod: "2026-04-01",
    observationPeriod: "2026-04-01",
    medianRent: 350,
    reportedBonds: 171,
    yearOverYearChange: 0.0128,
  },
};

describe("data contracts", () => {
  it("accepts an area with its current rent", () => {
    expect(areaWithCurrentRentSchema.parse(validRow)).toEqual(validRow);
  });

  it("rejects unsupported id and period formats", () => {
    // 不是六位数字的 SA2 编号。
    expect(
      areaWithCurrentRentSchema.safeParse({ ...validRow, sa2Id: "unknown" })
        .success,
    ).toBe(false);
    // 2 月不是季度首月。
    expect(
      areaWithCurrentRentSchema.safeParse({
        ...validRow,
        currentRent: { ...validRow.currentRent, datasetLatestPeriod: "2026-02-01" },
      }).success,
    ).toBe(false);
  });

  it("keeps missing rent values as null", () => {
    const row = areaWithCurrentRentSchema.parse({
      ...validRow,
      currentRent: {
        datasetLatestPeriod: "2026-04-01",
        observationPeriod: null,
        medianRent: null,
        reportedBonds: null,
        yearOverYearChange: null,
      },
    });

    expect(row.currentRent.medianRent).toBeNull();
    expect(row.currentRent.observationPeriod).toBeNull();
  });

  it("rejects a rent stored as a string", () => {
    const result = areaWithCurrentRentSchema.safeParse({
      ...validRow,
      currentRent: { ...validRow.currentRent, medianRent: "350" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects fields outside the contract", () => {
    const result = areaWithCurrentRentSchema.safeParse({
      ...validRow,
      areaName: "Greensboro",
    });

    expect(result.success).toBe(false);
  });
});
```

运行 contract 测试：

```bash
npm run test -- src/data/contracts.test.ts
```

结果为：

```text
✓ src/data/contracts.test.ts (5 tests)
  ✓ data contracts (5)
    ✓ accepts an area with its current rent
    ✓ rejects unsupported id and period formats
    ✓ keeps missing rent values as null
    ✓ rejects a rent stored as a string
    ✓ rejects fields outside the contract

Test Files  1 passed (1)
     Tests  5 passed (5)
```

5 个测试全部通过，说明编号与季度格式、缺失值、数值类型和字段范围的规则都按证据设定的方式工作，`extend` 组合出的一行也保留了 `.strict()`。这个结论只针对手写的测试数据：目前还没有任何从真实源文件转换得到的数据经过这些 schema 的检查。

### 3. 用小型 fixture 计算每个区域的当前租金

第 2 节固定了区域列表中一行数据的样子：区域信息加上当前租金。这些数据要从 Step 06 核对过的两份官方源文件生成，但这两份文件都不是这个样子。要得到列表数据，需要一段转换代码，把源文件中的原始记录整理成 contract 规定的结构。本节先弄清这段转换代码要做什么，再在一个答案已知的小样本上把它写对。

#### 3.1 从一个真实 SA2 看转换要做的判断

Step 07 使用过的 Greensboro（`179900`）适合作为观察对象。先看它在 MBIE（租金） 数据集最新季度 `2026-04-01` 有多少条记录：

```bash
grep -cE '^2026-04-01,179900,' data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv
```

结果为：

```text
16
```

同一个 SA2、同一个季度有 16 条记录，因为 MBIE（租金） 按住宅类型和卧室数量分别统计。其中只有一条是 `ALL / ALL` 合计：

```bash
grep -E '^(2025-04-01|2026-04-01),179900,ALL,ALL,' data/raw/mbie/Detailed-Quarterly-Tenancy-Q1-2020-Q3-2026.csv
```

结果为：

```text
2026-04-01,179900,ALL,ALL,171,1755,165,350,395,550,290,0.3518
2025-04-01,179900,ALL,ALL,213,1608,186,350,390,560,280,0.3983
```

上面的数据按 CSV 表头的顺序，每行依次是季度、`Location Id`、住宅类型、卧室、Total Bonds、Active Bonds、Closed Bonds、Median Rent、Geometric Mean Rent，以及转换中不使用的三个字段。

这两行只有编号 `179900` 和租金，没有区域名称，也没有上级地理。这些信息在 Stats NZ（区域） 的 GeoPackage 中，Step 06 已经确认两边可以通过 SA2 编号连接。查询 Greensboro 的区域信息：

```bash
sqlite3 -header -column \
  data/raw/stats-nz/sa2-2019/statistical-area-2-higher-geographies-2019-generalised.gpkg \
  "SELECT SA22019_V1_00, SA22019_V1_00_NAME, REGC2019_V1_00, REGC2019_V1_00_NAME, TA2019_V1_00, TA2019_V1_00_NAME
   FROM statistical_area_2_higher_geographies_2019_generalised
   WHERE SA22019_V1_00 = '179900';"
```

结果为：

```text
SA22019_V1_00  SA22019_V1_00_NAME  REGC2019_V1_00  REGC2019_V1_00_NAME  TA2019_V1_00  TA2019_V1_00_NAME
-------------  ------------------  --------------  -------------------  ------------  -----------------
179900         Greensboro          03              Waikato Region       016           Hamilton City
```

区域列表中 Greensboro 这一行，按第 2 节的定义同时用到两份数据：

```text
区域信息，来自 Stats NZ（区域）
sa2Id                      179900
name                       Greensboro
regionCode / regionName    03 / Waikato Region
territorialAuthority...    016 / Hamilton City

当前租金，来自 MBIE（租金）
datasetLatestPeriod        2026-04-01
observationPeriod          2026-04-01
medianRent                 350
reportedBonds              171
yearOverYearChange         395 / 390 - 1 ≈ 0.0128
```

从上面的原始记录手工得到这一行，需要做出几个判断：

```text
1. 改字段名    两份源文件的字段名换成 contract 中的字段名
2. 选记录      MBIE（租金） 的 16 条记录中只使用 ALL / ALL 这一条
3. 转换数值    CSV 中的 "350" 是文字，要变成数字 350
4. 选当前季度  使用最新季度 2026-04-01 的记录
5. 算同比      用 2026-04-01 和四个季度前 2025-04-01 的 Geometric Mean Rent
```

Greensboro 是一个情况完整的区域，每个判断都很直接。真正容易出错的是不完整的区域，而前面的步骤已经观察到这些情况真实存在：

```text
租金为 NULL           Step 06：Median Rent 和 Geometric Mean Rent 各有 803 条 NULL 标记
非 SA2 编号           Step 06：Location Id 中有 -99 和 NULL
最新季度没有记录      Step 07：Waikato 的 222 个可发布 SA2 中，只有 162 个在最新季度
                      有 ALL / ALL 记录，另外 60 个没有
```

这些情况会让上面的判断变得不再直接，例如最新季度没有记录时，当前租金应该取哪个季度？租金是 `NULL` 时，同比还能不能算？这些问题必须有明确的规则：

```text
可发布区域    这个 Region 中在 MBIE（租金） 出现过任意记录的 SA2；-99 等非 SA2 编号不参与
当前租金      只看 ALL / ALL 记录；从最新季度往前，找到最后一个 Median Rent 不为 NULL 的季度
同比          只比较数据集最新季度和四个季度前；任一季度缺少几何平均租金时为 null
```

“当前租金”的规则来自第 2.2 节对 `observationPeriod` 的定义；“可发布区域”和“同比”的规则来自项目设计。同比使用数据集最新季度，而不是各区域当前租金所在的季度，所有区域才处在同一个比较区间，变化率才能放在一起比较。

#### 3.2 用答案已知的小样本覆盖每个判断

规则写成代码后，需要证明它是对的。直接在 Waikato 的真实数据上运行，会得到 222 个区域的结果，但无法逐个手工算出正确答案，也就无法判断结果对不对。更关键的是，结果的格式即使完全合法，内容也可能是错的，例如把旧季度误当成当前季度，`observationPeriod` 依然是一个格式正确的季度，第 2 节的 schema 不会报错。

因此先构造一个小测试样本，让每种情况各出现一次，并且在写代码之前能够手工写出正确答案。这样代码算出的结果与手工答案一致，才说明规则被正确实现。这种为测试准备的固定输入称为 fixture。

Step 06 的 `data/fixtures/data-join/` 只包含 `Location Id`，没有季度、分类和租金，无法覆盖这些规则，所以这里需要一组新的 fixture。

两个 fixture 都保持源文件的形状，只是行数很少：字段名、文字形式的数值、`NULL` 标记和 `-99` 编号都与源文件相同，转换代码在测试中读到的记录就和真实数据一样。

先设计样本，让每个区域对应一种情况：

```text
900001  Area A  两个季度都有 ALL / ALL 记录，另有一条 House / 3 卧记录
900002  Area B  最后一条记录早于数据集最新季度
900003  Area C  最新季度有记录，但租金为 NULL
900004  Area D  属于这个 Region，但没有任何 MBIE（租金） 记录
-99             非 SA2 编号
900099          不属于这个 Region 的编号
```

fixture 中的数值是为这些情况构造的，不代表真实租金。编号使用 `9000xx`：Stats NZ（区域） 2019 的 SA2 编号介于 `100100` 和 `400016` 之间，这些编号不会与真实区域混淆。数据集最新季度固定为 `2026-04-01`。

转换只使用 MBIE（租金） 源文件 12 个字段中的 7 个，因此 MBIE（租金） fixture 只保留这 7 个字段，字段名与源文件完全一致。按照上面的设计，`data/fixtures/first-slice/mbie-records.csv` 的内容是：

```csv
TimeFrame,Location Id,Dwelling Type,Number Of Beds,Total Bonds,Median Rent,Geometric Mean Rent
2025-04-01,900001,ALL,ALL,30,520,500
2026-04-01,900001,ALL,ALL,33,540,525
2026-04-01,900001,House,3,12,610,600
2025-01-01,900002,ALL,ALL,9,450,440
2025-10-01,900002,ALL,ALL,12,470,460
2026-01-01,900003,ALL,ALL,9,400,390
2026-04-01,900003,ALL,ALL,6,NULL,NULL
2026-04-01,-99,ALL,ALL,41000,600,570
2026-04-01,900099,ALL,ALL,15,480,470
```

Stats NZ（区域） 一侧使用 3.1 查询中的 6 个字段，字段名与 GeoPackage 完全一致。计算当前租金不需要区域边界，所以这里不包含 geometry 坐标数据。`data/fixtures/first-slice/stats-nz-areas.json` 的内容是：

```json
[
  {
    "SA22019_V1_00": "900001",
    "SA22019_V1_00_NAME": "Fixture Area A",
    "REGC2019_V1_00": "03",
    "REGC2019_V1_00_NAME": "Waikato Region",
    "TA2019_V1_00": "901",
    "TA2019_V1_00_NAME": "Fixture District"
  },
  {
    "SA22019_V1_00": "900002",
    "SA22019_V1_00_NAME": "Fixture Area B",
    "REGC2019_V1_00": "03",
    "REGC2019_V1_00_NAME": "Waikato Region",
    "TA2019_V1_00": "901",
    "TA2019_V1_00_NAME": "Fixture District"
  },
  {
    "SA22019_V1_00": "900003",
    "SA22019_V1_00_NAME": "Fixture Area C",
    "REGC2019_V1_00": "03",
    "REGC2019_V1_00_NAME": "Waikato Region",
    "TA2019_V1_00": "901",
    "TA2019_V1_00_NAME": "Fixture District"
  },
  {
    "SA22019_V1_00": "900004",
    "SA22019_V1_00_NAME": "Fixture Area D",
    "REGC2019_V1_00": "03",
    "REGC2019_V1_00_NAME": "Waikato Region",
    "TA2019_V1_00": "901",
    "TA2019_V1_00_NAME": "Fixture District"
  }
]
```

按照 3.1 的规则，手工得到的正确答案是：

```text
可发布区域    900001、900002、900003
              900004 没有 MBIE（租金） 记录；-99 和 900099 不是这个 Region 的 SA2

900001  当前租金 2026-04-01，Median Rent 540，Reported Bonds 33
        House / 3 记录不参与计算
        同比 525 / 500 - 1 = 0.05

900002  当前租金 2025-10-01，Median Rent 470，这是旧季度的租金
        2026-04-01 没有记录，同比为 null

900003  2026-04-01 的租金为 NULL，往前找到 2026-01-01
        当前租金 2026-01-01，Median Rent 400，Reported Bonds 9
        2026-04-01 没有几何平均租金，同比为 null
```

Area C 的 Reported Bonds 是 `9`，不是最新季度那条记录中的 `6`：当前租金中的每个数值都来自同一个季度，不能把不同季度的数值拼在一起。

#### 3.3 把源记录转换成租金记录和区域信息

转换从最小的单位开始：每份源文件中的一条记录。

```text
一条 MBIE（租金） 记录      → 一个季度的租金记录
一条 Stats NZ（区域） 记录  → 区域信息（第 2 节的 Area）
```

**MBIE（租金） 记录。** 计算当前租金只需要一条记录中的季度和三个数值：Total Bonds、Median Rent 和 Geometric Mean Rent。所以一条 MBIE（租金） 记录先转换成只有这四个字段的租金记录。这个租金记录只在转换代码内部使用。

CSV 解析后，每个字段都是字符串，而计算需要数字或 `null`。把字符串变成数字时有一个陷阱：JavaScript 的 `Number("350")` 得到 `350`，但 `Number("NULL")` 得到 `NaN`，`Number("")` 更是得到 `0`。如果对所有字段直接调用 `Number`，缺失值可能悄悄变成“租金为 0”，在排序中成为最便宜的区域。Step 06 的 profiling 把 `NULL` 和空字符串都计为缺失标记，因此这两种值都要先转换成 `null`。

**Stats NZ（区域） 记录。** 3.1 的查询结果中，Region 编号 `03` 和 territorial authority 编号 `016` 都保留了前导零。数字不会保留前导零，这说明这些字段以文本保存，与 contract 中的字符串字段类型相同，只需要换成 contract 的字段名。

转换代码与 Step 06、Step 07 的数据脚本一样，使用 Node.js 的 `.mjs` 模块。与那些脚本不同的是，它不读取文件，只接收已经读出的记录并返回结果。这样的函数只依赖输入：相同的输入总是得到相同的输出，测试可以直接把 fixture 交给它，而不需要真实源文件。

因此，两种记录各定义一个转换函数：`toQuarterlyRent` 和 `toArea`。把文本转换成数字或 `null` 的判断在三个数值字段上都要用，单独封装成工具函数 `toNullableNumber`。这些函数放在 `data/pipeline/first-slice.mjs`：

```js
function toNullableNumber(value) {
  return value === "NULL" || value === "" ? null : Number(value);
}

export function toQuarterlyRent(record) {
  return {
    period: record.TimeFrame,
    reportedBonds: toNullableNumber(record["Total Bonds"]),
    medianRent: toNullableNumber(record["Median Rent"]),
    geometricMeanRent: toNullableNumber(record["Geometric Mean Rent"]),
  };
}

export function toArea(row) {
  return {
    sa2Id: row.SA22019_V1_00,
    name: row.SA22019_V1_00_NAME,
    regionCode: row.REGC2019_V1_00,
    regionName: row.REGC2019_V1_00_NAME,
    territorialAuthorityCode: row.TA2019_V1_00,
    territorialAuthorityName: row.TA2019_V1_00_NAME,
  };
}
```

改名同时统一了产品中的叫法，例如 MBIE（租金） 的 `Total Bonds` 在产品中称为 Reported Bonds，因此写入 `reportedBonds`。

两个函数写好以后，要用 3.2 的样本确认转换结果。每个函数用一条记录检查即可，但这条记录要覆盖函数中所有需要判断的地方：

```text
toQuarterlyRent  使用 Area C 在 2026-04-01 的记录
                 它同时包含数字文本 6 和两个 NULL，一次就能检查两种转换
                 预期 reportedBonds 为 6，medianRent 和 geometricMeanRent 为 null

toArea           使用第一条 Stats NZ（区域） 记录，即 Area A
                 预期 6 个字段换成 contract 字段名，regionCode 仍是文本 "03"
```

测试要先读出两份 fixture。转换函数只接收已经读出的记录，所以读取文件的工作放在测试文件中：

- MBIE（租金） fixture 是 CSV，使用 Step 06 已安装的 `csv-parse` 解析。fixture 很小，所以使用同步接口一次读完。`columns: true` 让每条记录成为以表头字段命名的对象，与 Step 06 读取真实 CSV 时得到的记录形状一致。
- Stats NZ（区域） fixture 是 JSON，读出文本后直接用 `JSON.parse` 转换。

读取本地文件要用 Node.js 的 `node:fs`，这又涉及测试环境。Step 03 把 Vitest 的默认环境设为 `jsdom`，它在 Node.js 中模拟浏览器，供组件测试使用。转换代码不在浏览器中运行。Vitest 允许一个测试文件在第一行用注释声明自己的环境，因此这个测试文件单独使用 `node` 环境，组件测试不受影响。

测试文件 `data/pipeline/first-slice.test.mjs` 因此从环境声明和读取 fixture 开始：

```js
// @vitest-environment node
import { readFileSync } from "node:fs";

import { parse } from "csv-parse/sync";

const mbieRecords = parse(
  readFileSync(
    new URL("../fixtures/first-slice/mbie-records.csv", import.meta.url),
  ),
  { columns: true, skip_empty_lines: true },
);

const statsNzRows = JSON.parse(
  readFileSync(
    new URL("../fixtures/first-slice/stats-nz-areas.json", import.meta.url),
    "utf8",
  ),
);
```

fixture 读出来以后就可以写测试。测试要用到 Vitest 的 `describe`、`expect`、`it`，以及要测试的两个函数，先导入它们：

```js
import { describe, expect, it } from "vitest";

import { toArea, toQuarterlyRent } from "./first-slice.mjs";
```

两个测试各取一条 fixture 记录交给被测函数，再与上面列出的期望结果比较。`toEqual` 比较两个对象的全部字段和值：转换多出或漏掉一个字段，或者把 `NULL` 转成了 `NaN`，测试都会失败。

```js
describe("first data slice", () => {
  it("converts an MBIE（租金） record into a quarterly rent", () => {
    const record = mbieRecords.find(
      (row) => row["Location Id"] === "900003" && row.TimeFrame === "2026-04-01",
    );

    expect(toQuarterlyRent(record)).toEqual({
      period: "2026-04-01",
      reportedBonds: 6,
      medianRent: null,
      geometricMeanRent: null,
    });
  });

  it("converts a Stats NZ（区域） row into an area", () => {
    expect(toArea(statsNzRows[0])).toEqual({
      sa2Id: "900001",
      name: "Fixture Area A",
      regionCode: "03",
      regionName: "Waikato Region",
      territorialAuthorityCode: "901",
      territorialAuthorityName: "Fixture District",
    });
  });
});
```

最后让 Vitest 能找到这个测试。Step 03 配置的 `test.include` 只搜索 `src/` 下的 `.test.ts` 和 `.test.tsx` 文件，而这个测试位于 `data/pipeline/`，扩展名是 `.mjs`。因此要把 `data/` 下的 `.mjs` 测试加入 `vite.config.ts` 的 `test.include`：

```ts
include: [
  "src/**/*.test.{ts,tsx}",
  "src/**/*.spec.{ts,tsx}",
  "data/**/*.test.mjs",
],
```

运行转换测试：

```bash
npm run test -- data/pipeline/first-slice.test.mjs
```

输出为：

```text
✓ data/pipeline/first-slice.test.mjs (2 tests)
  ✓ first data slice (2)
    ✓ converts an MBIE（租金） record into a quarterly rent
    ✓ converts a Stats NZ（区域） row into an area

Test Files  1 passed (1)
     Tests  2 passed (2)
```

Vitest 找到了 `data/` 下的测试，两条源记录都按预期转换。这个结果只说明单条记录的转换正确，还没有涉及当前租金、同比或区域筛选。

#### 3.4 计算一个区域的当前租金

单条记录已经可以转换成季度租金记录。区域列表需要的却是第 2 节的当前租金 `CurrentRent`：它把一个区域的全部季度租金记录归结为一组当前数值。其中的季度、Median Rent 和 Reported Bonds 按 3.1 的“当前租金”规则选出，`yearOverYearChange` 按“同比”规则计算。

计算当前租金的函数命名为 `buildCurrentRent`。先确定它接收什么，再逐条实现这两条规则。

**函数的输入。** `buildCurrentRent` 接收两个参数。

第一个参数 `quarterlyRents` 是一个区域全部 `ALL / ALL` 季度租金记录组成的数组。它由 3.3 的 `toQuarterlyRent` 的结果组成：

```text
一个区域的多条 MBIE（租金） 记录
   │  逐条调用 toQuarterlyRent
   ▼
多个季度租金记录：只保留 ALL / ALL，按季度从旧到新排列
   │  组成 quarterlyRents 数组
   ▼
buildCurrentRent
   │  应用当前租金和同比规则
   ▼
这个区域的当前租金
```

筛选 `ALL / ALL` 和按季度排序由调用这个函数的代码负责，`buildCurrentRent` 只做计算。

以 Area C 为例，它的 `quarterlyRents` 是：

```text
quarterlyRents[0]  period 2026-01-01  reportedBonds 9  medianRent 400   geometricMeanRent 390
quarterlyRents[1]  period 2026-04-01  reportedBonds 6  medianRent null  geometricMeanRent null
```

第二个参数 `datasetLatestPeriod` 是数据集最新季度。它无法从一个区域的记录中推断：Area B 的记录停在 `2025-10-01`，但整个数据集的最新季度是 `2026-04-01`。因此它由外部传入。

**当前租金。** 规则是从最新季度往前，找到最后一个 Median Rent 不为 `null` 的季度。`quarterlyRents` 已经从旧到新排列，所以只要从数组末尾往前查找。以 Area C 为例：`quarterlyRents[1]` 的租金为 `null`，跳过；`quarterlyRents[0]` 有租金，它就是当前租金的来源。

JavaScript 数组的 `findLast` 方法正好做这件事：它从数组末尾开始逐个检查元素，返回第一个满足条件的元素；一个都找不到时返回 `undefined`。

找到这条记录后，`observationPeriod`、`medianRent` 和 `reportedBonds` 都从它读取。所以 Area C 的 Reported Bonds 是 `9`，而不是 `2026-04-01` 那条记录中的 `6`。如果一个区域从未有过有效租金，`findLast` 返回 `undefined`，这三个字段都应为 `null`。

直接读取 `undefined` 的属性会报错，因此读取时要处理“可能找不到”的情况。JavaScript 为此提供了两个运算符：

```text
?.     左边是 undefined 或 null 时，不继续读取属性，直接得到 undefined
??     左边是 undefined 或 null 时，使用右边的值
```

两者连用，`latestObservedQuarter?.period ?? null` 的含义是：找到了记录就取它的季度，找不到就得到 `null`。用 `findLast` 找到记录，再用这种写法读取字段，就得到 `buildCurrentRent` 的第一部分：

```js
export function buildCurrentRent(quarterlyRents, datasetLatestPeriod) {
  const latestObservedQuarter = quarterlyRents.findLast(
    (quarterlyRent) => quarterlyRent.medianRent !== null,
  );

  return {
    datasetLatestPeriod,
    observationPeriod: latestObservedQuarter?.period ?? null,
    medianRent: latestObservedQuarter?.medianRent ?? null,
    reportedBonds: latestObservedQuarter?.reportedBonds ?? null,
  };
}
```

**同比。** 规则是比较两个固定季度的 Geometric Mean Rent：`datasetLatestPeriod`，以及四个季度前。实现时要依次解决三个问题。

第一个问题是四个季度前是哪个季度。季度使用 `YYYY-MM-DD` 格式，四个季度前就是上一年的同一季度，只要把年份减 1：`2026-04-01` 变成 `2025-04-01`。这个计算与具体区域无关，可以封装成工具函数 `sameQuarterLastYear`：

```js
function sameQuarterLastYear(period) {
  const year = Number(period.slice(0, 4));
  return `${year - 1}${period.slice(4)}`;
}
```

第二个问题是怎样读取某个季度的租金。用数组的 `find` 方法，从 `quarterlyRents` 中找出 `period` 等于这个季度的记录。读取会遇到两种缺失：Area B 在 `2026-04-01` 没有记录，`find` 返回 `undefined`；Area C 在 `2026-04-01` 有记录，但租金为 `null`。用前面的 `?.` 和 `??`，两种情况都会得到 `null`。因此，先调用 `sameQuarterLastYear` 得到去年的同一季度，再用 `find` 分别取出两个季度的记录，读出它们的几何平均租金：

```js
  const lastYearPeriod = sameQuarterLastYear(datasetLatestPeriod);
  const currentQuarter = quarterlyRents.find(
    (quarterlyRent) => quarterlyRent.period === datasetLatestPeriod,
  );
  const lastYearQuarter = quarterlyRents.find(
    (quarterlyRent) => quarterlyRent.period === lastYearPeriod,
  );
  const currentGeometricMeanRent = currentQuarter?.geometricMeanRent ?? null;
  const lastYearGeometricMeanRent = lastYearQuarter?.geometricMeanRent ?? null;
```

第三个问题是浮点误差。两个租金都存在时，计算 `当前 / 去年 - 1`。`525 / 500 - 1` 在 JavaScript 中得到 `0.050000000000000044`，而不是 `0.05`。变化率在页面上以百分比显示，保留 4 位小数已经精确到 0.01 个百分点，所以结果四舍五入到 4 位小数。这个处理同样与具体区域无关，也封装成工具函数 `roundChange`：

```js
function roundChange(value) {
  return Math.round(value * 10000) / 10000;
}
```

有了两个季度的租金和 `roundChange`，返回结果中就可以加上同比：两个租金都存在时计算变化率，否则为 `null`。

```js
    yearOverYearChange:
      currentGeometricMeanRent !== null && lastYearGeometricMeanRent !== null
        ? roundChange(currentGeometricMeanRent / lastYearGeometricMeanRent - 1)
        : null,
```

**测试。** 测试对照 3.2 中三个区域的手工答案。测试要为每个区域准备 `quarterlyRents` 数组。fixture 中每个区域的记录已经按季度从旧到新书写，所以只要从 `mbieRecords` 中筛出这个区域的 `ALL / ALL` 记录，再逐条交给 `toQuarterlyRent`，就得到符合要求的输入。Area A 的 `House / 3` 记录在筛选时被去掉。

这项准备工作由两个辅助函数完成：`quarterlyRentsOf` 为一个区域准备 `quarterlyRents`，`currentRentOf` 再用它和数据集最新季度 `2026-04-01` 计算这个区域的当前租金。

当前租金的测试只检查与当前季度有关的字段，所以使用 `toMatchObject`：它只比较列出的字段，其余字段不参与比较。同比的测试使用 `toBe`，它要求两个值完全相同，`toBe(0.05)` 能够通过，就说明四舍五入消除了浮点误差。

两个辅助函数都建立在已经读出的 `mbieRecords` 上，测试文件也要导入 `buildCurrentRent`：

```js
const quarterlyRentsOf = (sa2Id) =>
  mbieRecords
    .filter(
      (row) =>
        row["Location Id"] === sa2Id &&
        row["Dwelling Type"] === "ALL" &&
        row["Number Of Beds"] === "ALL",
    )
    .map((row) => toQuarterlyRent(row));

const currentRentOf = (sa2Id) =>
  buildCurrentRent(quarterlyRentsOf(sa2Id), "2026-04-01");
```

用这两个函数，当前租金和同比各写一个测试：

```js
it("uses the latest observed quarter as the current rent", () => {
  // Area A：最新季度有租金，直接使用最新季度。
  expect(currentRentOf("900001")).toMatchObject({
    observationPeriod: "2026-04-01",
    medianRent: 540,
    reportedBonds: 33,
  });
  // Area B：最后一条记录在 2025-10-01，当前租金停在这个旧季度。
  expect(currentRentOf("900002")).toMatchObject({
    observationPeriod: "2025-10-01",
    medianRent: 470,
  });
  // Area C：最新季度租金为 NULL，往前使用 2026-01-01；Bonds 也取这个季度的 9。
  expect(currentRentOf("900003")).toMatchObject({
    observationPeriod: "2026-01-01",
    medianRent: 400,
    reportedBonds: 9,
  });
});

it("calculates the 12-month change only when both quarters exist", () => {
  // Area A：525 / 500 - 1 = 0.05。
  expect(currentRentOf("900001").yearOverYearChange).toBe(0.05);
  // Area B：2026-04-01 没有记录。
  expect(currentRentOf("900002").yearOverYearChange).toBeNull();
  // Area C：2026-04-01 的 Geometric Mean Rent 为 NULL。
  expect(currentRentOf("900003").yearOverYearChange).toBeNull();
});
```

运行转换测试：

```bash
npm run test -- data/pipeline/first-slice.test.mjs
```

输出为：

```text
✓ data/pipeline/first-slice.test.mjs (4 tests)
  ✓ first data slice (4)
    ……（3.3 的 2 个测试省略）
    ✓ uses the latest observed quarter as the current rent
    ✓ calculates the 12-month change only when both quarters exist

Test Files  1 passed (1)
     Tests  4 passed (4)
```

新增的两个测试通过，三个区域的当前租金和同比都与 3.2 的手工答案一致。这个结果只说明一个区域的租金记录已经整理好时，计算是正确的；测试中的 `quarterlyRents` 由测试代码准备，还没有从一个 Region 的全部记录中自动整理出来。

#### 3.5 整理一个 Region 的全部记录

3.4 的测试中，每个区域的 `quarterlyRents` 都由测试代码中的 `quarterlyRentsOf` 准备：指定一个 SA2 编号，从 fixture 中筛出它的 `ALL / ALL` 记录，再逐条交给 `toQuarterlyRent`。

真实转换中没有人逐个指定 SA2 编号。它拿到的是一个 Region 的全部源记录，要自己找出发布哪些区域，并为每个区域整理出 `quarterlyRents`。完成这项工作的函数命名为 `buildRegionCurrentRents`，它接收三个值：

```text
statsNzRows          这个 Region 全部 SA2 的 Stats NZ（区域） 记录
mbieRecords          MBIE（租金） 记录，包含所有 SA2、所有住宅类型和卧室数
datasetLatestPeriod  数据集最新季度，原样交给 buildCurrentRent
```

```js
export function buildRegionCurrentRents({ statsNzRows, mbieRecords, datasetLatestPeriod }) {
  // ...
}
```

它返回可发布区域的列表，每个元素就是第 2 节定义的列表中的一行 `AreaWithCurrentRent`：`toArea` 得到的区域信息，加上 `buildCurrentRent` 计算出的 `currentRent`。

`buildRegionCurrentRents` 调用 3.3 和 3.4 已经测试过的三个函数，自己只负责判断记录属于哪个 SA2、分组、排序和组合结果。下面按这个顺序分四部分写出它。

**1. 确定这个 Region 的 SA2。** 先把 Stats NZ（区域） 记录逐条交给 `toArea`。数组的 `map` 方法会把数组中的每个元素依次交给一个函数，再把每次的返回值按原顺序组成新数组。`statsNzRows.map((row) => toArea(row))` 中，`row` 依次是 `statsNzRows` 的每一条记录，得到的 `areas` 就是区域信息组成的数组。

MBIE（租金） 记录中混有其他 Region 的编号，以及 `-99` 这类非 SA2 编号，读取时要逐条判断编号是否属于这个 Region。因此把这个 Region 的 SA2 编号放进 Step 06 用过的 `Set`，判断时调用它的 `has` 即可。

因此，函数的第一部分先转换区域记录，再把编号放进 `Set`：

```js
export function buildRegionCurrentRents({ statsNzRows, mbieRecords, datasetLatestPeriod }) {
  // 1. 确定这个 Region 的 SA2
  const areas = statsNzRows.map((row) => toArea(row));
  const regionSa2Ids = new Set(areas.map((area) => area.sa2Id));
}
```

参数写成 `{ statsNzRows, mbieRecords, datasetLatestPeriod }`，表示调用时传入一个对象，函数从中取出这三个同名字段，作为三个变量使用。

**2. 按 SA2 收集租金记录。** `quarterlyRentsOf` 每处理一个 SA2，都要把全部记录从头筛选一遍。真实数据有 226,080 条记录，Waikato 有 222 个可发布 SA2，这样要检查五千多万次。因此这里只读一遍 MBIE（租金） 记录，每读到一条，就放进它所属 SA2 的列表。“SA2 编号 → 季度租金记录列表”的对应关系用 Step 06 用过的 `Map` 保存。

放进列表时，要区分 3.1 的两条规则，因为它们看的记录范围不同：

```text
可发布区域   出现过任意住宅类型和卧室数的记录
当前租金     只看 ALL / ALL 记录
```

所以读到一条属于这个 Region 的记录时，先确保这个 SA2 在 `Map` 中有一个列表；只有 `ALL / ALL` 记录才转换成季度租金记录，放进列表。这样，`Map` 中有没有这个 SA2，回答它能否发布；它的列表就是计算当前租金的输入。Area A 的 `House / 3` 记录能证明 Area A 出现过，但不进入它的列表。

判断 `ALL / ALL` 要用到两个固定的分类值，先把它们定义成常量，代码中就能看出这两个 `"ALL"` 的含义：

```js
const defaultDwellingType = "ALL";
const defaultBedrooms = "ALL";
```

有了 `Set` 和这两个常量，函数的第二部分逐条读取 MBIE（租金） 记录，把属于这个 Region 的记录放进 `Map`：

```js
  // 2. 按 SA2 收集租金记录
  const quarterlyRentsBySa2Id = new Map();

  for (const record of mbieRecords) {
    const sa2Id = record["Location Id"];

    if (!regionSa2Ids.has(sa2Id)) {
      continue;
    }

    if (!quarterlyRentsBySa2Id.has(sa2Id)) {
      quarterlyRentsBySa2Id.set(sa2Id, []);
    }

    if (
      record["Dwelling Type"] === defaultDwellingType &&
      record["Number Of Beds"] === defaultBedrooms
    ) {
      quarterlyRentsBySa2Id.get(sa2Id).push(toQuarterlyRent(record));
    }
  }
```

`continue` 结束这一次循环，直接读取下一条记录。

**3. 确定可发布区域。** 读完全部记录后，`areas` 中在 `Map` 里存在的 SA2，就是可发布区域，用 `filter` 留下它们。可发布区域再按 SA2 编号排序，输出顺序就不依赖 Stats NZ（区域） 记录的排列。SA2 编号是文本，使用 Step 06 用过的 `localeCompare` 比较。函数的第三部分因此是：

```js
  // 3. 确定可发布区域
  const publishedAreas = areas
    .filter((area) => quarterlyRentsBySa2Id.has(area.sa2Id))
    .sort((left, right) => left.sa2Id.localeCompare(right.sa2Id));
```

**4. 计算每个可发布区域的当前租金。** 每个区域的列表交给 `buildCurrentRent` 之前，还要按季度排序。`buildCurrentRent` 要求 `quarterlyRents` 从旧到新排列，fixture 是按这个顺序书写的，真实 CSV 却不是：3.1 的输出中，Greensboro 的 `2026-04-01` 记录排在 `2025-04-01` 之前。不排序的话，`buildCurrentRent` 会把最旧的租金当成当前租金。季度是 `YYYY-MM-DD` 格式的文本，文本顺序就是时间顺序，所以同样使用 `localeCompare`。

最后把区域信息和当前租金组合成列表中的一行：`{ ...area, currentRent: ... }` 中的 `...` 是第 2.6 节测试中用过的展开写法，它把 `area` 的全部字段复制到新对象中，再加上 `currentRent`。

函数的最后一部分对每个可发布区域先排序，再调用 `buildCurrentRent` 得到当前租金，最后和区域信息组合成一行：

```js
  // 4. 计算每个可发布区域的当前租金
  const areasWithCurrentRent = [];

  for (const area of publishedAreas) {
    const quarterlyRents = quarterlyRentsBySa2Id.get(area.sa2Id);
    quarterlyRents.sort((left, right) => left.period.localeCompare(right.period));

    areasWithCurrentRent.push({
      ...area,
      currentRent: buildCurrentRent(quarterlyRents, datasetLatestPeriod),
    });
  }

  return areasWithCurrentRent;
```

**测试。** 可发布区域和 Area B 的当前租金对照 3.2 的手工答案。排序用另一种方式检查：两份源记录都颠倒顺序，季度变成从新到旧，转换结果必须与原顺序完全相同。

颠倒顺序要用数组的 `reverse`。它会直接修改原数组，而两份源记录还要被其他测试使用，所以先用 `[...数组]` 复制一份再颠倒，这里的 `...` 把原数组的全部元素展开到新数组中。

这些测试都使用同一个 Region 的转换结果，所以导入 `buildRegionCurrentRents` 后只调用一次，把结果保存为 `regionCurrentRents`：

```js
const regionCurrentRents = buildRegionCurrentRents({
  statsNzRows,
  mbieRecords,
  datasetLatestPeriod: "2026-04-01",
});
```

三个测试分别检查可发布区域、Area B 的当前租金和源记录的顺序：

```js
// 900004 没有 MBIE（租金） 记录；-99 和 900099 不在这个 Region 中。
it("publishes only Region areas that appear in the MBIE（租金） records", () => {
  expect(regionCurrentRents.map((area) => area.sa2Id)).toEqual([
    "900001",
    "900002",
    "900003",
  ]);
});

it("attaches the current rent to each published area", () => {
  const areaB = regionCurrentRents.find((area) => area.sa2Id === "900002");

  expect(areaB.currentRent).toEqual(currentRentOf("900002"));
});

it("does not depend on the order of the source records", () => {
  const reversedResult = buildRegionCurrentRents({
    statsNzRows: [...statsNzRows].reverse(),
    mbieRecords: [...mbieRecords].reverse(),
    datasetLatestPeriod: "2026-04-01",
  });

  expect(reversedResult).toEqual(regionCurrentRents);
});
```

运行转换测试：

```bash
npm run test -- data/pipeline/first-slice.test.mjs
```

输出为：

```text
✓ data/pipeline/first-slice.test.mjs (7 tests)
  ✓ first data slice (7)
    ……（3.3 和 3.4 的 4 个测试省略）
    ✓ publishes only Region areas that appear in the MBIE（租金） records
    ✓ attaches the current rent to each published area
    ✓ does not depend on the order of the source records

Test Files  1 passed (1)
     Tests  7 passed (7)
```

新增的三个测试通过，可发布区域和 Area B 的当前租金与手工答案一致，源记录颠倒顺序后结果不变。这个结果只说明计算出的数值正确，还没有确认每一行都符合第 2 节的 contract。

#### 3.6 用 contract 检查转换结果

前面的测试检查规则选出的数值是否正确。转换结果还要满足第 2 节的 contract，例如编号必须是六位数字、租金必须是数字或 `null`、不能出现定义之外的字段。两类检查互相补充：规则测试能发现“数值选错了”，contract 能发现“形状或类型错了”。

`src/data/contracts.ts` 中的 schema 可以直接在转换测试中使用。Vitest 读取 `vite.config.ts` 中的 `@/` 别名，因此 `data/` 下的测试也能写 `import { areaWithCurrentRentSchema } from "@/data/contracts";`。最后一个测试遍历 `regionCurrentRents`，对每一行调用 `parse`：数据不符合 contract 时抛出错误，测试随之失败；全部数据通过时，测试正常结束。

```js
it("produces rows that satisfy the contract", () => {
  for (const row of regionCurrentRents) {
    areaWithCurrentRentSchema.parse(row);
  }
});
```

运行完整的转换测试：

```bash
npm run test -- data/pipeline/first-slice.test.mjs
```

输出为：

```text
✓ data/pipeline/first-slice.test.mjs (8 tests)
  ✓ first data slice (8)
    ✓ converts an MBIE（租金） record into a quarterly rent
    ✓ converts a Stats NZ（区域） row into an area
    ✓ uses the latest observed quarter as the current rent
    ✓ calculates the 12-month change only when both quarters exist
    ✓ publishes only Region areas that appear in the MBIE（租金） records
    ✓ attaches the current rent to each published area
    ✓ does not depend on the order of the source records
    ✓ produces rows that satisfy the contract

Test Files  1 passed (1)
     Tests  8 passed (8)
```

8 个测试全部通过。转换代码按 3.1 的规则从两份源文件形状的记录中算出了正确的当前租金，结果也符合第 2 节的 contract。这个结论只针对 fixture：转换代码还没有读取真实的 MBIE（租金） CSV 和 Stats NZ（区域） GeoPackage，也还没有生成任何页面可以读取的文件。

### 4. 生成第一个版本化 Waikato release

### 5. 建立 manifest 驱动的数据 repository

### 6. 用同一份当前租金连接 Explore 列表与地图

### 7. 建立最小 Area Detail 数据链路

### 8. 让页面表达数据来源、周期与 provisional 状态

### 9. 更新公开说明并移除技术样例

### 10. 验证完整纵向链路并完成 Git 操作

### Step 08 完成状态
