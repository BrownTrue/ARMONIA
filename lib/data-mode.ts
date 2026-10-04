export const isLocalDataMode = () => process.env.NEXT_PUBLIC_DATA_MODE === "local"
  || !process.env.NEXT_PUBLIC_SUPABASE_URL
  || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isCloudDataModeConfigured = () => !isLocalDataMode();
