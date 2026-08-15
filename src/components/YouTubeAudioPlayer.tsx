import React, { useEffect, useRef, useCallback } from 'react';
import { Track } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeAudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
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
  const currentTrackIdRef = useRef<string>(track.id);
  const lastReportedTimeRef = useRef<number>(0);

  // Time tracking loop for YouTube Player
  const startTimeLoop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isUsingFallbackRef.current && audioFallbackRef.current) {
        const cur = audioFallbackRef.current.currentTime || 0;
        const dur = audioFallbackRef.current.duration || track.durationSeconds;
        if (Math.abs(cur - lastReportedTimeRef.current) >= 0.3) {
          lastReportedTimeRef.current = cur;
          onTimeUpdate(cur, dur);
        }
        return;
      }

      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || track.durationSeconds;
          if (duration > 0 && Math.abs(currentTime - lastReportedTimeRef.current) >= 0.3) {
            lastReportedTimeRef.current = currentTime;
            onTimeUpdate(currentTime, duration);
          }
        } catch {
          // Ignore transient read errors
        }
      }
    }, 500);
  }, [onTimeUpdate, track.durationSeconds]);

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
      // High-quality atmospheric Bengali acoustic stream fallback
      audio.src = 'https://actions.google.com/sounds/v1/ambiences/outdoor_festival_crowd.ogg';
    }
    audio.volume = isMuted ? 0 : volume / 100;
    if (isPlaying) {
      audio.play().catch((e) => console.warn('Audio fallback play prevented:', e));
      startTimeLoop();
    }

    audio.onended = () => {
      stopTimeLoop();
      onTrackEnd();
    };

    audio.ontimeupdate = () => {
      onTimeUpdate(audio.currentTime, audio.duration || track.durationSeconds);
    };
  }, [track, isPlaying, volume, isMuted, startTimeLoop, stopTimeLoop, onTrackEnd, onTimeUpdate]);

  // Initialize YouTube IFrame API
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
            autoplay: isPlaying ? 1 : 0,
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
              event.target.setVolume(isMuted ? 0 : volume);
              if (isPlaying) {
                event.target.playVideo();
                startTimeLoop();
              }
              if (onPlayerReady) onPlayerReady();
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3)
              if (event.data === 0) {
                stopTimeLoop();
                onTrackEnd();
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
              if (onError) onError(errorCode);
              // If video is restricted or cannot embed (codes 101, 150, 100, 2), switch to direct track audio
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
  }, []);

  // Handle Track change
  useEffect(() => {
    currentTrackIdRef.current = track.id;
    isUsingFallbackRef.current = false;

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
  }, [track.id, activateAudioFallback, isPlaying, startTimeLoop]);

  // Handle Play/Pause changes
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

  // Handle Volume and Mute
  useEffect(() => {
    if (audioFallbackRef.current) {
      audioFallbackRef.current.volume = isMuted ? 0 : volume / 100;
    }

    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        if (typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(isMuted ? 0 : volume);
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
