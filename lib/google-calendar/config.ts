export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.app.created";
export const GOOGLE_CALENDAR_NAME = "Armonia";
export const GOOGLE_CALENDAR_TIME_ZONE = "Europe/Rome";

export function googleCalendarConfigured() {
  const oauth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI &&
      process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
  );
  return process.env.NEXT_PUBLIC_DATA_MODE === "local"
    ? oauth
    : oauth && Boolean((process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function googleOAuthConfig() {
  if (!googleCalendarConfigured()) {
    throw new Error("Google Calendar non è ancora configurato in .env.local");
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  };
}
