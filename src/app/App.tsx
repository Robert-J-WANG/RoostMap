import { RouterProvider } from "react-router/dom";

import { QueryProvider } from "@/app/providers/QueryProvider";
import { router } from "@/app/router/router";

function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export default App;
