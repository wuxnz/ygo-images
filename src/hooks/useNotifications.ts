import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/trpc/react";
import { useWebSocketClient } from "@/lib/websocket/client";
import type {
  Notification,
  NotificationPreferences,
} from "@/types/notifications";

export function useNotifications(limit = 20) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocketClient();

  const { data: notifications = [], isLoading } =
    api.notification.getNotifications.useQuery(
      { limit },
      {
        refetchInterval: isConnected ? false : 30000, // Only poll if WebSocket is not connected
      },
    );

  const { data: unreadCount = 0 } = api.notification.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: isConnected ? false : 30000,
    },
  );

  const markAsReadMutation = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["notification", "getNotifications"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["notification", "getUnreadCount"]],
      });
    },
  });

  const markAllAsReadMutation = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [["notification", "getNotifications"]],
      });
      queryClient.invalidateQueries({
        queryKey: [["notification", "getUnreadCount"]],
      });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const {
    data: preferences,
    isLoading,
    error,
  } = api.notification.getPreferences.useQuery();

  const updatePreferencesMutation =
    api.notification.updatePreferences.useMutation({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["notification", "getPreferences"]],
        });
      },
    });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferencesMutation.mutate,
  };
}

export function useWebSocketNotifications() {
  return useWebSocketClient();
}
