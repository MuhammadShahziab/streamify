import { create } from "zustand";
import type { AppNotification } from "../types";

interface NotificationState {
  notifications: AppNotification[];
  setNotifications: (items: AppNotification[]) => void;
  upsertNotification: (item: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const upsert = (
  items: AppNotification[],
  incoming: AppNotification
): AppNotification[] => {
  const index = items.findIndex((item) => item._id === incoming._id);
  if (index === -1) {
    return [incoming, ...items];
  }

  const next = [...items];
  next[index] = incoming;
  return next;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  setNotifications: (items) => set({ notifications: items }),
  upsertNotification: (item) =>
    set((state) => ({
      notifications: upsert(state.notifications, item),
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item._id === id ? { ...item, isRead: true } : item
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.isRead ? item : { ...item, isRead: true }
      ),
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((item) => item._id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
