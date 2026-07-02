export type AdminSession = {
  token: string;
  expiresAt: string;
};

const STORAGE_KEY = "filmhub_admin_session";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function clearAdminSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function saveAdminSession(session: AdminSession) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getAdminSession(): AdminSession | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (!parsed.token || !parsed.expiresAt) {
      clearAdminSession();
      return null;
    }

    const expiresAtMs = new Date(parsed.expiresAt).getTime();
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      clearAdminSession();
      return null;
    }

    return { token: parsed.token, expiresAt: parsed.expiresAt };
  } catch {
    clearAdminSession();
    return null;
  }
}

export function getAdminToken() {
  return getAdminSession()?.token ?? null;
}
