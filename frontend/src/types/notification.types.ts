import type { User } from "./user.types";

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequestEntity {
  _id: string;
  sender: User;
  recipient: User;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export type NotificationKind =
  | "friend_request"
  | "friend_request_accepted";

export interface AppNotification {
  _id: string;
  user: string;
  friendRequest: FriendRequestEntity;
  type: NotificationKind;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
}
