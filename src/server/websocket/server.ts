import { WebSocket } from "ws";
import type { Match } from "@prisma/client";

interface ClientData {
  userId: string;
  tournamentId?: number;
}

export const clients = new Map<WebSocket, ClientData>();

// Broadcast match updates to relevant clients
export function broadcastMatchUpdate(match: Match) {
  const message = JSON.stringify({
    type: "MATCH_UPDATE",
    match,
  });

  clients.forEach((clientData, client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      clientData.tournamentId === match.tournamentId
    ) {
      client.send(message);
    }
  });
}

// Broadcast notifications to specific user
export function broadcastNotification(userId: string, message: string) {
  const notification = JSON.stringify({
    type: "NOTIFICATION",
    message,
  });

  clients.forEach((clientData, client) => {
    if (client.readyState === WebSocket.OPEN && clientData.userId === userId) {
      client.send(notification);
    }
  });
}
