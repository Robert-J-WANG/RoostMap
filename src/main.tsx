import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/app/App";
import { initialiseTheme } from "@/app/theme/theme";
import "./styles/index.css";

initialiseTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
