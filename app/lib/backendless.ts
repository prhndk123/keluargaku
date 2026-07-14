import Backendless from "backendless";

let initialized = false;

export function initBackendless() {
  if (initialized) return Backendless;
  const appId = import.meta.env.VITE_BACKENDLESS_APP_ID as string | undefined;
  const apiKey = import.meta.env.VITE_BACKENDLESS_API_KEY as string | undefined;
  if (!appId || !apiKey) {
    console.warn(
      "[Backendless] VITE_BACKENDLESS_APP_ID / VITE_BACKENDLESS_API_KEY belum diisi di .env",
    );
    return Backendless;
  }
  Backendless.initApp(appId, apiKey);
  initialized = true;
  return Backendless;
}

export function isBackendlessConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_BACKENDLESS_APP_ID && import.meta.env.VITE_BACKENDLESS_API_KEY,
  );
}

export { Backendless };
