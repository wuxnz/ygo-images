export type NotificationType =
  | "TOURNAMENT_INVITE"
  | "DECK_SHARED"
  | "TOURNAMENT_STARTED"
  | "TOURNAMENT_RESULT"
  | "FRIEND_REQUEST"
  | "GENERAL";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  data: string | null;
}
