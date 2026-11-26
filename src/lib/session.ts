const prefix = "priced-catalog:";

export function recall<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(prefix + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function keep(key: string, value: unknown) {
  try {
    sessionStorage.setItem(prefix + key, JSON.stringify(value));
  } catch {
    // ponytail: no session storage (private mode, server render) means page memory only.
  }
}
