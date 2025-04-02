import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketManager } from "./lib/websocket";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize WebSocket manager
  const wsManager = new WebSocketManager(server);

  // Make WebSocket manager available globally
  (global as any).wsManager = wsManager;

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}); 