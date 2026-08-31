import React, { useState, useEffect, useRef } from 'react';
import { VisitorStats } from '../types';

let memorySessionId = '';

function getOrCreateSessionId(): string {
  try {
    // Try localStorage first for persistent device identity across refreshes
    let id = localStorage.getItem('shyamali_device_id');
    if (!id) {
      id = sessionStorage.getItem('shyamali_visitor_session_id');
    }
    if (!id) {
      id = 's_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    }
    try {
      localStorage.setItem('shyamali_device_id', id);
      sessionStorage.setItem('shyamali_visitor_session_id', id);
    } catch {
      // Ignore quota/security errors in incognito/iframe
    }
    return id;
  } catch {
    if (!memorySessionId) {
      memorySessionId = 's_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    }
    return memorySessionId;
  }
}

export const LiveVisitorsCard: React.FC = React.memo(() => {
  const [stats, setStats] = useState<VisitorStats>({
    activeCount: 1,
    totalVisits: 108,
  });
  const sessionIdRef = useRef<string>('');

  if (!sessionIdRef.current) {
    sessionIdRef.current = getOrCreateSessionId();
  }

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    let isMounted = true;

    const applyStats = (data: Partial<VisitorStats>) => {
      if (!isMounted) return;
      if (typeof data.activeCount === 'number') {
        setStats((prev) => ({
          activeCount: Math.max(1, data.activeCount ?? prev.activeCount),
          totalVisits: data.totalVisits ?? prev.totalVisits,
        }));
      }
    };

    // Send heartbeat ping to server
    const sendPing = async () => {
      try {
        const res = await fetch('/api/visitors/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          applyStats(data);
        }
      } catch {
        // Fallback to GET count if POST ping fails
        try {
          const res = await fetch('/api/visitors/count');
          if (res.ok) {
            const data = await res.json();
            applyStats(data);
          }
        } catch {
          // Ignore offline errors
        }
      }
    };

    // Initial ping
    sendPing();

    // Pulse ping every 4 seconds to maintain active session heartbeat
    const pingInterval = setInterval(sendPing, 4000);

    // SSE connection for instant pushed real-time updates
    let eventSource: EventSource | null = null;
    const connectSSE = () => {
      try {
        if (eventSource) {
          eventSource.close();
        }
        eventSource = new EventSource('/api/visitors/stream');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            applyStats(data);
          } catch {
            // Ignore parse errors on heartbeat comments
          }
        };
        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Polling will seamlessly maintain updates while SSE is reconnecting
        };
      } catch {
        // SSE not supported, polling interval handles updates
      }
    };

    connectSSE();

    // Immediate ping & reconnect when tab becomes active/visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPing();
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          connectSSE();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Leave notify on page unload
    const handleUnload = () => {
      try {
        const payload = JSON.stringify({ sessionId });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/visitors/leave', blob);
        } else {
          fetch('/api/visitors/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          });
        }
      } catch {
        // Ignore cleanup errors
      }
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      if (eventSource) {
        eventSource.close();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  return (
    <div
      id="live-visitors-card"
      title={`${stats.activeCount} active viewer${stats.activeCount === 1 ? '' : 's'} online (${stats.totalVisits} total visits)`}
      className="liquid-glass-pill rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 h-8 sm:h-9 text-white flex items-center justify-center gap-1.5 sm:gap-2 transition-all select-none shrink-0 cursor-default"
    >
      {/* Realtime Live Glowing Pulse Dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
      </span>

      {/* Live Active Count and Online label */}
      <div className="flex items-center gap-1 font-medium">
        <span className="text-xs sm:text-sm font-bold tracking-tight font-mono text-emerald-300 leading-none">
          {stats.activeCount}
        </span>
        <span className="text-[11px] sm:text-xs text-white/90 font-medium tracking-wide leading-none">
          Online
        </span>
      </div>
    </div>
  );
});
