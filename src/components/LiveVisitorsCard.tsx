import React, { useState, useEffect, useRef } from 'react';
import { joinRoom } from '@trystero-p2p/mqtt';
import { VisitorStats } from '../types';

let memorySessionId = '';

function getOrCreateSessionId(): string {
  try {
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
  const peerCountRef = useRef<number>(1);
  const serverCountRef = useRef<number>(1);
  const localTabsRef = useRef<number>(1);

  if (!sessionIdRef.current) {
    sessionIdRef.current = getOrCreateSessionId();
  }

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    let isMounted = true;

    // Recalculate best active viewers count across all sync layers
    const updateMergedStats = (totalVisits?: number) => {
      if (!isMounted) return;
      const combinedActive = Math.max(
        peerCountRef.current,
        serverCountRef.current,
        localTabsRef.current,
        1
      );
      setStats((prev) => ({
        activeCount: combinedActive,
        totalVisits: totalVisits ?? prev.totalVisits,
      }));
    };

    // -------------------------------------------------------------
    // LAYER 1: Global P2P WebRTC / MQTT Presence Mesh (Cross-Device)
    // -------------------------------------------------------------
    let p2pRoom: ReturnType<typeof joinRoom> | null = null;
    try {
      p2pRoom = joinRoom(
        { appId: 'shyamali-tagore-music-live-mesh' },
        'active-listeners-presence'
      );

      const refreshPeerCount = () => {
        if (!p2pRoom || !isMounted) return;
        try {
          const peers = p2pRoom.getPeers();
          const count = Object.keys(peers).length + 1; // peers + self
          peerCountRef.current = count;
          updateMergedStats();
        } catch {
          // Ignore peer access errors
        }
      };

      p2pRoom.onPeerJoin = () => {
        refreshPeerCount();
      };

      p2pRoom.onPeerLeave = () => {
        refreshPeerCount();
      };

      // Initial check after connecting
      setTimeout(refreshPeerCount, 1200);
      setTimeout(refreshPeerCount, 3000);
    } catch {
      // P2P fallback handled by Server & BroadcastChannel layers
    }

    // -------------------------------------------------------------
    // LAYER 2: Same-Device Multi-Tab BroadcastChannel Synchronization
    // -------------------------------------------------------------
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('shyamali_tab_sync');
        const knownTabs = new Map<string, number>();
        knownTabs.set(sessionId, Date.now());

        const pingTabs = () => {
          if (!bc || !isMounted) return;
          try {
            bc.postMessage({ type: 'tab_ping', id: sessionId, time: Date.now() });
            const now = Date.now();
            for (const [id, t] of knownTabs.entries()) {
              if (now - t > 10000) knownTabs.delete(id);
            }
            localTabsRef.current = Math.max(1, knownTabs.size);
            updateMergedStats();
          } catch {
            // Ignore broadcast channel post errors
          }
        };

        bc.onmessage = (ev) => {
          if (ev.data?.type === 'tab_ping' && ev.data.id) {
            knownTabs.set(ev.data.id, ev.data.time || Date.now());
            localTabsRef.current = Math.max(1, knownTabs.size);
            updateMergedStats();
          }
        };

        pingTabs();
      }
    } catch {
      // Ignore broadcast channel unsupported errors
    }

    // -------------------------------------------------------------
    // LAYER 3: Backend REST Heartbeat & Server-Sent Events (SSE)
    // -------------------------------------------------------------
    const sendPing = async () => {
      try {
        const cacheBuster = Date.now();
        const res = await fetch(`/api/visitors/ping?sessionId=${encodeURIComponent(sessionId)}&_t=${cacheBuster}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.activeCount === 'number') {
            serverCountRef.current = Math.max(1, data.activeCount);
            updateMergedStats(data.totalVisits);
          }
        }
      } catch {
        // Fallback to GET count if POST ping fails
        try {
          const cacheBuster = Date.now();
          const res = await fetch(`/api/visitors/count?_t=${cacheBuster}`);
          if (res.ok) {
            const data = await res.json();
            if (typeof data.activeCount === 'number') {
              serverCountRef.current = Math.max(1, data.activeCount);
              updateMergedStats(data.totalVisits);
            }
          }
        } catch {
          // Ignore network errors
        }
      }
    };

    // Initial ping & recurring pulse
    sendPing();
    const pingInterval = setInterval(sendPing, 3000);

    // SSE Stream connection
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
            if (typeof data.activeCount === 'number') {
              serverCountRef.current = Math.max(1, data.activeCount);
              updateMergedStats(data.totalVisits);
            }
          } catch {
            // Ignore parse errors on heartbeat comments
          }
        };
        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        };
      } catch {
        // SSE not supported
      }
    };

    connectSSE();

    // Reconnect & ping when browser tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPing();
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          connectSSE();
        }
        if (p2pRoom) {
          try {
            const peers = p2pRoom.getPeers();
            peerCountRef.current = Object.keys(peers).length + 1;
            updateMergedStats();
          } catch {
            // Ignore
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Leave notify on page unload
    const handleUnload = () => {
      try {
        if (p2pRoom) {
          p2pRoom.leave();
        }
        if (bc) {
          bc.close();
        }
        const payload = JSON.stringify({ sessionId });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(`/api/visitors/leave?sessionId=${encodeURIComponent(sessionId)}`, blob);
        } else {
          fetch(`/api/visitors/leave?sessionId=${encodeURIComponent(sessionId)}`, {
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
      if (p2pRoom) {
        try {
          p2pRoom.leave();
        } catch {
          // Ignore
        }
      }
      if (bc) {
        try {
          bc.close();
        } catch {
          // Ignore
        }
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
