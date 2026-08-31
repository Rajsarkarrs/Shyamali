import React, { useState, useEffect, useRef } from 'react';
import { joinRoom as joinNostrRoom } from '@trystero-p2p/nostr';
import { joinRoom as joinTorrentRoom } from '@trystero-p2p/torrent';
import { joinRoom as joinMqttRoom } from '@trystero-p2p/mqtt';
import { VisitorStats } from '../types';

let memorySessionId = '';

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem('shyamali_tab_session_id');
    if (!id) {
      id = 's_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem('shyamali_tab_session_id', id);
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

    // Track all unique peers across all meshes (PeerID -> lastSeen timestamp)
    const activePeers = new Map<string, number>();
    const localTabs = new Map<string, number>();
    localTabs.set(sessionId, Date.now());
    let serverActiveCount = 1;

    const recalculateStats = (totalVisits?: number) => {
      if (!isMounted) return;
      const now = Date.now();

      // Clean stale peers (> 35 seconds)
      for (const [id, lastSeen] of activePeers.entries()) {
        if (now - lastSeen > 35000) {
          activePeers.delete(id);
        }
      }

      // Clean stale tabs (> 12 seconds)
      for (const [id, lastSeen] of localTabs.entries()) {
        if (now - lastSeen > 12000) {
          localTabs.delete(id);
        }
      }

      const p2pCount = activePeers.size + 1; // peers + self
      const tabCount = localTabs.size;
      const highestActive = Math.max(p2pCount, tabCount, serverActiveCount, 1);

      setStats((prev) => ({
        activeCount: highestActive,
        totalVisits: totalVisits ?? prev.totalVisits,
      }));
    };

    const registerPeer = (peerId: string) => {
      if (!peerId) return;
      activePeers.set(peerId, Date.now());
      recalculateStats();
    };

    const removePeer = (peerId: string) => {
      if (!peerId) return;
      activePeers.delete(peerId);
      recalculateStats();
    };

    // -------------------------------------------------------------
    // P2P MESH ROOMS: Nostr, Torrent & MQTT (Works on any static host / domain)
    // -------------------------------------------------------------
    const rooms: any[] = [];
    const roomConfig = { appId: 'shyamali-tagore-live-v1' };
    const roomName = 'careframe-shyamali-presence';

    const setupRoom = (joinFn: any, name: string) => {
      try {
        const room = joinFn(roomConfig, roomName);
        if (room) {
          rooms.push(room);

          room.onPeerJoin = (peerId: string) => {
            registerPeer(`${name}_${peerId}`);
          };

          room.onPeerLeave = (peerId: string) => {
            removePeer(`${name}_${peerId}`);
          };

          // Periodic peer poll from active room connection
          const pollPeers = () => {
            if (!isMounted) return;
            try {
              const peers = room.getPeers();
              if (peers && typeof peers === 'object') {
                Object.keys(peers).forEach((pId) => {
                  registerPeer(`${name}_${pId}`);
                });
              }
            } catch {
              // Ignore room getPeers errors
            }
          };

          setTimeout(pollPeers, 1000);
          setTimeout(pollPeers, 3000);
          setTimeout(pollPeers, 6000);
        }
      } catch {
        // Ignore strategy failure
      }
    };

    // Initialize all 3 decentralized networks
    setupRoom(joinNostrRoom, 'nostr');
    setupRoom(joinTorrentRoom, 'torrent');
    setupRoom(joinMqttRoom, 'mqtt');

    // -------------------------------------------------------------
    // LOCAL TAB SYNC (Same browser, multiple tabs)
    // -------------------------------------------------------------
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('shyamali_local_tab_sync');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'tab_heartbeat' && ev.data.id) {
            localTabs.set(ev.data.id, ev.data.time || Date.now());
            recalculateStats();
          }
        };

        const pulseLocalTab = () => {
          if (!bc || !isMounted) return;
          try {
            bc.postMessage({ type: 'tab_heartbeat', id: sessionId, time: Date.now() });
          } catch {
            // Ignore
          }
        };

        pulseLocalTab();
        setInterval(pulseLocalTab, 3000);
      }
    } catch {
      // Ignore BroadcastChannel errors
    }

    // -------------------------------------------------------------
    // SERVER API SYNC (When backend is available)
    // -------------------------------------------------------------
    const sendServerPing = async () => {
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
            serverActiveCount = data.activeCount;
            recalculateStats(data.totalVisits);
          }
        }
      } catch {
        // Fallback to GET count
        try {
          const cacheBuster = Date.now();
          const res = await fetch(`/api/visitors/count?_t=${cacheBuster}`);
          if (res.ok) {
            const data = await res.json();
            if (typeof data.activeCount === 'number') {
              serverActiveCount = data.activeCount;
              recalculateStats(data.totalVisits);
            }
          }
        } catch {
          // Ignore server errors on static deployments
        }
      }
    };

    sendServerPing();
    const serverPingInterval = setInterval(sendServerPing, 3000);

    // Regular interval to clean stale peers and keep count accurate
    const cleanupInterval = setInterval(() => {
      recalculateStats();
    }, 4000);

    // Re-verify on visibility change / focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendServerPing();
        rooms.forEach((room) => {
          try {
            const peers = room.getPeers();
            if (peers && typeof peers === 'object') {
              Object.keys(peers).forEach((pId) => registerPeer(pId));
            }
          } catch {
            // Ignore
          }
        });
        recalculateStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Leave notify on page unload
    const handleUnload = () => {
      try {
        rooms.forEach((r) => {
          try {
            r.leave();
          } catch {
            // Ignore
          }
        });
        if (bc) {
          try {
            bc.close();
          } catch {
            // Ignore
          }
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
        // Ignore
      }
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      isMounted = false;
      clearInterval(serverPingInterval);
      clearInterval(cleanupInterval);
      rooms.forEach((r) => {
        try {
          r.leave();
        } catch {
          // Ignore
        }
      });
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
      className="liquid-glass-pill rounded-xl sm:rounded-2xl px-2 xs:px-2.5 sm:px-3.5 h-7 sm:h-9 text-white flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 transition-all select-none shrink-0 cursor-default"
    >
      {/* Realtime Live Glowing Pulse Dot */}
      <span className="relative flex h-1.5 w-1.5 xs:h-2 xs:w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 xs:h-2 xs:w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
      </span>

      {/* Live Active Count and Online label */}
      <div className="flex items-center gap-0.5 xs:gap-1 font-medium">
        <span className="text-[11px] xs:text-xs sm:text-sm font-bold tracking-tight font-mono text-emerald-300 leading-none">
          {stats.activeCount}
        </span>
        <span className="text-[9px] xs:text-[11px] sm:text-xs text-white/90 font-medium tracking-wide leading-none whitespace-nowrap">
          Online
        </span>
      </div>
    </div>
  );
});
