import { type LoaderFunctionArgs } from "react-router";
import { requireAuthTokens } from "../features/auth";

export const automationLoader = async ({
  request,
}: LoaderFunctionArgs): Promise<void> => {
  void request;
  await requireAuthTokens();
};
