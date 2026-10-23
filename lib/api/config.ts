export interface ApiRuntimeConfig {
  readonly apiUrl: string;
  readonly isSameOrigin: boolean;
  readonly demoMode: boolean;
  readonly devFallbackEnabled: boolean;
  readonly environment: string;
}

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function readEnv(name: string) {
  return typeof process !== "undefined" ? process.env[name] : undefined;
}

/** Reads public runtime flags without touching window, so adapters remain SSR-safe. */
export function getApiRuntimeConfig(): ApiRuntimeConfig {
  const configuredUrl = readEnv("NEXT_PUBLIC_API_URL")?.trim();
  const isSameOrigin = !configuredUrl;
  const apiUrl = trimTrailingSlashes(configuredUrl ?? "/api") || "/api";
  const demoMode = readEnv("NEXT_PUBLIC_DEMO_MODE")?.toLowerCase() === "true";
  const environment = readEnv("NODE_ENV") ?? "production";

  return {
    apiUrl,
    isSameOrigin,
    demoMode,
    devFallbackEnabled: environment === "development",
    environment,
  };
}

export function isDemoModeEnabled() {
  return getApiRuntimeConfig().demoMode;
}

export function isDevelopmentFallbackEnabled() {
  const config = getApiRuntimeConfig();
  return config.devFallbackEnabled && !config.demoMode;
}
