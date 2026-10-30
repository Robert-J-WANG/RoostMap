# RoostMap 学习笔记

RoostMap 是一个面向新西兰租客的区域选择与负担能力分析项目。项目以 MBIE Rental Bond Data 和 Stats NZ SA2 2019 为核心数据，通过地图、历史趋势、区域比较和通勤估算帮助用户理解居住成本差异。

本文件按实际开发顺序记录各 Step 的思路、操作、代码、验证和修正。它以开发纲要为顺序依据，不重新定义产品范围和技术基线；项目当前行为仍以源码、配置和测试为准。后续内容在前一步完成并核查后继续追加。

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
⬜ 已从 main 创建 test/foundation 分支
⬜ Vitest、jsdom 和 React Testing Library 已安装
⬜ jest-dom 和测试清理已经配置
⬜ App 组件测试通过
⬜ Playwright 和 Chromium 已安装
⬜ 首页浏览器 smoke test 通过
⬜ 测试配置和测试文件参与 TypeScript 检查
⬜ npm run check 依次通过 lint、test、build 和 E2E
⬜ 测试报告和结果目录没有进入 Git
⬜ 测试基础已通过 Pull Request 合并到 main
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
            <li>MBIE Rental Bond Data</li>
            <li>Stats NZ Statistical Area 2 Higher Geographies 2019</li>
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
⬜ 已从 main 创建 feat/app-shell 分支
⬜ Tailwind CSS Vite 插件已经配置
⬜ shadcn/ui 已初始化并加入当前需要的组件
⬜ 基础视觉 token 和页面布局规则已经建立
⬜ 首次访问跟随系统主题，用户可以明确切换并保存 light 或 dark
⬜ AppShell 和 RootLayout 已建立
⬜ Home、Methodology 和 Not Found 页面已建立
⬜ React Router 和页面标题已经配置
⬜ 404 与页面错误边界已经建立
⬜ 桌面与移动端布局可用
⬜ 路由、主题工具、主题组件和 Playwright 测试已更新
⬜ npm run check 通过
⬜ README 已记录 Step 04 完成后的状态
⬜ 应用外壳已通过 Pull Request 合并到 main
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
⬜ 已建立 ci/initial-delivery 分支并通过初始本地检查
⬜ 已理解 GitHub 平台、runner 与 Azure 的职责边界
⬜ Pull Request workflow 可以响应 PR 创建和更新
⬜ Quality job 已在远程 runner 中真实运行
⬜ frontend-dist 可以在不同 job 之间传递
⬜ React Router 页面回退规则已进入构建产物
⬜ Azure Static Web Apps 资源和 Deployment Token 已建立
⬜ Deploy job 已生成真实 Pull Request Preview
⬜ Playwright 已支持 Local 和远程测试目标
⬜ Deployed smoke test 已验证真实 Preview
⬜ PR 关闭后可以自动清理 Preview
⬜ main 的 required checks 已生效
⬜ 失败的 Quality 检查能够阻止合并和部署
⬜ Production workflow 已建立
⬜ 最终 npm run check 通过
⬜ README 已记录本步成功完成后的状态
⬜ Pull Request 已通过 Squash Merge 进入 main
⬜ Production deploy 和 Production smoke test 已通过
⬜ Preview 已清理，Production URL 可以访问
⬜ 本地 main 已同步，功能分支已清理
```

## Step 06 · 验证租金数据与 SA2 关联

### 这一步做什么

前面的步骤已经建立了应用外壳和交付流程，但 RoostMap 还没有经过验证的地区租金数据。要继续实现核心功能，首先要确认两份官方数据能否正确关联。

MBIE 的 Rental Bond Data 按季度记录租金统计，其中使用 `Location Id` 表示地区。Stats NZ 的 SA2 2019 数据记录统计区域的编号、名称和边界。两份数据各自提供了一部分信息：

```text
MBIE Rental Bond Data
└─ 地区对应的租金统计

Stats NZ SA2 2019
└─ 地区编号、名称和边界
```

如果 MBIE 的 `Location Id` 与 Stats NZ 的 SA2 编号表示同一个地区，就可以把租金统计与地区信息连接起来：

```text
MBIE Location Id
        ↓
Stats NZ SA2 编号
        ↓
租金统计 + 地区名称 + 地区边界
```

字段名称和编号形式相似，只能说明它们可能有关联，不能证明全国数据都能正确对应。因此，本步需要检查真实文件的字段和取值，找出可以参与关联的 MBIE 记录，再验证这些记录能否找到对应的 SA2 和地区边界。

本步完成时，需要能够根据实际检查结果回答：

```text
哪些 MBIE 记录可以参与 SA2 关联？
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

