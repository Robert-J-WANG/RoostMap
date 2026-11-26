import { expect, test } from "@playwright/test";

/* --------- 正式数据链路的浏览器测试场景 -------- */
// Greensboro（179900）的源记录已手工核对：ALL / ALL 租金 350，Bonds 171，12 个月变化 +1.3%。
// 这些测试确认同样的值经过 release 文件后显示在页面上。

/* --------- 测试 1：Explore 列表显示 release 中的租金 -------- */
test("shows the Greensboro rent from the published release in Explore", async ({ page }) => {
  await page.goto("/explore");

  const greensboro = page.getByRole("button", { name: /^Greensboro/ });
  await expect(greensboro).toContainText("NZ$350/week");
  await expect(greensboro).toContainText("171 bonds");
  await expect(greensboro).toContainText("+1.3%");
});

/* --------- 测试 2：直接打开区域详情的地址 -------- */
test("opens an area page directly from its address", async ({ page }) => {
  await page.goto("/areas/179900");

  await expect(page).toHaveTitle("Greensboro | RoostMap");
  const details = page.locator("dl");
  await expect(details).toContainText("NZ$350/week");
  await expect(details).toContainText("171 bonds");
  await expect(details).toContainText("+1.3%");
});

/* --------- 测试 3：按分类筛选后，列表、URL 和详情使用同一分类 -------- */
// Greensboro House / 3 的源记录已手工核对：租金 590，Bonds 12，12 个月变化 610 ÷ 534 − 1 = +14.2%。
test("shows the Greensboro House 3-bedroom rent after filtering", async ({ page }) => {
  await page.goto("/explore");

  // 每次选择后检查 URL，确认两次选择都保存下来。
  await page.getByLabel("Dwelling type").selectOption("House");
  await expect(page).toHaveURL(/\/explore\?dwelling=House$/);
  await page.getByLabel("Bedrooms").selectOption("3");
  await expect(page).toHaveURL(/\/explore\?dwelling=House&bedrooms=3$/);

  const greensboro = page.getByRole("button", { name: /^Greensboro/ });
  await expect(greensboro).toContainText("NZ$590/week");
  await expect(greensboro).toContainText("12 bonds");
  await expect(greensboro).toContainText("+14.2%");

  await greensboro.click();
  await page.getByRole("link", { name: "View details" }).click();
  await expect(page).toHaveURL(/\/areas\/179900\?dwelling=House&bedrooms=3$/);
  await expect(page.locator("dl")).toContainText("NZ$590/week");
});

/* --------- 测试 4：切换 Region 后读取这个 Region 的文件 -------- */
test("switches to Wellington Region", async ({ page }) => {
  await page.goto("/explore");

  await page.getByLabel("Region").selectOption("09");
  await expect(page).toHaveURL(/\/explore\?region=09$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wellington Region rental areas");
  await expect(page.getByRole("button", { name: /^Thorndon/ })).toContainText("NZ$590/week");
});

/* --------- 测试 5：区域详情显示真实的租金历史 -------- */
// Greensboro ALL / ALL 在 2020-01-01 到 2026-04-01 的 26 个季度都有租金，图表画出一条完整的折线。
test("shows the Greensboro rent history on its area page", async ({ page }) => {
  await page.goto("/areas/179900");

  await expect(page.getByRole("heading", { level: 2, name: "Rent history" })).toBeVisible();
  await expect(page.locator(".recharts-line-dot")).toHaveCount(26);
  await expect(page.locator(".recharts-line-curve")).toBeVisible();
});

/* --------- 测试 6：MVP 的核心流程 -------- */
// 从首页进入 Explore，切换 Region 和分类，选中区域，查看详情和租金历史，再返回 Explore。
// Thorndon（250900）House / 3 的源记录已手工核对：2026-04-01 租金 743，Bonds 6，
// 12 个月变化 722 ÷ 796 − 1 ≈ −9.3%；源文件有 25 个季度的记录，缺少 2021-07-01。
test("follows the core journey from Home to an area's rent history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore rental areas" }).click();

  // 每次选择后检查 URL，确认 Region 和两个分类依次保存下来。
  await page.getByLabel("Region").selectOption("09");
  await expect(page).toHaveURL(/\?region=09$/);
  await page.getByLabel("Dwelling type").selectOption("House");
  await expect(page).toHaveURL(/\?region=09&dwelling=House$/);
  await page.getByLabel("Bedrooms").selectOption("3");

  const thorndon = page.getByRole("button", { name: /^Thorndon/ });
  await expect(thorndon).toContainText("NZ$743/week");
  await thorndon.click();
  await page.getByRole("link", { name: "View details" }).click();

  await expect(page).toHaveURL(/\/areas\/250900\?region=09&dwelling=House&bedrooms=3$/);
  const details = page.locator("dl");
  await expect(details).toContainText("NZ$743/week");
  await expect(details).toContainText("6 bonds");
  await expect(details).toContainText("-9.3%");

  // 25 个季度有租金；缺少的 2021-07-01 把折线分成两段。
  await expect(page.locator(".recharts-line-dot")).toHaveCount(25);
  const path = await page.locator(".recharts-line-curve").getAttribute("d");
  expect(path?.split("M")).toHaveLength(3);

  await page.getByRole("link", { name: "Back to Explore" }).click();
  await expect(page).toHaveURL(/\/explore\?region=09&dwelling=House&bedrooms=3&sa2=250900$/);
  await expect(page.getByRole("heading", { level: 2, name: "Thorndon" })).toBeVisible();
});

/* --------- 测试 7：部署环境中不存在的数据文件返回 404 -------- */
// 这条规则由 staticwebapp.config.json 在 Azure 上生效；本地 Vite 会对不存在的文件返回 index.html，
// 因此只在测试部署地址（设置了 PLAYWRIGHT_BASE_URL）时运行。
test("returns 404 for a data file that does not exist", async ({ request }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Only the deployed site applies staticwebapp.config.json");

  const response = await request.get("/data/releases/missing.json");
  expect(response.status()).toBe(404);
});
