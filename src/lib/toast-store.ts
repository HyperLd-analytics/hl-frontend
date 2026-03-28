/**
 * Lightweight pub/sub for app-level toast notifications.
 * Use `registerToastCallback(fn)` at app startup and `emitToast(title, variant)` anywhere.
 */

type ToastCallback = (title: string, variant?: "default" | "error") => void;

let callbacks: ToastCallback[] = [];

export function registerToastCallback(fn: ToastCallback): () => void {
  callbacks.push(fn);
  return () => {
    callbacks = callbacks.filter((cb) => cb !== fn);
  };
}

export function emitToast(title: string, variant: "default" | "error" = "default"): void {
  for (const fn of callbacks) {
    try {
      fn(title, variant);
    } catch {
      // Ignore errors in toast callbacks
    }
  }
}
