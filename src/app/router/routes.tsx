import type { RouteObject } from "react-router";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { MethodologyPage } from "@/pages/MethodologyPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { MapChartPage } from "@/pages/MapChartPage";
import { ExplorePage } from "@/pages/ExplorePage";

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
            path: "explore",
            Component: ExplorePage,
          },
          {
            path: "methodology",
            Component: MethodologyPage,
          },
          {
            path: "spike/map-chart",
            Component: MapChartPage,
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
