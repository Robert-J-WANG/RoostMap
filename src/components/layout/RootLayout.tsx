import { Outlet, ScrollRestoration } from "react-router";

import { AppShell } from "@/components/layout/AppShell";

// ScrollRestoration：打开新页面时回到顶部；浏览器后退或前进时恢复离开时的滚动位置。
export function RootLayout() {
  return (
    <AppShell>
      <Outlet />
      <ScrollRestoration />
    </AppShell>
  );
}
