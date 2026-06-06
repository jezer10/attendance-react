import { type LoaderFunctionArgs } from "react-router";
import { requireAuthTokens } from "../features/auth/services/authService";

export const automationLoader = async ({
  request,
}: LoaderFunctionArgs): Promise<void> => {
  void request;
  await requireAuthTokens();
};
