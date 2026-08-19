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
  id: number; // Unique trigger token
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
  const isApiLoadedRef = useRef(false);
  const isPlayerReadyRef = useRef(false);
  const isUsingFallbackRef = useRef(false);
  const timerRef = useRef<any>(null);
  
  // Stable track ID reference to avoid spurious reloads
  const loadedTrackIdRef = useRef<string>('');
  const lastReportedTimeRef = useRef<number>(0);
  const lastHandledSeekIdRef = useRef<number | null>(null);

  // Keep latest props in refs to avoid rebuilding effects on volume/callback updates
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const onTrackEndRef = useRef(onTrackEnd);
  onTrackEndRef.current = onTrackEnd;

  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  const onPlayerReadyRef = useRef(onPlayerReady);
  onPlayerReadyRef.current = onPlayerReady;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Time tracking loop for YouTube Player
  const startTimeLoop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isUsingFallbackRef.current && audioFallbackRef.current) {
        const cur = audioFallbackRef.current.currentTime || 0;
        const dur = audioFallbackRef.current.duration || track.durationSeconds || 180;
        if (Math.abs(cur - lastReportedTimeRef.current) >= 0.25) {
          lastReportedTimeRef.current = cur;
          onTimeUpdateRef.current(cur, dur);
        }
        return;
      }

      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || track.durationSeconds || 180;
          if (duration > 0 && Math.abs(currentTime - lastReportedTimeRef.current) >= 0.25) {
            lastReportedTimeRef.current = currentTime;
            onTimeUpdateRef.current(currentTime, duration);
          }
        } catch {
          // Ignore transient read errors
        }
      }
    }, 400);
  }, [track.durationSeconds]);

  const stopTimeLoop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Activate HTML5 audio fallback if YouTube has embed restrictions or network blocks
  const activateAudioFallback = useCallback(() => {
    isUsingFallbackRef.current = true;
    if (!audioFallbackRef.current) {
      audioFallbackRef.current = new Audio();
    }
    const audio = audioFallbackRef.current;
    if (track.audioUrl) {
      audio.src = track.audioUrl;
    } else {
      audio.src = 'https://actions.google.com/sounds/v1/ambiences/outdoor_festival_crowd.ogg';
    }
    audio.volume = isMutedRef.current ? 0 : volumeRef.current / 100;
    audio.muted = isMutedRef.current;

    if (isPlayingRef.current) {
      audio.play().catch((e) => console.warn('Audio fallback play prevented:', e));
      startTimeLoop();
    }

    audio.onended = () => {
      stopTimeLoop();
      onTrackEndRef.current();
    };

    audio.ontimeupdate = () => {
      const cur = audio.currentTime || 0;
      const dur = audio.duration || track.durationSeconds || 180;
      onTimeUpdateRef.current(cur, dur);
    };
  }, [track.audioUrl, track.durationSeconds, startTimeLoop, stopTimeLoop]);

  // Initialize YouTube IFrame API Once
  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player || !containerRef.current) return;

      const mountNode = document.createElement('div');
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(mountNode);

      try {
        playerRef.current = new window.YT.Player(mountNode, {
          height: '200',
          width: '320',
          videoId: track.id,
          playerVars: {
            autoplay: isPlayingRef.current ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              isPlayerReadyRef.current = true;
              loadedTrackIdRef.current = track.id;
              
              const currentVol = isMutedRef.current ? 0 : volumeRef.current;
              if (typeof event.target.setVolume === 'function') {
                event.target.setVolume(currentVol);
              }
              if (isMutedRef.current && typeof event.target.mute === 'function') {
                event.target.mute();
              } else if (!isMutedRef.current && typeof event.target.unMute === 'function') {
                event.target.unMute();
              }

              if (isPlayingRef.current) {
                event.target.playVideo();
                startTimeLoop();
              }

              if (onPlayerReadyRef.current) onPlayerReadyRef.current();
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3)
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
              const errorCode = typeof event === 'object' && event !== null && 'data' in event ? event.data : event;
              console.warn('YouTube Audio Player embed error:', errorCode, '- activating audio fallback for track:', track.title);
              if (onErrorRef.current) onErrorRef.current(errorCode);
              activateAudioFallback();
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player initialization error:', err);
        activateAudioFallback();
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      if (!isApiLoadedRef.current) {
        isApiLoadedRef.current = true;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          initPlayer();
        };
      }
    }

    return () => {
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
  }, [activateAudioFallback, startTimeLoop, stopTimeLoop]);

  // Handle Track change strictly when track.id changes
  useEffect(() => {
    if (loadedTrackIdRef.current === track.id) {
      return; // Same track, do not reload or restart!
    }
    loadedTrackIdRef.current = track.id;
    isUsingFallbackRef.current = false;
    lastReportedTimeRef.current = 0;

    if (audioFallbackRef.current) {
      audioFallbackRef.current.pause();
    }

    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function' && isPlayerReadyRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.loadVideoById({
            videoId: track.id,
            startSeconds: 0,
          });
          startTimeLoop();
        } else {
          playerRef.current.cueVideoById({
            videoId: track.id,
            startSeconds: 0,
          });
        }
      } catch {
        activateAudioFallback();
      }
    } else if (isPlaying) {
      activateAudioFallback();
    }
  }, [track.id, isPlaying, activateAudioFallback, startTimeLoop]);

  // Handle Play / Pause changes
  useEffect(() => {
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

  // Handle Seeking when seekRequest is received
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

  // Handle Volume and Mute without touching playback position
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
    /* Invisible active container that prevents browser background tab throttling */
    <div
      aria-hidden="true"
      className="fixed -bottom-[600px] -right-[600px] w-80 h-48 pointer-events-none opacity-[0.001] z-0 overflow-hidden"
    >
      <div ref={containerRef} id="youtube-hidden-audio-player" />
    </div>
  );
});
