import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { authenticate, logout } from "../services/authService";
import { queryClient } from "../../../lib/queryClient";

export const useAuth = () => {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authenticate(email, password),
    onSuccess: () => {
      // Invalida cualquier query que dependa de auth si existiera
      queryClient.clear();
      navigate("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
