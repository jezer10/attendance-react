import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchAutomationRule,
  fetchAvailableTimezones,
  saveAutomationRule,
  markAutomationNow,
  fetchAttendanceCredentials,
  saveAttendanceCredentials,
} from "../services/automationService";
import { queryClient } from "../../../lib/queryClient";
import type { PersistedAutomationPayload } from "../components/types";
import type { AttendanceCredentialsPayload } from "../services/automationService";

const automationKeys = {
  all: ["automation"] as const,
  rule: () => [...automationKeys.all, "rule"] as const,
  timezones: () => [...automationKeys.all, "timezones"] as const,
  credentials: () => [...automationKeys.all, "credentials"] as const,
};

export const useAutomationRule = () => {
  return useQuery({
    queryKey: automationKeys.rule(),
    queryFn: fetchAutomationRule,
  });
};

export const useAvailableTimezones = () => {
  return useQuery({
    queryKey: automationKeys.timezones(),
    queryFn: fetchAvailableTimezones,
    staleTime: Infinity, // Timezones don't change often
  });
};

export const useSaveAutomation = () => {
  return useMutation({
    mutationFn: (payload: PersistedAutomationPayload) => saveAutomationRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.rule() });
    },
  });
};

export const useManualActionToken = () => {
  return useMutation({
    mutationFn: (action: "entrada" | "salida") => markAutomationNow(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.rule() });
    },
  });
};

export const useAttendanceCredentials = () => {
  return useQuery({
    queryKey: automationKeys.credentials(),
    queryFn: fetchAttendanceCredentials,
  });
};

export const useSaveAttendanceCredentials = () => {
  return useMutation({
    mutationFn: (payload: AttendanceCredentialsPayload) => saveAttendanceCredentials(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.credentials() });
    },
  });
};
