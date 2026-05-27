import { Suspense } from "react";
import { Outlet } from "react-router";
import AutomationSkeleton from "./features/automation/components/AutomationSkeleton";

const App = () => (
  <main>
    <Suspense fallback={<AutomationSkeleton />}>
      <Outlet />
    </Suspense>
  </main>
);

export default App;
