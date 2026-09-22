const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;

export const API_BASE_URL = (env?.VITE_API_BASE_URL?.trim() || '/api').replace(/\/+$/, '');