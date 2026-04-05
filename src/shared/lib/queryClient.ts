import { QueryClient, dehydrate, hydrate, type DehydratedState } from "@tanstack/react-query";

const QUERY_CACHE_STORAGE_KEY = "filmfe.query-cache.v1";
const QUERY_CACHE_TTL = 1000 * 60 * 30;
const QUERY_CACHE_SAVE_DELAY = 250;
const PERSISTED_QUERY_ROOTS = new Set([
  "catalog",
  "header",
  "home",
  "movie",
  "related-category",
  "related-country",
]);

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const shouldPersistQuery = (query: {
  queryKey: readonly unknown[];
  state: { status: string };
}) => {
  if (query.state.status !== "success") {
    return false;
  }

  const queryRoot = query.queryKey[0];
  return typeof queryRoot === "string" && PERSISTED_QUERY_ROOTS.has(queryRoot);
};

const readPersistedQueryState = () => {
  if (!canUseStorage()) {
    return undefined;
  }

  try {
    const rawState = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);
    if (!rawState) {
      return undefined;
    }

    const parsed = JSON.parse(rawState) as {
      state?: DehydratedState;
      timestamp?: number;
    };

    if (!parsed.state || typeof parsed.timestamp !== "number") {
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return undefined;
    }

    if (Date.now() - parsed.timestamp > QUERY_CACHE_TTL) {
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return undefined;
    }

    return parsed.state;
  } catch {
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
    return undefined;
  }
};

const writePersistedQueryState = (queryClient: QueryClient) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: shouldPersistQuery,
    });

    window.localStorage.setItem(
      QUERY_CACHE_STORAGE_KEY,
      JSON.stringify({
        state,
        timestamp: Date.now(),
      }),
    );
  } catch {
  }
};

export const createAppQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const persistedState = readPersistedQueryState();
  if (persistedState) {
    hydrate(queryClient, persistedState);
  }

  return queryClient;
};

export const persistAppQueryClient = (queryClient: QueryClient) => {
  if (!canUseStorage()) {
    return () => {
    };
  }

  let persistTimer: number | null = null;

  const flushPersistedState = () => {
    if (persistTimer !== null) {
      window.clearTimeout(persistTimer);
      persistTimer = null;
    }

    writePersistedQueryState(queryClient);
  };

  const schedulePersist = () => {
    if (persistTimer !== null) {
      window.clearTimeout(persistTimer);
    }

    persistTimer = window.setTimeout(() => {
      persistTimer = null;
      writePersistedQueryState(queryClient);
    }, QUERY_CACHE_SAVE_DELAY);
  };

  const unsubscribe = queryClient.getQueryCache().subscribe(schedulePersist);
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      flushPersistedState();
    }
  };

  window.addEventListener("beforeunload", flushPersistedState);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    unsubscribe();
    flushPersistedState();
    window.removeEventListener("beforeunload", flushPersistedState);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
};
