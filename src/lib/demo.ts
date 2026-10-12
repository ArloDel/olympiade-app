export const PROTECTED_DEMO_EMAILS = [
  "superadmin@olym.app",
  "admin@olym.app",
  "student@olym.app",
] as const;

export const DEMO_PLACEHOLDER_IMAGE_URL = "/demo/placeholder-question.svg";

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function isProtectedDemoEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (PROTECTED_DEMO_EMAILS as readonly string[]).includes(normalized);
}
