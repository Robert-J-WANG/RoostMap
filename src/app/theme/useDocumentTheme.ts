import { useSyncExternalStore } from "react";

import { getDocumentTheme } from "@/app/theme/theme";

// 主题记录在 <html> 的 class 上（"dark"）。用 MutationObserver 监听 class 变化，
// 切换主题时，使用这个 hook 的组件（例如地图）随之重新渲染。
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });

  return () => observer.disconnect();
}

export function useDocumentTheme() {
  return useSyncExternalStore(subscribe, getDocumentTheme);
}
