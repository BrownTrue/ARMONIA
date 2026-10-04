export const DEFAULT_AUTHENTICATED_PATH = "/oggi";

const PUBLIC_PATHS = new Set(["/about", "/privacy", "/login", "/signup", "/check-email", "/forgot-password", "/reset-password", "/auth/error"]);
const PRIVATE_ROOTS = [
  "/oggi",
  "/calendario",
  "/pazienti",
  "/sedute",
  "/materiali",
  "/economia",
  "/statistiche",
  "/impostazioni",
  "/risorse",
  "/onboarding",
] as const;

export type ServerAuthState = "authenticated" | "unauthenticated" | "error";
export type AuthRoutingDecision = { type: "pass" } | { type: "redirect"; destination: string };

export const isPublicPage = (pathname: string) => PUBLIC_PATHS.has(pathname);
export const isPublicCapabilityRoute = (pathname: string) => pathname.startsWith("/calendar/");
export const isApiRoute = (pathname: string) => pathname === "/api" || pathname.startsWith("/api/");
export const isAuthCallbackRoute = (pathname: string) => pathname === "/auth/callback" || pathname === "/auth/recovery";

const isAccountEntryPage = (pathname: string) => pathname === "/login"
  || pathname === "/signup"
  || pathname === "/check-email"
  || pathname === "/forgot-password"
  || pathname === "/auth/error";

const isAllowedPrivatePath = (pathname: string) => PRIVATE_ROOTS.some(
  (root) => pathname === root || pathname.startsWith(`${root}/`),
);

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  if (/%(?![0-9a-f]{2})/i.test(value) || /[\u0000-\u001f\u007f]/.test(value)) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  try {
    const parsed = new URL(value, "https://armonia.invalid");
    if (parsed.origin !== "https://armonia.invalid" || !isAllowedPrivatePath(parsed.pathname)) {
      return DEFAULT_AUTHENTICATED_PATH;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }
}

export function loginPathFor(destination: string) {
  const safeDestination = safeNextPath(destination);
  return `/login?next=${encodeURIComponent(safeDestination)}`;
}

export function authRoutingDecision(input: {
  pathname: string;
  destination: string;
  localMode: boolean;
  authState: ServerAuthState;
  requestedNext?: string | null;
}): AuthRoutingDecision {
  const { pathname, destination, localMode, authState, requestedNext } = input;
  if (isApiRoute(pathname) || isPublicCapabilityRoute(pathname)) return { type: "pass" };

  if (localMode) {
    if (pathname === "/" || pathname === "/reset-password" || pathname === "/onboarding" || isAccountEntryPage(pathname) || isAuthCallbackRoute(pathname)) {
      return { type: "redirect", destination: safeNextPath(requestedNext) };
    }
    return { type: "pass" };
  }

  if (pathname === "/") {
    if (authState === "authenticated") return { type: "redirect", destination: DEFAULT_AUTHENTICATED_PATH };
    if (authState === "unauthenticated") return { type: "redirect", destination: "/login" };
    return { type: "pass" };
  }

  if (isAccountEntryPage(pathname)) {
    if (pathname === "/forgot-password" && authState === "authenticated") {
      return { type: "redirect", destination: "/impostazioni" };
    }
    return authState === "authenticated"
      ? { type: "redirect", destination: safeNextPath(requestedNext) }
      : { type: "pass" };
  }

  if (isPublicPage(pathname) || isAuthCallbackRoute(pathname) || authState === "authenticated" || authState === "error") {
    return { type: "pass" };
  }
  return { type: "redirect", destination: loginPathFor(destination) };
}
