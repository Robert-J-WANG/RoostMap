import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  getInitialTheme,
  initialiseTheme,
  THEME_STORAGE_KEY,
} from "@/app/theme/theme";

/* --------- 主题工具测试场景 -------- */
describe("theme utilities", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  /* --------- 测试 1：优先恢复用户保存的主题 -------- */
  it("restores a saved preference before consulting the system theme", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const matchMedia = vi.fn();
    vi.stubGlobal("matchMedia", matchMedia);

    expect(getInitialTheme()).toBe("dark");
    expect(matchMedia).not.toHaveBeenCalled();
  });

  /* --------- 测试 2：首次访问跟随系统主题 -------- */
  it("uses the system preference when no choice has been saved", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );

    expect(getInitialTheme()).toBe("dark");
  });

  /* --------- 测试 3：把主题应用到文档根元素 -------- */
  it("applies the initial theme to the document", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    expect(initialiseTheme()).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");

    applyTheme("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});
