import {
  useAutomationRule,
  useAvailableTimezones,
  useSaveAutomation,
  useManualActionToken,
  useSaveAttendanceCredentials,
  useAttendanceCredentials,
} from "../features/automation";
import AutomationScheduler from "../features/automation/components/AutomationScheduler";

const EMPTY_ARRAY: string[] = [];

const AutomationPage = () => {
  const { data: rule, isLoading: isLoadingRule } = useAutomationRule();
  const { data: timezones, isLoading: isLoadingTimezones } = useAvailableTimezones();
  const { data: credentials, isLoading: isLoadingCredentials } = useAttendanceCredentials();

  const { mutateAsync: saveRule } = useSaveAutomation();
  const { mutateAsync: markNow } = useManualActionToken();
  const { mutateAsync: saveCredentials } = useSaveAttendanceCredentials();

  if (isLoadingRule || isLoadingTimezones || isLoadingCredentials) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AutomationScheduler
      initialRule={rule!}
      availableTimezones={timezones || EMPTY_ARRAY}
      onSave={saveRule}
      onImmediateMark={markNow}
      onSaveCredentials={saveCredentials}
      initialCredentials={credentials}
    />
  );
};

export default AutomationPage;
