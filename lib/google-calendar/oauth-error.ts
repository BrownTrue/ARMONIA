const SAFE_OAUTH_CODE = /^[a-z][a-z0-9_]{0,63}$/i;

export class GoogleOAuthError extends Error {
  readonly oauthCode?: string;
  readonly status: number;

  constructor(prefix: string, status: number, oauthCode?: string) {
    super(`${prefix}: ${oauthCode || `HTTP ${status}`}`);
    this.name = "GoogleOAuthError";
    this.status = status;
    this.oauthCode = oauthCode;
  }
}

export async function googleOAuthResponseError(response: Response, prefix: string) {
  let oauthCode: string | undefined;
  try {
    const text = await response.text();
    const value = JSON.parse(text) as { error?: unknown; error_description?: unknown };
    if (typeof value.error === "string" && SAFE_OAUTH_CODE.test(value.error)) {
      oauthCode = value.error;
    }
  } catch {
    // The response body can be HTML or plain text. Never expose it because it
    // may contain implementation details; the HTTP status remains sufficient.
  }
  return new GoogleOAuthError(prefix, response.status, oauthCode);
}

export function isGoogleOAuthError(cause: unknown): cause is GoogleOAuthError {
  return cause instanceof GoogleOAuthError;
}
