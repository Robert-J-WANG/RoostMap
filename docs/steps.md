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

现在需要把 shadcn/ui 默认的中性色调整为 RoostMap 的蓝绿色视觉方向，同时建立统一的页面宽度和边距。在生成的 `:root` 中调整对应变量，并加入布局变量：

```css
:root {
  --background: #f8fafc;
  --foreground: #17222a;

  --card: #ffffff;
  --card-foreground: #17222a;

  --popover: #ffffff;
  --popover-foreground: #17222a;

  --primary: #0f766e;
  --primary-foreground: #ffffff;

  --secondary: #e6f4f1;
  --secondary-foreground: #134e4a;

  --muted: #edf2f4;
  --muted-foreground: #52606d;

  --accent: #ccfbf1;
  --accent-foreground: #134e4a;

  --border: #d8e2e5;
  --input: #cbd8dc;
  --ring: #0f766e;

  --radius: 0.75rem;

  --content-max-width: 72rem;
  --page-gutter: clamp(1rem, 4vw, 2rem);
  --section-space: clamp(3rem, 8vw, 6rem);
  --surface-shadow: 0 18px 45px rgb(15 118 110 / 0.08);
}
```

保留 shadcn/ui 生成的其他变量和 `@theme inline` 映射。以后组件使用 `bg-primary`、`text-muted-foreground` 和 `border-border` 等语义名称，不直接重复具体颜色。

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

### 8. 更新测试

路由建立后，需要分别更新路由组件测试和端到端测试。两类测试关注不同层次：

```text
路由组件测试
→ 在 jsdom 中验证路由匹配、共享布局和错误边界

端到端测试
→ 在真实浏览器中验证页面加载、用户导航和 URL 变化
```

#### 8.1 路由组件测试

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

#### 8.2 端到端测试

组件测试可以快速验证路由结构，但不会启动真实浏览器。Playwright 从用户使用应用的角度检查完整页面，因此继续验证首页加载、导航链接和未知 URL。

浏览器测试不再只针对首页，删除旧的只针对首页的测试文件：

```bash
rm tests/e2e/home.spec.ts
```

新建浏览器测试 `tests/e2e/app-shell.spec.ts`。

新的 E2E 测试覆盖三个真实页面行为：打开首页、通过导航进入 Methodology，以及直接访问未知 URL。根据这些行为，写入：

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

```

这些测试只验证页面行为，不检查 Tailwind class、像素位置或具体颜色，避免正常调整视觉样式时产生无意义的测试失败。

完成后单独运行端到端测试：

```bash
npm run test:e2e
```

预期 Playwright 启动 Chromium，三个浏览器测试全部通过，并在结束后自动停止开发服务器。

### 9. 验证应用外壳

现在 UI、路由、错误处理和测试已经形成完整链路，可以执行统一质量检查：

```bash
npm run check
```

预期依次通过：

```text
ESLint
Vitest route tests
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

使用浏览器开发工具检查 390px、768px 和桌面宽度，确认 Header、内容区域和 Footer 没有重叠、截断或水平滚动。

### 10. 更新 README 项目状态

验证全部通过后，README 应直接记录 Step 04 已经实现的结果。将 `Current status` 更新为：

```markdown
## Current status

The React application foundation, automated test foundation and responsive product shell are in place.

The application currently includes client-side routing for Home and Methodology, shared Header, Main and Footer structure, unknown-route and route-error handling, Tailwind CSS design tokens, and project-owned shadcn/ui components. The complete local quality check covers linting, component tests, the production build and Playwright browser tests.
```

README 的其他内容继续保留。

### 11. Git 提交

代码、测试、浏览器检查和 README 状态一致后，提交本步成果：

```bash
git add .
git commit -m "feat: establish application shell"
git push -u origin feat/app-shell
```

Pull Request 记录：

- Tailwind CSS 和 shadcn/ui 已配置；
- 设计 token 和响应式应用外壳已建立；
- Home、Methodology、404 和页面错误边界已建立；
- 路由组件测试和浏览器测试已加入；
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
⬜ AppShell 和 RootLayout 已建立
⬜ Home、Methodology 和 Not Found 页面已建立
⬜ React Router 和页面标题已经配置
⬜ 404 与页面错误边界已经建立
⬜ 桌面与移动端布局可用
⬜ 路由组件测试和 Playwright 测试已更新
⬜ npm run check 通过
⬜ README 已记录 Step 04 完成后的状态
⬜ 应用外壳已通过 Pull Request 合并到 main
```
