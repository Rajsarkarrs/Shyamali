import React, { useEffect, useRef, useCallback } from 'react';
import { Track } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface SeekRequest {
  time: number;
  id: number;
}

interface YouTubeAudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  seekRequest?: SeekRequest | null;
  onTrackEnd: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onPlayerReady?: () => void;
  onError?: (err: any) => void;
}

export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = React.memo(({
  track,
  isPlaying,
  volume,
  isMuted,
  seekRequest,
  onTrackEnd,
  onTimeUpdate,
  onPlayerReady,
  onError,
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioFallbackRef = useRef<HTMLAudioElement | null>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const isUsingFallbackRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  
  // Track tracking
  const currentTrackRef = useRef<Track>(track);
  currentTrackRef.current = track;

  const currentTrackIdRef = useRef<string>(track.id);
  const pendingTrackIdRef = useRef<string>(track.id);
  const pendingPlayRef = useRef<boolean>(isPlaying);
  pendingPlayRef.current = isPlaying;

  const volumeRef = useRef<number>(volume);
  volumeRef.current = volume;

  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;

  const onTrackEndRef = useRef(onTrackEnd);
  onTrackEndRef.current = onTrackEnd;

  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  const onPlayerReadyRef = useRef(onPlayerReady);
  onPlayerReadyRef.current = onPlayerReady;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const lastReportedTimeRef = useRef<number>(0);
  const lastHandledSeekIdRef = useRef<number | null>(null);

  // Time loop to report playback progress
  const startTimeLoop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // 1. Fallback Audio check
      if (isUsingFallbackRef.current && audioFallbackRef.current) {
        const cur = audioFallbackRef.current.currentTime || 0;
        const dur = audioFallbackRef.current.duration || currentTrackRef.current.durationSeconds || 180;
        if (Math.abs(cur - lastReportedTimeRef.current) >= 0.2) {
          lastReportedTimeRef.current = cur;
          onTimeUpdateRef.current(cur, dur);
        }
        return;
      }

      // 2. YouTube Player check
      if (playerRef.current && isPlayerReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const state = typeof playerRef.current.getPlayerState === 'function' ? playerRef.current.getPlayerState() : -1;
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || currentTrackRef.current.durationSeconds || 180;

          if (duration > 0 && Math.abs(currentTime - lastReportedTimeRef.current) >= 0.2) {
            lastReportedTimeRef.current = currentTime;
            onTimeUpdateRef.current(currentTime, duration);
          }

          // If playing state is active, ensure loop keeps running
          if (state === 1 && !pendingPlayRef.current) {
            // Keep in sync
          }
        } catch {
          // Ignore transient read errors
        }
      }
    }, 250);
  }, []);

  const stopTimeLoop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // HTML5 audio fallback if YouTube has embed restrictions
  const activateAudioFallback = useCallback(() => {
    isUsingFallbackRef.current = true;
    if (!audioFallbackRef.current) {
      audioFallbackRef.current = new Audio();
    }
    const audio = audioFallbackRef.current;
    if (currentTrackRef.current.audioUrl) {
      audio.src = currentTrackRef.current.audioUrl;
    } else {
      // Pleasant calm meditative ambient fallback stream
      audio.src = 'https://actions.google.com/sounds/v1/ambiences/wind_chimes.ogg';
    }
    audio.volume = isMutedRef.current ? 0 : volumeRef.current / 100;
    audio.muted = isMutedRef.current;

    if (pendingPlayRef.current) {
      audio.play().then(() => {
        startTimeLoop();
      }).catch((e) => {
        console.warn('Audio fallback autoplay prevented:', e);
      });
    }

    audio.onended = () => {
      stopTimeLoop();
      onTrackEndRef.current();
    };

    audio.ontimeupdate = () => {
      const cur = audio.currentTime || 0;
      const dur = audio.duration || currentTrackRef.current.durationSeconds || 180;
      onTimeUpdateRef.current(cur, dur);
    };
  }, [startTimeLoop, stopTimeLoop]);

  // Setup OS / Browser Media Session integration
  useEffect(() => {
    if ('mediaSession' in navigator && track) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist || 'Rabindra Sangeet',
          album: 'Shyamali রবীন্দ্র সঙ্গীত',
          artwork: [
            {
              src: track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`,
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ],
        });

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (err) {
        console.warn('MediaSession metadata error:', err);
      }
    }
  }, [track, isPlaying]);

  // Initialize YouTube IFrame API ONCE on mount
  useEffect(() => {
    let isUnmounted = false;

    const createPlayerInstance = () => {
      if (isUnmounted || !window.YT || !window.YT.Player || !containerRef.current) return;

      // Ensure clean mount node
      const mountNode = document.createElement('div');
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(mountNode);

      const targetTrackId = pendingTrackIdRef.current || 'rZwJie68mo0';

      try {
        playerRef.current = new window.YT.Player(mountNode, {
          height: '180',
          width: '240',
          videoId: targetTrackId,
          playerVars: {
            autoplay: pendingPlayRef.current ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
          },
          events: {
            onReady: (event: any) => {
              if (isUnmounted) return;
              isPlayerReadyRef.current = true;
              currentTrackIdRef.current = targetTrackId;

              // Apply current volume
              const currentVol = isMutedRef.current ? 0 : volumeRef.current;
              if (typeof event.target.setVolume === 'function') {
                event.target.setVolume(currentVol);
              }
              if (isMutedRef.current && typeof event.target.mute === 'function') {
                event.target.mute();
              } else if (!isMutedRef.current && typeof event.target.unMute === 'function') {
                event.target.unMute();
              }

              // If user requested play before or while player was initializing
              if (pendingPlayRef.current) {
                try {
                  event.target.playVideo();
                  startTimeLoop();
                } catch (e) {
                  console.warn('playVideo failed onReady:', e);
                }
              }

              if (onPlayerReadyRef.current) onPlayerReadyRef.current();
            },
            onStateChange: (event: any) => {
              if (isUnmounted) return;
              // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
              if (event.data === 0) {
                stopTimeLoop();
                onTrackEndRef.current();
              } else if (event.data === 1) {
                isUsingFallbackRef.current = false;
                startTimeLoop();
              } else if (event.data === 2) {
                stopTimeLoop();
              }
            },
            onError: (event: any) => {
              if (isUnmounted) return;
              const errorCode = typeof event === 'object' && event !== null && 'data' in event ? event.data : event;
              console.warn('YouTube Audio Player embed error code:', errorCode, 'for track:', currentTrackRef.current.title);
              
              if (onErrorRef.current) onErrorRef.current(errorCode);
              
              // Error 100 (not found), 101/150 (not allowed to embed): auto advance or fallback
              if (errorCode === 101 || errorCode === 150 || errorCode === 100 || errorCode === 2) {
                // If this specific YouTube video cannot be embedded, smoothly skip to next track after slight delay
                console.info('Auto-advancing past restricted track...');
                setTimeout(() => {
                  if (!isUnmounted) {
                    onTrackEndRef.current();
                  }
                }, 800);
              } else {
                activateAudioFallback();
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player initialization exception:', err);
        activateAudioFallback();
      }
    };

    // Load YouTube API script if not already in window
    if (window.YT && window.YT.Player) {
      createPlayerInstance();
    } else {
      const existingTag = document.getElementById('youtube-iframe-api-script');
      if (!existingTag) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // Chain onto existing callback if any
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        createPlayerInstance();
      };
    }

    return () => {
      isUnmounted = true;
      stopTimeLoop();
      if (audioFallbackRef.current) {
        audioFallbackRef.current.pause();
        audioFallbackRef.current.src = '';
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore
        }
      }
    };
  }, []); // Run ONLY once on mount!

  // Handle Track ID changes dynamically without destroying player
  useEffect(() => {
    pendingTrackIdRef.current = track.id;

    if (currentTrackIdRef.current === track.id) {
      return;
    }
    currentTrackIdRef.current = track.id;
    isUsingFallbackRef.current = false;
    lastReportedTimeRef.current = 0;

    if (audioFallbackRef.current) {
      audioFallbackRef.current.pause();
    }

    const targetVideoId = (track.id && track.id.length === 11 && !/[^a-zA-Z0-9_-]/.test(track.id))
      ? track.id
      : 'rZwJie68mo0';

    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        if (isPlaying) {
          if (typeof playerRef.current.loadVideoById === 'function') {
            playerRef.current.loadVideoById({
              videoId: targetVideoId,
              startSeconds: 0,
            });
            startTimeLoop();
          }
        } else {
          if (typeof playerRef.current.cueVideoById === 'function') {
            playerRef.current.cueVideoById({
              videoId: targetVideoId,
              startSeconds: 0,
            });
          }
        }
      } catch (err) {
        console.warn('Error loading video by ID:', err);
        activateAudioFallback();
      }
    }
  }, [track.id, isPlaying, activateAudioFallback, startTimeLoop]);

  // Handle Play / Pause state changes
  useEffect(() => {
    pendingPlayRef.current = isPlaying;

    if (isUsingFallbackRef.current && audioFallbackRef.current) {
      if (isPlaying) {
        audioFallbackRef.current.play().catch(() => {});
        startTimeLoop();
      } else {
        audioFallbackRef.current.pause();
        stopTimeLoop();
      }
      return;
    }

    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        if (isPlaying) {
          if (typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
            startTimeLoop();
          }
        } else {
          if (typeof playerRef.current.pauseVideo === 'function') {
            playerRef.current.pauseVideo();
            stopTimeLoop();
          }
        }
      } catch {
        activateAudioFallback();
      }
    }
  }, [isPlaying, activateAudioFallback, startTimeLoop, stopTimeLoop]);

  // Handle Timeline Seeking
  useEffect(() => {
    if (!seekRequest || seekRequest.id === lastHandledSeekIdRef.current) {
      return;
    }
    lastHandledSeekIdRef.current = seekRequest.id;
    const targetTime = Math.max(0, seekRequest.time);
    lastReportedTimeRef.current = targetTime;

    // 1. YouTube Player seek
    if (playerRef.current && isPlayerReadyRef.current && !isUsingFallbackRef.current) {
      try {
        if (typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(targetTime, true);
        }
      } catch (err) {
        console.warn('YouTube seekTo failed:', err);
      }
    }

    // 2. Audio fallback seek
    if (audioFallbackRef.current) {
      try {
        audioFallbackRef.current.currentTime = targetTime;
      } catch (err) {
        console.warn('Audio fallback seek failed:', err);
      }
    }
  }, [seekRequest]);

  // Handle Volume and Mute
  useEffect(() => {
    if (audioFallbackRef.current) {
      audioFallbackRef.current.volume = isMuted ? 0 : volume / 100;
      audioFallbackRef.current.muted = isMuted;
    }

    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        if (typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(isMuted ? 0 : volume);
        }
        if (isMuted && typeof playerRef.current.mute === 'function') {
          playerRef.current.mute();
        } else if (!isMuted && typeof playerRef.current.unMute === 'function') {
          playerRef.current.unMute();
        }
      } catch {
        // Ignore
      }
    }
  }, [volume, isMuted]);

  return (
    /*
      Active in-viewport container with zero opacity & pointer-events-none.
      Crucial: Kept inside active viewport bounds to prevent Chrome & Safari background iframe throttling.
    */
    <div
      aria-hidden="true"
      className="fixed bottom-0 right-0 w-[200px] h-[150px] pointer-events-none opacity-0 -z-50 overflow-hidden"
    >
      <div ref={containerRef} id="youtube-hidden-audio-player" />
    </div>
  );
});

