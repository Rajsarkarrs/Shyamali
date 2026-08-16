import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up JSON body parser
app.use(express.json());

// Real-time SSE & Ping Live Visitor Tracking
interface SSEClient {
  id: string;
  res: express.Response;
}

const activeSessions = new Map<string, number>(); // sessionId -> lastSeen timestamp
const visitedSessionIds = new Set<string>();
let sseClients: SSEClient[] = [];
let totalVisits = 108; // Starting base visit count

function cleanStaleSessions(): boolean {
  const now = Date.now();
  const timeout = 10000; // 10 seconds timeout for inactive sessions
  let removed = false;
  for (const [sessionId, lastSeen] of activeSessions.entries()) {
    if (now - lastSeen > timeout) {
      activeSessions.delete(sessionId);
      removed = true;
    }
  }
  return removed;
}

function getActiveStats() {
  cleanStaleSessions();
  return {
    activeCount: Math.max(1, activeSessions.size),
    totalVisits,
  };
}

function broadcastVisitorStats() {
  const stats = getActiveStats();
  const data = JSON.stringify(stats);

  sseClients = sseClients.filter((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
      return true;
    } catch {
      return false;
    }
  });
}

// Periodically clean stale sessions and broadcast if count changed
setInterval(() => {
  if (cleanStaleSessions()) {
    broadcastVisitorStats();
  }
}, 4000);

// Ping endpoint for active session pulse
app.post("/api/visitors/ping", (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId && typeof sessionId === "string") {
    if (!visitedSessionIds.has(sessionId)) {
      visitedSessionIds.add(sessionId);
      totalVisits++;
    }
    activeSessions.set(sessionId, Date.now());
  }
  const stats = getActiveStats();
  broadcastVisitorStats();
  res.json(stats);
});

// Leave endpoint when user closes tab
app.post("/api/visitors/leave", (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId && typeof sessionId === "string") {
    activeSessions.delete(sessionId);
  }
  const stats = getActiveStats();
  broadcastVisitorStats();
  res.json({ ok: true });
});

// REST endpoint for initial / fallback count
app.get("/api/visitors/count", (_req, res) => {
  res.json(getActiveStats());
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

  const client: SSEClient = { id: clientId, res };
  sseClients.push(client);

  // Send initial data immediately
  const stats = getActiveStats();
  res.write(`data: ${JSON.stringify(stats)}\n\n`);

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
    sseClients = sseClients.filter((c) => c.id !== clientId);
  };

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
