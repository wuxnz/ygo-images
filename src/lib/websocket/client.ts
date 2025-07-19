import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types/notifications";

interface WebSocketMessage {
  type: "notification" | "ping" | "pong";
  data?: Notification;
}

export function useWebSocketClient() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const connect = () => {
    if (!session?.user?.id) return;

    const wsUrl =
      process.env.NODE_ENV === "production"
        ? `wss://${window.location.host}/api/websocket`
        : "ws://localhost:3001";

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);

        // Send authentication
        ws.send(
          JSON.stringify({
            type: "AUTH",
            userId: session.user.id,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          if (message.type === "notification" && message.data) {
            // Invalidate notification queries to trigger refetch
            queryClient.invalidateQueries({
              queryKey: [["notification", "getNotifications"]],
            });
            queryClient.invalidateQueries({
              queryKey: [["notification", "getUnreadCount"]],
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect after 3 seconds
        if (!event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  useEffect(() => {
    if (session?.user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session?.user?.id]);

  return {
    isConnected,
    lastMessage,
  };
}
