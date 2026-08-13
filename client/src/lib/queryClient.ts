import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * API_BASE uses __PORT_5000__ token which deploy_website replaces
 * with the proxy path to the backend at deploy time.
 * In local dev (token starts with "__"), uses empty string (same-origin).
 */
const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: onUnauthorized }) =>
  async ({ queryKey }) => {
    const res = await apiRequest("GET", queryKey[0] as string);
    if (onUnauthorized === "returnNull" && res.status === 401) {
      return null;
    }
    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});
