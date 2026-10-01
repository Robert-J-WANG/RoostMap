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
