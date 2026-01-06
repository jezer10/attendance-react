import { useLoaderData } from "react-router";

import AutomationScheduler from "../components/AutomationScheduler";
import type { AutomationLoaderData } from "../routes/automation";
import {
  markAutomationNow,
  saveAttendanceCredentials,
  saveAutomationRule,
} from "../services/api";
import type { PersistedAutomationPayload } from "../components/automation/types";

const AutomationPage = () => {
  const { rule, timezones, credentials } =
    useLoaderData() as AutomationLoaderData;

  const handleSave = async (payload: PersistedAutomationPayload) => {
    await saveAutomationRule(payload);
  };

  const handleImmediateMark = async (action: "entrada" | "salida") => {
    await markAutomationNow(action);
  };

  const handleSaveCredentials = async (payload: {
    companyId: number;
    userId: number;
    password: string;
  }) => {
    await saveAttendanceCredentials(payload);
  };

  return (
    <AutomationScheduler
      initialRule={rule}
      availableTimezones={timezones}
      onSave={handleSave}
      onImmediateMark={handleImmediateMark}
      onSaveCredentials={handleSaveCredentials}
      initialCredentials={credentials}
    />
  );
};

export default AutomationPage;