#### 2.1 取得 MBIE 租金数据

进入 MBIE 的 [Rental Bond Data](https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/) 页面，下载 detailed quarterly tenancy CSV，并保存为：

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

#### 2.2 取得 Stats NZ SA2 数据

进入 Stats NZ Datafinder 的 [Statistical Area 2 Higher Geographies 2019 Generalised](https://datafinder.stats.govt.nz/layer/98779-statistical-area-2-higher-geographies-2019-generalised/) 页面，创建以下导出：

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

到这里可以确认，MBIE 文件是 CSV，Stats NZ 文件包含二进制 GeoPackage。它们都是保持原样的官方输入，不适合反复写入 Git 历史，因此仓库通过 `.gitignore` 排除整个 raw 目录：

```gitignore
data/raw/
```

现在已经取得并核对了两份原始输入：一份 MBIE 租金 CSV 和一份 Stats NZ SA2 GeoPackage。文件类型和哈希值只能证明下载内容明确且可以读取；要判断它们能否关联，还需要继续检查两份文件内部的字段和数据结构。

### 3. 理解两份数据的结构

两份来源文件已经确认可以读取，但文件类型和哈希值无法说明内部字段能否关联。接下来分别查看它们的结构，先找出可能连接两份数据的字段。

#### 3.1 检查 MBIE CSV

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

字段名称还不能完整说明统计口径，因此需要同时阅读下载页面的说明。MBIE 说明这份数据：

- 来自登记到 tenancy bond database 的私人租赁债券；
- 按 tenancy start date 统计；
- 使用 Stats NZ 的 SA2 2019 地区定义；
- 因新旧 bond management systems 的迁移和数据整理而处于 provisional 状态，后续可能修订；
- 对数量使用以 3 为基数的 fixed random rounding，并在某个选择少于 5 个 bonds 时抑制结果。

这些说明确认 `Location Id` 与 SA2 2019 有直接关系，也说明当前数据不能被理解为未经处理的精确个案记录。CSV 中实际包含哪些位置编号和分类值，仍需要根据整个文件继续检查。

#### 3.2 检查 Stats NZ GeoPackage

解压目录中的说明文件指出，这份数据保存 Stats NZ 在 2019 年定义的 SA2 边界，并把每个 SA2 对应到 territorial authority 和 regional council。当前导出已经转换为 WGS 84。

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

MBIE 官方说明表明租金数据使用 SA2 2019 地区定义，Stats NZ 表中对应的编号字段是 `SA22019_V1_00`，因此可以提出下面的关联假设：

```text
MBIE Location Id = Stats NZ SA22019_V1_00
```

当前只确认了候选关联字段。MBIE 样本中已经出现 `NULL`、`-99` 和六位编号，而 Stats NZ 也有少量空 geometry；在决定哪些记录可以参与关联之前，还需要先了解这些情况在完整数据中的分布。

### 4. 对 MBIE 全国数据进行 profiling

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

4.2 得到 2,011 种 `Location Id`，但这个总数没有说明这些值是否都具有 Stats NZ SA2 编号的形式。第 3 节提出的关联假设要求两边编号能够对应，因此现在需要进一步看清 `Location Id` 的组成。

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

文件读取结束后，`locationIds` 已经包含所有不同值，`locationIdCounts` 也已经保存每个值的出现行数。Stats NZ 样本中的 SA2 编号是六位数字，因此在循环结束后检查哪些 MBIE 值具有相同形式：

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

2,011 种 `Location Id` 由 2,009 个六位编号、`-99` 和 `NULL` 组成，没有出现其他形式的值。六位格式与 Stats NZ 样本中的 SA2 编号形式一致，因此当前只能把这 2,009 个值视为候选编号；格式相同还不能证明每个编号都能关联成功。

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
MBIE Location Id = Stats NZ SA22019_V1_00
```

第 4 节已经确认 MBIE 文件中哪些 `Location Id` 具有六位 SA2 编号的形式。接下来需要检查的不是两边各有多少个编号，而是 MBIE 中的每一个候选编号能否在 Stats NZ 数据中找到。

这个问题可以转换成两个编号集合之间的比较。设 MBIE 候选编号为集合 A，Stats NZ SA2 编号为集合 B：

```text
A ∩ B  同时存在于两份数据中的编号
A - B  只存在于 MBIE、无法找到对应 SA2 的编号
```

编号出现在交集中，只能证明两边存在同一个编号。RoostMap 还需要地区边界，因此找到编号后还要检查对应 Stats NZ 记录的 geometry。

关联验证由此分成三个连续阶段：

```text
建立 MBIE 候选编号集合
→ 建立 Stats NZ SA2 编号与 geometry 的对应关系
→ 比较编号并检查匹配记录的 geometry
```

这些检查需要同时读取两份源文件，因此建立 `data/scripts/verify-data-join.mjs`。

#### 5.1 建立 MBIE 候选编号集合

集合比较需要先准备 A。第 4.3 节已经确定，只有正好由六位数字组成的 `Location Id` 才具有当前 Stats NZ SA2 编号的形式。关联脚本沿用同一条判断规则，使 profiling 和关联验证使用相同的候选范围。

新脚本先加入读取 MBIE CSV 需要的 import、文件位置和字段读取函数：

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

#### 5.2 建立 Stats NZ SA2 编号与 geometry 的对应关系

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

MBIE 循环结束后，查询每个 SA2 编号及其 geometry 状态：

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

对集合 A 中的每个编号调用 `statsNzAreas.has()`，就能判断 Stats NZ 映射中是否存在同一个键。根据判断结果，将编号分别放进 `matchedIds` 和 `unmatchedIds`：

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

2,009 个 MBIE 候选编号全部存在于 Stats NZ SA2 数据中，没有未关联编号。Stats NZ 全表虽然有 16 条记录缺少 geometry，但这些记录不在当前匹配结果中；2,009 个匹配编号都具有 geometry。

因此，当前两份源文件在地区编号层面满足下面的关联：

```text
MBIE 六位 Location Id
→ Stats NZ SA2 编号
→ 存在 geometry
```

这个结论限定在本节检查的编号与 geometry：它证明候选地区可以完成关联，不改变第 4 节记录的其他源数据情况。

### 6. 统计 MBIE 记录的关联结果

第 5 节验证的是不同地区编号之间的关系。一个地区编号会在不同季度、住宅类型和卧室分类中重复出现，因此编号全部匹配还不能说明完整 CSV 中有多少条记录完成了关联。

现在把检查单位从编号推进到记录。每条 MBIE 记录根据 `Location Id` 和 Stats NZ 查询结果，只能进入下面四种情况之一：

```text
Location Id 不是六位候选编号
Location Id 找不到对应 SA2
Location Id 找到 SA2，但对应记录没有 geometry
Location Id 找到 SA2，并且对应记录有 geometry
```

四种记录数量相加应当等于 MBIE 输入总数。这样既能得到关联成功的记录数，也能检查统计过程中是否遗漏了记录。

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

然后遍历 `mbieCandidateIdCounts`。每次循环取得一个 `sa2Id` 和它对应的 `recordCount`，再按顺序判断 Stats NZ 映射：

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

224,195 条记录使用六位候选编号，并且全部找到带有 geometry 的 Stats NZ SA2。1,885 条记录的 `Location Id` 不属于六位候选编号；这个数量与第 4.3 节的位置编号统计一致。候选记录中没有未找到 SA2 或缺少 geometry 的情况。

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
Stats NZ 中的 Chatham Islands 地区
                         检查只有边界、没有 MBIE 观察记录的地区
```

前三项来自已经完成关联的 2,009 个 SA2。最后一项来自 Stats NZ 边界数据，用来保留一个与前三项不同的边界情况。选择条件直接作用于完整源数据，因此源文件不变时会得到相同样本。

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

查询仍然只读取同一张 Stats NZ 业务表。新增字段用于解释样本，`hasGeometry` 的判断保持不变。

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

这样，同一份 Stats NZ 查询结果同时支持关联计数和样本说明，不需要再次读取 GeoPackage。

#### 7.2 根据完整数据选择样本

继续在 `data/scripts/verify-data-join.mjs` 中处理样本。`matchedIds` 已经保存全部匹配成功的 SA2 编号，`mbieCandidateIdCounts` 保存每个编号对应的 MBIE 记录数。在 `accountedRecords` 计算完成后、`console.log()` 输出之前，把两部分信息组合成用于比较的完整地区列表：

```js
const joinedAreaDetails = matchedIds.map((sa2Id) => ({
  ...statsNzDetails.get(sa2Id),
  recordCount: mbieCandidateIdCounts.get(sa2Id),
}));
```

现在列表中的每一项既有 Stats NZ 地区信息，也有对应的 MBIE 记录数。先按记录数从高到低和从低到高排序，取得高频与稀疏样本：

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

前三个样本都来自 `joinedAreaDetails`，因此一定同时具有 MBIE 观察记录和 Stats NZ geometry。Chatham Islands 的样本需要从完整 Stats NZ 列表中寻找，并明确排除已经出现在 MBIE 候选编号集合中的地区：

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

这里要求地区有 geometry、没有 MBIE 候选编号，并在符合条件的 Chatham Islands 地区中选择陆地面积最大的记录。它表示“边界存在但当前没有租金观察”的数据情况。

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

`selection` 记录样本为何被选中；`recordCount` 则保持统一含义，表示该 SA2 在 MBIE 文件中的候选记录数。

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

Greensboro 和 Hokianga South 展示了同一关联规则下记录数从 579 到 1 的差异；Mackenzie Lakes 提供了面积明显更大的已关联边界；Chatham Islands 则只有 Stats NZ geometry，没有 MBIE 候选记录。四个样本都由明确条件从完整数据中选出，可以追溯到对应的官方 SA2 编号和边界记录。

### 8. 保存一组最小关联样本

第 7 节已经从完整 MBIE CSV 和 Stats NZ GeoPackage 中选出了代表样本。如果只想重复检查这些样本之间的关联，每次都读取两份完整源文件并不必要。当前关联实际使用的是少量 `Location Id`、SA2 编号和 geometry 状态，因此可以把这些值单独保存成一组小型固定样本。

在测试和数据处理中，这种为了重复检查而保存的固定样本通常称为 fixture，所以项目使用 `data/fixtures/` 目录存放它们。这里的 fixture 只是从真实源数据中提取的一小部分字段和值。

关联从 MBIE 的 `Location Id` 开始，所以先保存这些输入值，再判断另一侧还需要哪些 Stats NZ 信息。

#### 8.1 保存最小输入

关联过程读取 MBIE 的 `Location Id`，再到 Stats NZ 数据中寻找相同的 SA2 编号并检查 geometry。租金、住宅类型和地区面积不会改变这次关联，因此这组输入只保留三个必要信息。

先建立存放固定样本的目录：

```bash
mkdir -p data/fixtures/data-join
```

创建 `data/fixtures/data-join/mbie-records.csv`，写入五个已经在完整 MBIE 文件中确认过的 `Location Id`：

```csv
Location Id
179900
102100
341500
-99
NULL
```

前三个编号分别来自第 7 节选出的高频、稀疏和大面积已关联地区。`-99` 与 `NULL` 则保留第 4.3 节发现的两种非六位值，使最小输入同时包含可以参与关联和不能作为 SA2 候选编号的情况。

`mbie-records.csv` 只提供需要查找的值，还不能判断三个六位编号是否存在，也不能判断对应边界是否可用。关联的另一侧因此需要保留 Stats NZ 的 SA2 编号和 geometry 状态。创建 `data/fixtures/data-join/sa2-areas.json`：

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

前三条 Stats NZ 记录与 CSV 中的六位编号对应。`343000` 是第 7 节选出的 Chatham Islands，只存在于当前 Stats NZ 样本中，没有对应的 MBIE 样本记录。

这里使用源字段名 `SA22019_V1_00` 保存 SA2 编号，使固定样本与 GeoPackage 的关联字段保持一致。geometry 本身是较大的二进制内容；当前关联只需要判断它是否存在，因此保存第 7 节已经查询出的 `hasGeometry` 状态。

#### 8.2 为五条输入写出正确结果

8.1 已经保存了关联两侧的输入，但这些数据本身还没有说明什么结果才是正确的。固定样本还需要一份“答案表”，逐条写明五个 `Location Id` 应当得到的关联状态。

这里按照第 5、6 节已经确认的关联方法逐条判断。Stats NZ 输入中可以查找的编号是：

```text
179900 → hasGeometry: true
102100 → hasGeometry: true
341500 → hasGeometry: true
343000 → hasGeometry: true
```

现在从第一条 MBIE 输入开始判断：

| MBIE `Location Id` | 判断过程 | 正确结果 |
| --- | --- | --- |
| `179900` | 是六位编号；Stats NZ 中存在；geometry 存在 | `joined` |
| `102100` | 是六位编号；Stats NZ 中存在；geometry 存在 | `joined` |
| `341500` | 是六位编号；Stats NZ 中存在；geometry 存在 | `joined` |
| `-99` | 不是六位编号，不进入 SA2 查找 | `nonCandidateLocation` |
| `NULL` | 不是六位编号，不进入 SA2 查找 | `nonCandidateLocation` |

Stats NZ 输入中的 `343000` 没有出现在 MBIE 输入里，因此它不是一条未关联的 MBIE 记录。它只表示当前固定样本中存在一个没有对应 MBIE 观察的 Stats NZ SA2，单独记为 `statsOnlySa2Ids`。

五条 MBIE 输入由此得到：

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

`records` 是五条 MBIE 输入的答案，顺序与 `mbie-records.csv` 保持一致。能够关联的记录保存相同的 `sa2Id`；没有进入 SA2 查找的 `-99` 和 `NULL` 使用 `null`，表示它们没有关联结果。

`statsOnlySa2Ids` 保存只出现在 Stats NZ 输入中的编号，`counts` 则把五条记录的状态重新汇总。输入文件与这份已知正确的结果放在一起，组成完整的固定样本。

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

现在这三份小文件已经固定了五条 MBIE 输入、四条 Stats NZ 输入以及对应的预期关联结果。它们保留真实源值，同时只包含复现当前关联情况需要的数据。

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

`createReadStream()` 和 `csv-parse` 读取 MBIE CSV，`readFile()` 读取两个 JSON。`assert` 会在计算完成后比较实际结果和正确答案。

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

CSV 读取完成后，再读取 Stats NZ 输入和 8.2 写出的答案：

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

接下来在同一个文件中加入 `associateRecord()`。函数每次接收一条 MBIE 输入，并按照固定顺序判断：

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

用这个函数依次处理五条 MBIE 输入：

```js
const records = mbieRecords.map(associateRecord);
```

Stats NZ 输入中还包含没有对应 MBIE 记录的 `343000`。先从 MBIE 输入中取得全部六位候选编号，再找出只存在于 `statsNzAreas` 的编号：

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

实际结果已经由关联规则计算完成。把逐条结果、Stats NZ 独有编号和汇总数量组合成与 `expected-associations.json` 相同的结构：

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

`passed` 表示脚本计算出的五条记录、Stats NZ 独有编号和汇总数量与固定答案全部一致；同一组输入再次运行时会经过相同判断并得到相同结果。

### 10. 汇总最终质量结论

第 9 节已经证明固定样本能够按照同一套规则得到已知答案，但它只检查了五条 MBIE 记录。全国关联脚本虽然已经输出编号和记录数量，这些数字目前仍然是分散的结果，还没有形成一个明确的通过或失败状态。

现在回到 `data/scripts/verify-data-join.mjs`，根据已经计算出的全国结果判断三件事：

```text
所有 MBIE 六位候选编号是否都找到 Stats NZ SA2
所有已匹配 SA2 是否都具有 geometry
所有 MBIE 输入记录是否都进入一个关联结果
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
2,009 个 MBIE 六位 Location Id
→ 2,009 个全部找到 Stats NZ SA2 2019
→ 2,009 个全部具有 geometry
```

对应的记录级结果是：

```text
226,080 条 MBIE 输入记录
→ 224,195 条六位编号记录完成关联
→ 1,885 条非六位编号记录单独计数
→ 0 条候选记录未找到 SA2
→ 0 条候选记录缺少 geometry
→ 226,080 条记录全部得到解释
```

Stats NZ 全表存在 16 条缺少 geometry 的记录，但它们都不属于当前 2,009 个 MBIE 匹配编号，因此不会改变已匹配地区的 geometry 结果。第 9 节的五条固定样本也得到 `passed`，实际关联结果与逐条写出的正确答案一致。

当前两份源文件由此得到：

```text
Location Id → SA2 2019 → geometry
状态：passed
```

这个结论只说明当前 MBIE 租金数据可以通过六位 `Location Id` 与当前 Stats NZ SA2 2019 数据完成地区关联。

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
⬜ 两份官方源文件已取得并完成完整性核对
⬜ MBIE 与 Stats NZ 的数据结构和关联键已经确认
⬜ MBIE 全国数据 profiling 已完成
⬜ 2,009 个 MBIE 六位 Location Id 全部关联到带有 geometry 的 SA2
⬜ 226,080 条 MBIE 输入记录全部得到解释
⬜ 代表样本和最小固定样本已经建立
⬜ 全国关联与固定样本验证均通过
⬜ 全国关联报告可以稳定重新生成
⬜ 数据脚本和文档已经完成
```
