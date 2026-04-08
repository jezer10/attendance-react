import { createBrowserRouter } from "react-router";

import App from "./App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Component } = await import("./pages/AutomationPage");
          const { automationLoader: loader } = await import("./routes/automation");
          return { Component, loader };
        },
      },
      {
        path: "login",
        lazy: async () => {
          const { default: Component } = await import("./pages/LoginPage");
          return { Component };
        },
      },
    ],
  },
]);

export default router;
