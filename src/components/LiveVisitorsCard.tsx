import React, { useState, useEffect, useRef } from 'react';
import { VisitorStats } from '../types';

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem('shyamali_visitor_session_id');
    if (!id) {
      id = 's_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      sessionStorage.setItem('shyamali_visitor_session_id', id);
    }
    return id;
  } catch {
    return 's_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
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

    const sendPing = async () => {
      try {
        const res = await fetch('/api/visitors/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.activeCount !== undefined) {
            setStats({
              activeCount: Math.max(1, data.activeCount),
              totalVisits: data.totalVisits || 108,
            });
          }
        }
      } catch {
        // Ignore network errors on ping
      }
    };

    // Initial ping
    sendPing();

    // Pulse ping every 4 seconds
    const pingInterval = setInterval(sendPing, 4000);

    // SSE connection for instant pushed updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/visitors/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.activeCount !== undefined) {
            setStats({
              activeCount: Math.max(1, data.activeCount),
              totalVisits: data.totalVisits || 108,
            });
          }
        } catch {
          // Ignore JSON parse errors
        }
      };
    } catch {
      // SSE fallback handled by ping interval
    }

    // Ping on tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

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
      clearInterval(pingInterval);
      if (eventSource) {
        eventSource.close();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  return (
    <div
      id="live-visitors-card"
      title={`${stats.activeCount} active viewer${stats.activeCount === 1 ? '' : 's'} online (${stats.totalVisits} total visits)`}
      className="backdrop-blur-md bg-black/35 border border-white/20 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 h-8 sm:h-9 text-white shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-black/45 transition-all select-none shrink-0"
    >
      {/* Exact Live Active Count and Online label */}
      <div className="flex items-center gap-1.5 font-medium">
        <span className="text-xs sm:text-sm font-bold tracking-tight font-mono text-emerald-300 leading-none">
          {stats.activeCount}
        </span>
        <span className="text-xs sm:text-sm text-white/90 font-medium tracking-wide leading-none">
          Online
        </span>
      </div>
    </div>
  );
});
