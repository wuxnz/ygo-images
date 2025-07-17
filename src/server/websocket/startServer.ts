import { WebSocketServer } from "ws";
import { clients, broadcastMatchUpdate, broadcastNotification } from "./server";

const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (ws) => {
  // consol.log("New WebSocket client connected");

  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "AUTH") {
        clients.set(ws, {
          userId: data.userId,
          tournamentId: data.tournamentId,
        });
        // consol.log(`Authenticated client: ${data.userId}`);
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    // consol.log("Client disconnected");
  });
});

// consol.log("WebSocket server running on port 3001");

export { broadcastMatchUpdate, broadcastNotification };
