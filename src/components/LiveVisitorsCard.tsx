import React, { useState, useEffect, useRef } from 'react';
import { VisitorStats } from '../types';

export const LiveVisitorsCard: React.FC = React.memo(() => {
  const [stats, setStats] = useState<VisitorStats>({
    activeCount: 1,
    totalVisits: 108,
  });
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/visitors/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
          isConnectedRef.current = true;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.activeCount !== undefined) {
              setStats({
                activeCount: data.activeCount,
                totalVisits: data.totalVisits || 108,
              });
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          isConnectedRef.current = false;
        };
      } catch {
        setIsConnected(false);
        isConnectedRef.current = false;
      }
    };

    connectSSE();

    // Fallback polling only if SSE connection drops
    const fallbackInterval = setInterval(async () => {
      if (!isConnectedRef.current) {
        try {
          const res = await fetch('/api/visitors/count');
          if (res.ok) {
            const data = await res.json();
            if (data.activeCount !== undefined) {
              setStats({
                activeCount: data.activeCount,
                totalVisits: data.totalVisits || 108,
              });
            }
          }
        } catch {
          // Keep current fallback stats
        }
      }
    }, 8000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(fallbackInterval);
    };
  }, []);

  return (
    <div
      id="live-visitors-card"
      title={`${stats.activeCount} active viewer${stats.activeCount === 1 ? '' : 's'} online (${stats.totalVisits} total visits)`}
      className="backdrop-blur-md bg-black/35 border border-white/20 rounded-xl sm:rounded-2xl px-2 py-1 sm:px-3.5 sm:py-2 text-white shadow-xl flex items-center gap-1.5 sm:gap-2 hover:bg-black/45 transition-all select-none"
    >
      {/* Exact Live Active Count and Online label */}
      <div className="flex items-center gap-1 font-medium">
        <span className="text-[11px] sm:text-sm font-bold tracking-tight font-mono text-emerald-300">
          {stats.activeCount}
        </span>
        <span className="text-[10px] sm:text-sm text-white/90 font-medium tracking-wide">
          Online
        </span>
      </div>
    </div>
  );
});
