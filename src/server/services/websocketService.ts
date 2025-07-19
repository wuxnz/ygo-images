import type { Server } from "ws";
import type { WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parse } from "url";

interface WebSocketClient {
  userId: string;
  ws: WebSocket;
}

export class WebSocketService {
  private wss: Server | null = null;
  private clients: Map<string, WebSocketClient> = new Map();

  initialize(server: any) {
    const WebSocketServer = require("ws").Server;
    this.wss = new WebSocketServer({ server });

    if (!this.wss) {
      console.error("Failed to initialize WebSocket server");
      return;
    }

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const url = parse(req.url || "", true);
      const userId = url.query.userId as string;

      if (!userId) {
        ws.close(1008, "User ID required");
        return;
      }

      console.log(`WebSocket client connected: ${userId}`);
      this.clients.set(userId, { userId, ws });

      ws.on("close", () => {
        console.log(`WebSocket client disconnected: ${userId}`);
        this.clients.delete(userId);
      });

      ws.on("error", (error: Error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        this.clients.delete(userId);
      });
    });

    console.log("WebSocket server initialized");
  }

  sendToUser(userId: string, message: any): boolean {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === client.ws.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
        this.clients.delete(userId);
        return false;
      }
    }
    return false;
  }

  broadcast(message: any): number {
    let sentCount = 0;
    this.clients.forEach((client) => {
      if (client.ws.readyState === client.ws.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(
            `Failed to send broadcast to user ${client.userId}:`,
            error,
          );
          this.clients.delete(client.userId);
        }
      }
    });
    return sentCount;
  }

  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  close(): void {
    if (this.wss) {
      this.wss.close();
      this.clients.clear();
      console.log("WebSocket server closed");
    }
  }
}

export const websocketService = new WebSocketService();
