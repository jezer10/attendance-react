import { useLoaderData } from "react-router";

import AutomationScheduler from "../components/AutomationScheduler";
import type { AutomationLoaderData } from "../routes/automation";
import { markAutomationNow, saveAutomationRule } from "../services/api";
import type { PersistedAutomationPayload } from "../components/automation/types";

const AutomationPage = () => {
  const { rule, timezones } = useLoaderData() as AutomationLoaderData;

  const handleSave = async (payload: PersistedAutomationPayload) => {
    await saveAutomationRule(payload);
  };

  const handleImmediateMark = async (action: "entrada" | "salida") => {
    await markAutomationNow(action);
  };

  return (
    <AutomationScheduler
      initialRule={rule}
      availableTimezones={timezones}
      onSave={handleSave}
      onImmediateMark={handleImmediateMark}
    />
  );
};

export default AutomationPage;
