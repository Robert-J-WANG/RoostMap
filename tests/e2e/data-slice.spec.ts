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

  await page.getByLabel("Dwelling type").selectOption("House");
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

/* --------- 测试 5：部署环境中不存在的数据文件返回 404 -------- */
// 这条规则由 staticwebapp.config.json 在 Azure 上生效；本地 Vite 会对不存在的文件返回 index.html，
// 因此只在测试部署地址（设置了 PLAYWRIGHT_BASE_URL）时运行。
test("returns 404 for a data file that does not exist", async ({ request }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, "Only the deployed site applies staticwebapp.config.json");

  const response = await request.get("/data/releases/missing.json");
  expect(response.status()).toBe(404);
});
