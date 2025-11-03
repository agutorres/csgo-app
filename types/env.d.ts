declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_MUX_TOKEN_ID: string;
      EXPO_PUBLIC_MUX_TOKEN_SECRET: string;
      EXPO_PUBLIC_MUX_ENVIRONMENT_ID: string;
    }
  }
}

export {};
