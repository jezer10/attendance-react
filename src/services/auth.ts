import { redirect } from "react-router";

const STORAGE_KEY = "automation-auth";
const API_BASE = import.meta.env.VITE_API_URL || "";

const encodeBasic = (email: string, password: string) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(`${email}:${password}`);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

export interface AuthTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt?: number;
}

const normalizeTokenType = (tokenType?: string) => {
  if (!tokenType) return "Bearer";
  if (tokenType.toLowerCase() === "bearer") return "Bearer";
  return tokenType;
};

const persistTokens = (tokens: AuthTokens) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  localStorage.setItem("authToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
};

export const getStoredTokens = (): AuthTokens | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    clearTokens();
    return null;
  }
};

const decodeJwt = (token: string) => {
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
};

const calculateExpiry = (accessToken: string) => {
  const parsed = decodeJwt(accessToken);
  if (!parsed?.exp) return undefined;
  return parsed.exp * 1000;
};

const tokenIsExpired = (tokens: AuthTokens | null) => {
  if (!tokens?.expiresAt) return false;
  return Date.now() >= tokens.expiresAt - 15_000;
};

const parseTokens = (payload: any): AuthTokens => ({
  userId: payload.user_id,
  accessToken: payload.access_token,
  refreshToken: payload.refresh_token,
  tokenType: normalizeTokenType(payload.token_type),
  expiresAt: calculateExpiry(payload.access_token),
});

export const authenticate = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodeBasic(email, password)}`,
    },
  });

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 400
        ? "Credenciales inválidas. Verifica tu correo y contraseña."
        : "No se pudo iniciar sesión. Inténtalo más tarde.";
    throw new Error(message);
  }

  const data = await response.json();
  const tokens = parseTokens(data);
  persistTokens(tokens);
  return tokens;
};

export const refreshSession = async (
  refreshToken?: string
): Promise<AuthTokens | null> => {
  const current = getStoredTokens();
  const token = refreshToken ?? current?.refreshToken;

  if (!token) return null;

  const response = await fetch(
    `${API_BASE}/api/v1/auth/refresh?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = await response.json();
  const tokens = parseTokens(data);
  persistTokens(tokens);
  return tokens;
};

export const ensureAuthTokens = async (): Promise<AuthTokens> => {
  let tokens = getStoredTokens();

  if (!tokens) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      clearTokens();
      throw new AuthorizationError();
    }
    return refreshed;
  }

  if (!tokenIsExpired(tokens)) {
    return tokens;
  }

  const refreshed = await refreshSession(tokens.refreshToken);
  if (!refreshed) {
    clearTokens();
    throw new AuthorizationError();
  }

  return refreshed;
};

export class AuthorizationError extends Error {
  constructor(message = "No autorizado") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export const requireAuthTokens = async (): Promise<AuthTokens> => {
  try {
    return await ensureAuthTokens();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw redirect("/login");
    }
    throw error;
  }
};

export const authorizedFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  let tokens = getStoredTokens();
  if (!tokens) {
    tokens = await ensureAuthTokens();
  }

  const headers = new Headers(init.headers);
  headers.set(
    "Authorization",
    `${tokens.tokenType ?? "Bearer"} ${tokens.accessToken}`
  );

  const response = await fetch(input, { ...init, headers });

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshSession(tokens?.refreshToken);
  if (!refreshed) {
    clearTokens();
    throw new AuthorizationError();
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set(
    "Authorization",
    `${refreshed.tokenType ?? "Bearer"} ${refreshed.accessToken}`
  );

  return fetch(input, { ...init, headers: retryHeaders });
};

export const logout = async () => {
  try {
    if (API_BASE) {
      await authorizedFetch(`${API_BASE}/api/v1/auth/logout`, {
        method: "POST",
      });
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Fallo al cerrar sesión:", error);
    }
  } finally {
    clearTokens();
  }
};
