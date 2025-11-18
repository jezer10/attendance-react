import { createBrowserRouter } from "react-router";

import App from "./App";
import AutomationPage from "./pages/AutomationPage";
import LoginPage from "./pages/LoginPage";
import { automationLoader } from "./routes/automation";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        loader: automationLoader,
        element: <AutomationPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
]);

export default router;
