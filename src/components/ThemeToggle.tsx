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
