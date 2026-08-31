import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set up body parsers (JSON, urlencoded, and text for sendBeacon)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: ['text/*', 'application/json'] }));

// CORS & Anti-Caching headers for all visitor API routes
app.use("/api/visitors", (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Cache-Control, Pragma");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Real-time SSE & Ping Live Visitor Tracking
interface SSEClient {
  id: string;
  res: express.Response;
}

const STATE_FILE = path.join(process.cwd(), '.visitors_state.json');
const activeSessions = new Map<string, number>(); // sessionId -> lastSeen timestamp
const visitedSessionIds = new Set<string>();
let sseClients: SSEClient[] = [];
let totalVisits = 108; // Starting base visit count

// Load initial state if exists
try {
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.totalVisits) totalVisits = Math.max(totalVisits, parsed.totalVisits);
    if (Array.isArray(parsed.active)) {
      const now = Date.now();
      for (const item of parsed.active) {
        if (item.id && item.time && now - item.time < 30000) {
          activeSessions.set(item.id, item.time);
          visitedSessionIds.add(item.id);
        }
      }
    }
  }
} catch {
  // Ignore state file read error
}

function saveState() {
  try {
    const active = Array.from(activeSessions.entries()).map(([id, time]) => ({ id, time }));
    fs.writeFileSync(STATE_FILE, JSON.stringify({ totalVisits, active }));
  } catch {
    // Ignore state file write error
  }
}

const SESSION_TIMEOUT = 30000; // 30 seconds timeout for inactive sessions

function cleanStaleSessions(): boolean {
  const now = Date.now();
  let removed = false;
  for (const [sessionId, lastSeen] of activeSessions.entries()) {
    if (now - lastSeen > SESSION_TIMEOUT) {
      activeSessions.delete(sessionId);
      removed = true;
    }
  }
  if (removed) saveState();
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
      if (typeof (client.res as any).flush === 'function') {
        (client.res as any).flush();
      }
      return true;
    } catch {
      return false;
    }
  });
}

function extractSessionId(req: express.Request): string | null {
  if (req.query && req.query.sessionId) {
    return String(req.query.sessionId).trim();
  }
  if (!req.body) return null;
  if (typeof req.body === 'object' && req.body.sessionId) {
    return String(req.body.sessionId).trim();
  }
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      if (parsed && parsed.sessionId) return String(parsed.sessionId).trim();
    } catch {
      if (req.body.startsWith('s_')) return req.body.trim();
    }
  }
  return null;
}

function handlePing(req: express.Request, res: express.Response) {
  const sessionId = extractSessionId(req);
  if (sessionId) {
    if (!visitedSessionIds.has(sessionId)) {
      visitedSessionIds.add(sessionId);
      totalVisits++;
    }
    activeSessions.set(sessionId, Date.now());
    saveState();
  }
  const stats = getActiveStats();
  broadcastVisitorStats();
  res.json(stats);
}

// Periodically clean stale sessions and broadcast if count changed
setInterval(() => {
  if (cleanStaleSessions()) {
    broadcastVisitorStats();
  }
}, 4000);

// Ping endpoint for active session pulse (supports both POST and GET)
app.post("/api/visitors/ping", handlePing);
app.get("/api/visitors/ping", handlePing);

// Leave endpoint when user closes tab
app.post("/api/visitors/leave", (req, res) => {
  const sessionId = extractSessionId(req);
  if (sessionId) {
    activeSessions.delete(sessionId);
    saveState();
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
    "Cache-Control": "no-cache, no-transform, no-store",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  });

  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }

  const client: SSEClient = { id: clientId, res };
  sseClients.push(client);

  // Send initial data immediately
  const stats = getActiveStats();
  res.write(`data: ${JSON.stringify(stats)}\n\n`);

  // Heartbeat ping every 15s to keep connection alive across proxies
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
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
