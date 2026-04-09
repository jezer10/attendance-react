import { createBrowserRouter } from "react-router";

import App from "./App";
import ErrorPage from "./components/ErrorPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
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
