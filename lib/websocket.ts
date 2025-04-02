import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
  transcriptId?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocketClient>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", (ws: WebSocketClient) => {
      ws.isAlive = true;

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.type === "subscribe" && data.transcriptId) {
            this.subscribeToTranscript(ws, data.transcriptId);
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });

      ws.on("close", () => {
        this.removeClient(ws);
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private subscribeToTranscript(client: WebSocketClient, transcriptId: string) {
    client.transcriptId = transcriptId;
    if (!this.clients.has(transcriptId)) {
      this.clients.set(transcriptId, new Set());
    }
    this.clients.get(transcriptId)?.add(client);
  }

  private removeClient(client: WebSocketClient) {
    if (client.transcriptId) {
      const clients = this.clients.get(client.transcriptId);
      if (clients) {
        clients.delete(client);
        if (clients.size === 0) {
          this.clients.delete(client.transcriptId);
        }
      }
    }
  }

  public broadcastTranscriptUpdate(transcriptId: string, data: any) {
    const clients = this.clients.get(transcriptId);
    if (clients) {
      const message = JSON.stringify({
        type: "transcriptUpdate",
        data,
      });

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  public broadcastError(transcriptId: string, error: string) {
    const clients = this.clients.get(transcriptId);
    if (clients) {
      const message = JSON.stringify({
        type: "error",
        error,
      });

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }
} 