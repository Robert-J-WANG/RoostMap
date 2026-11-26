import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

import { ContourBackdrop } from "@/components/ContourBackdrop";
import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Home", to: "/" },
  { label: "Explore", to: "/explore" },
  { label: "Methodology", to: "/methodology" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  // isolate 让页面根元素成为独立的层叠上下文，各页面负 z-index 的装饰背景都画在内容下方；
  // overflow-x-clip：首页铺满整个宽度的背景图不会让页面出现横向滚动。
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-x-clip bg-transparent text-foreground">
      {/* 每个页面顶部共用的装饰背景：一条很淡的等高线带，向下渐隐，不影响内容阅读。 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] overflow-hidden text-primary opacity-[0.09] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      >
        <ContourBackdrop className="h-full w-full" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[var(--content-max-width)] flex-col gap-3 px-[var(--page-gutter)] py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link aria-label="RoostMap home" to="/">
            <BrandMark />
          </Link>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
            <nav aria-label="Primary navigation">
              <ul className="flex flex-wrap items-center gap-2">
                {navigationItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          "inline-flex rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                          isActive && "bg-accent text-accent-foreground",
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 页面内容的上边距保持适中，地图和列表不被推到第一屏以外；
          下边距较大，让页脚与页面内容明显分开。 */}
      <main className="mx-auto w-full max-w-[var(--content-max-width)] flex-1 px-[var(--page-gutter)] pt-8 pb-20 sm:pt-10 sm:pb-24">
        {children}
      </main>

      {/* 页脚：一行品牌说明和数据来源。背景与页面不同，和页面内容区分开；
          CC BY 许可要求注明来源，统一放在每页的页脚，下载日期、校验值和计算规则在 Methodology 中。 */}
      <footer className="border-t bg-muted">
        <div className="mx-auto w-full max-w-[var(--content-max-width)] space-y-2 px-[var(--page-gutter)] py-6 text-xs leading-5 text-muted-foreground">
          <p className="text-sm font-medium text-foreground">
            RoostMap · New Zealand rental-area evidence from official data
          </p>
          <p className="max-w-3xl">
            Data: MBIE Rental Bond Data (CC BY 3.0 NZ) · Stats NZ Statistical
            Area 2 Higher Geographies 2019 (CC BY 4.0 International). Basemap ©
            MapTiler © OpenStreetMap contributors. Home photo: Sebastian
            Schuster on Unsplash. Figures describe new bonds lodged with MBIE,
            not live listings.
          </p>
        </div>
      </footer>
    </div>
  );
}
