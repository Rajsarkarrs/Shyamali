import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up JSON body parser
app.use(express.json());

// Real-time SSE Live Visitor Tracking
interface VisitorClient {
  id: string;
  res: express.Response;
}

let clients: VisitorClient[] = [];
let totalVisits = 108; // Starting base visit count

function broadcastVisitorCount() {
  const activeCount = clients.length;
  const data = JSON.stringify({ activeCount, totalVisits });
  
  clients = clients.filter((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
      return true;
    } catch {
      return false;
    }
  });
}

// REST endpoint for initial fallback
app.get("/api/visitors/count", (_req, res) => {
  res.json({
    activeCount: clients.length,
    totalVisits,
  });
});

// SSE endpoint for real-time live visitor updates
app.get("/api/visitors/stream", (req, res) => {
  const clientId = Math.random().toString(36).substring(2, 9);

  // Set SSE headers with no caching and disabled buffering
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  totalVisits++;
  const client: VisitorClient = { id: clientId, res };
  clients.push(client);

  // Broadcast updated count to all connected clients immediately
  broadcastVisitorCount();

  // Heartbeat ping every 15s to keep connection alive across proxies
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, 15000);

  const cleanup = () => {
    clearInterval(heartbeatInterval);
    const initialLength = clients.length;
    clients = clients.filter((c) => c.id !== clientId);
    if (clients.length !== initialLength) {
      broadcastVisitorCount();
    }
  };

  // Remove client on disconnect or error
  req.on("close", cleanup);
  req.on("end", cleanup);
  req.on("error", cleanup);
});

// Start Express server with Vite middleware in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
