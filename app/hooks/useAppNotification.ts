import { toast } from "sonner";

let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  if (permissionRequested) return Notification.permission;
  permissionRequested = true;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function useAppNotification() {
  return (title: string, body?: string) => {
    toast(title, { description: body });
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, { body });
        } catch {
          // ignore
        }
      } else if (Notification.permission === "default") {
        void ensureNotificationPermission().then((perm) => {
          if (perm === "granted") {
            try {
              new Notification(title, { body });
            } catch {
              // ignore
            }
          }
        });
      }
    }
  };
}
