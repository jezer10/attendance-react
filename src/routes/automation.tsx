import { redirect, type LoaderFunctionArgs } from "react-router";

import type { AutomationRule } from "../components/AutomationScheduler";
import { fetchAvailableTimezones, fetchAutomationRule } from "../services/api";
import {
  AuthorizationError,
  requireAuthTokens,
  type AuthTokens,
} from "../services/auth";

export interface AutomationLoaderData {
  tokens: AuthTokens;
  rule: AutomationRule;
  timezones: string[];
}

export const automationLoader = async ({
  request,
}: LoaderFunctionArgs): Promise<AutomationLoaderData> => {
  void request;

  const tokens = await requireAuthTokens();

  try {
    const [rule, timezones] = await Promise.all([
      fetchAutomationRule(),
      fetchAvailableTimezones(),
    ]);

    return {
      tokens,
      rule,
      timezones,
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw redirect("/login");
    }

    throw error;
  }
};
