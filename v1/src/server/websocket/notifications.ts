import type { User } from "@prisma/client";
import { broadcastNotification } from "./server";
import { clients } from "./server";

export enum NotificationType {
  MATCH_STARTED = "MATCH_STARTED",
  MATCH_COMPLETED = "MATCH_COMPLETED",
  TOURNAMENT_STARTED = "TOURNAMENT_STARTED",
  SCORE_REPORTED = "SCORE_REPORTED",
  PLAYER_ADVANCED = "PLAYER_ADVANCED",
}

export function sendMatchNotification(
  matchId: string,
  type: NotificationType,
  participants: User[],
) {
  const message = `Match update: ${NotificationType[type]} for match ${matchId}`;

  participants.forEach((user) => {
    broadcastNotification(user.id, message);
  });
}

export function sendTournamentNotification(
  tournamentId: number,
  message: string,
) {
  const notification = `Tournament ${tournamentId}: ${message}`;

  // In real implementation, we'd fetch tournament participants
  // For now, broadcast to all clients in the tournament
  clients.forEach((clientData, client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      clientData.tournamentId === tournamentId
    ) {
      client.send(
        JSON.stringify({
          type: "TOURNAMENT_NOTIFICATION",
          message: notification,
        }),
      );
    }
  });
}
