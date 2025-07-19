export const NOTIFICATION_TYPES = {
  // Tournament notifications
  TOURNAMENT_CREATED: "TOURNAMENT_CREATED",
  TOURNAMENT_JOINED: "TOURNAMENT_JOINED",
  TOURNAMENT_STARTED: "TOURNAMENT_STARTED",
  TOURNAMENT_COMPLETED: "TOURNAMENT_COMPLETED",
  TOURNAMENT_CANCELLED: "TOURNAMENT_CANCELLED",
  ROUND_STARTED: "ROUND_STARTED",
  MATCH_ASSIGNED: "MATCH_ASSIGNED",
  MATCH_RESULT_SUBMITTED: "MATCH_RESULT_SUBMITTED",

  // Team notifications
  TEAM_CREATED: "TEAM_CREATED",
  TEAM_JOINED: "TEAM_JOINED",
  TEAM_MEMBER_ADDED: "TEAM_MEMBER_ADDED",
  TEAM_MEMBER_REMOVED: "TEAM_MEMBER_REMOVED",
  TEAM_DELETED: "TEAM_DELETED",

  // Deck notifications
  DECK_CREATED: "DECK_CREATED",
  DECK_UPDATED: "DECK_UPDATED",
  DECK_SHARED: "DECK_SHARED",
  DECK_LIKED: "DECK_LIKED",

  // User notifications
  USER_FOLLOWED: "USER_FOLLOWED",
  USER_MENTIONED: "USER_MENTIONED",

  // System notifications
  SYSTEM_MAINTENANCE: "SYSTEM_MAINTENANCE",
  SYSTEM_UPDATE: "SYSTEM_UPDATE",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  enabledTypes: NotificationType[];
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}
