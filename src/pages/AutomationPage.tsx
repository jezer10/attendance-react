import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Transition } from "@headlessui/react";
import {
  useAutomationRule,
  useAvailableTimezones,
  useSaveAutomation,
  useManualActionToken,
  useSaveAttendanceCredentials,
  useAttendanceCredentials,
} from "../features/automation/hooks/useAutomation";
import { AuthorizationError } from "../features/auth/services/authService";
import AutomationScheduler from "../features/automation/components/AutomationScheduler";
import AutomationSkeleton from "../features/automation/components/AutomationSkeleton";

const EMPTY_ARRAY: string[] = [];

const AutomationPage = () => {
  const navigate = useNavigate();
  const { 
    data: rule, 
    isLoading: isLoadingRule, 
    error: errorRule 
  } = useAutomationRule();
  const { 
    data: timezones, 
    isLoading: isLoadingTimezones, 
    error: errorTimezones 
  } = useAvailableTimezones();
  const { 
    data: credentials, 
    isLoading: isLoadingCredentials, 
    error: errorCredentials 
  } = useAttendanceCredentials();

  const { mutateAsync: saveRule } = useSaveAutomation();
  const { mutateAsync: markNow } = useManualActionToken();
  const { mutateAsync: saveCredentials } = useSaveAttendanceCredentials();

  useEffect(() => {
    const hasAuthError = 
      errorRule instanceof AuthorizationError || 
      errorTimezones instanceof AuthorizationError || 
      errorCredentials instanceof AuthorizationError;

    if (hasAuthError) {
      navigate("/login");
    }
  }, [errorRule, errorTimezones, errorCredentials, navigate]);

  const isInitialLoading = isLoadingRule || isLoadingTimezones || isLoadingCredentials;
  const hasData = !!rule && !!timezones; // Credentials might be null if not set yet, that's okay

  return (
    <div className="relative min-h-screen">
      {/* Main Content: Scheduler if data exists, Skeleton otherwise */}
      {hasData ? (
        <AutomationScheduler
          initialRule={rule!}
          availableTimezones={timezones || EMPTY_ARRAY}
          onSave={saveRule}
          onImmediateMark={markNow}
          onSaveCredentials={saveCredentials}
          initialCredentials={credentials}
        />
      ) : (
        <AutomationSkeleton />
      )}

      {/* Loader Overlay: Transitions out when no longer loading */}
      <Transition show={isInitialLoading}>
        <div className="fixed inset-0 z-[100] transition duration-700 ease-in-out data-[closed]:opacity-0 data-[closed]:scale-95 flex items-center justify-center bg-white/20 backdrop-blur-md pointer-events-none">
          <div className="flex flex-col items-center gap-8 pointer-events-auto">
            <div className="premium-loader"></div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-display font-medium uppercase tracking-[0.3em] text-black/40 text-center">
                Sincronizando
              </span>
              <span className="text-xl font-display font-medium tracking-tight text-black mt-1 text-center">
                Preparando tu Dashboard
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default AutomationPage;
