import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BackgroundVideo } from './components/BackgroundVideo';
import { IndianTimeCard } from './components/IndianTimeCard';
import { TimeModeToggle } from './components/TimeModeToggle';
import { LiveVisitorsCard } from './components/LiveVisitorsCard';
import { MusicPlayerCard } from './components/MusicPlayerCard';
import { YouTubeAudioPlayer, SeekRequest } from './components/YouTubeAudioPlayer';
import { ItiModal } from './components/ItiModal';
import { TimeOfDay, TimeMode, PlayerState, Track, PlaylistCategory } from './types';
import { PLAYLIST_CATEGORIES } from './data/playlist';

export default function App() {
  // Mode selection: 'auto' | 'day' | 'night'
  const [mode, setMode] = useState<TimeMode>('auto');
  
  // Track whether the current time is daytime (6:00 AM to 6:00 PM)
  const [isDaytime, setIsDaytime] = useState<boolean>(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 6 && currentHour < 18;
  });

  // Periodically check time to ensure seamless transition at 6 AM & 6 PM
  useEffect(() => {
    const checkDayNight = () => {
      const currentHour = new Date().getHours();
      setIsDaytime(currentHour >= 6 && currentHour < 18);
    };

    checkDayNight();
    const timer = setInterval(checkDayNight, 10000);
    return () => clearInterval(timer);
  }, []);

  // Determine effective background video & theme (Day: 6 AM to 6 PM, Night: 6 PM to 6 AM)
  const effectiveTimeOfDay: TimeOfDay =
    mode === 'auto'
      ? isDaytime
        ? 'day'
        : 'night'
      : mode;

  // Playlist & Music Player State
  const [playlistCategories] = useState<PlaylistCategory[]>(PLAYLIST_CATEGORIES);
  const [currentCategory, setCurrentCategory] = useState<PlaylistCategory>(PLAYLIST_CATEGORIES[0]);
  const [isItiModalOpen, setIsItiModalOpen] = useState<boolean>(false);
  const [seekRequest, setSeekRequest] = useState<SeekRequest | null>(null);
  const [hasMusicStarted, setHasMusicStarted] = useState<boolean>(false);
  const tracks = currentCategory.tracks.length > 0 ? currentCategory.tracks : PLAYLIST_CATEGORIES[0].tracks;

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTrackIndex: 0,
    currentTime: 0,
    duration: tracks[0]?.durationSeconds || 180,
    volume: 80,
    isMuted: false,
    isShuffle: false,
    isRepeat: false,
  });

  // Track when music starts playing for the first time
  useEffect(() => {
    if (playerState.isPlaying && !hasMusicStarted) {
      setHasMusicStarted(true);
    }
  }, [playerState.isPlaying, hasMusicStarted]);

  const currentTrack = tracks[playerState.currentTrackIndex] || tracks[0];

  // Category Selection
  const handleSelectCategory = useCallback((category: PlaylistCategory) => {
    setCurrentCategory(category);
    if (category.tracks.length > 0) {
      setPlayerState((prev) => ({
        ...prev,
        currentTrackIndex: 0,
        currentTime: 0,
        isPlaying: true,
        duration: category.tracks[0]?.durationSeconds || 180,
      }));
    }
  }, []);

  // Playback Handlers
  const handleTogglePlay = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleNextTrack = useCallback(() => {
    setPlayerState((prev) => {
      if (prev.isShuffle) {
        const nextIdx = Math.floor(Math.random() * tracks.length);
        return { ...prev, currentTrackIndex: nextIdx, currentTime: 0 };
      }
      const nextIdx = (prev.currentTrackIndex + 1) % tracks.length;
      return { ...prev, currentTrackIndex: nextIdx, currentTime: 0 };
    });
  }, [tracks.length]);

  const handlePrevTrack = useCallback(() => {
    setPlayerState((prev) => {
      const prevIdx = (prev.currentTrackIndex - 1 + tracks.length) % tracks.length;
      return { ...prev, currentTrackIndex: prevIdx, currentTime: 0 };
    });
  }, [tracks.length]);

  const handleSelectTrack = useCallback((index: number) => {
    setPlayerState((prev) => ({
      ...prev,
      currentTrackIndex: index,
      isPlaying: true,
      currentTime: 0,
    }));
  }, []);

  const handleSeek = useCallback((time: number) => {
    setPlayerState((prev) => ({ ...prev, currentTime: time }));
    setSeekRequest({ time, id: Date.now() + Math.random() });
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    setPlayerState((prev) => ({ ...prev, volume: vol, isMuted: vol === 0 }));
  }, []);

  const handleToggleMute = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const handleToggleRepeat = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isRepeat: !prev.isRepeat }));
  }, []);

  const handleTrackEnd = useCallback(() => {
    if (playerState.isRepeat) {
      setPlayerState((prev) => ({ ...prev, currentTime: 0, isPlaying: true }));
    } else {
      handleNextTrack();
    }
  }, [playerState.isRepeat, handleNextTrack]);

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    setPlayerState((prev) => ({
      ...prev,
      currentTime,
      duration: duration > 0 ? duration : prev.duration,
    }));
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-3 sm:p-6 md:p-8 font-sans overflow-x-hidden antialiased select-none text-white">
      {/* Dynamic Background Video (Idle state before play vs Playlist background) */}
      <BackgroundVideo
        timeOfDay={effectiveTimeOfDay}
        categoryId={currentCategory.id}
        isIdle={!hasMusicStarted}
      />

      {/* Hidden YouTube & Audio Engine (No video frame rendered) */}
      <YouTubeAudioPlayer
        track={currentTrack}
        isPlaying={playerState.isPlaying}
        volume={playerState.volume}
        isMuted={playerState.isMuted}
        seekRequest={seekRequest}
        onTrackEnd={handleTrackEnd}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* TOP HEADER NAVIGATION ROW */}
      <header className="w-full flex items-center justify-between gap-1.5 sm:gap-4 z-20">
        {/* Top Left: Indian Time Glass Card */}
        <div className="flex justify-start shrink-0">
          <IndianTimeCard />
        </div>

        {/* Top Middle: Live Realtime Visitors Count Glass Card */}
        <div className="flex justify-center shrink-0">
          <LiveVisitorsCard />
        </div>

        {/* Top Right: Time Mode Switcher & Round Glass Iti Button */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
          <TimeModeToggle
            mode={mode}
            effectiveTimeOfDay={effectiveTimeOfDay}
            onModeChange={setMode}
          />

          <button
            id="iti-glass-trigger-btn"
            onClick={() => setIsItiModalOpen(true)}
            className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl sm:rounded-2xl liquid-glass-pill flex items-center justify-center text-yellow-300 font-bengali-handwritten text-sm sm:text-lg transition-all duration-300 active:scale-95 group cursor-pointer shrink-0"
            title="ইতি - Credits & Notes"
            aria-label="ইতি"
          >
            <span className="drop-shadow-[0_2px_8px_rgba(253,224,71,0.5)] group-hover:scale-105 transition-transform duration-300">
              ইতি
            </span>
          </button>
        </div>
      </header>

      {/* CENTER HERO SECTION: Animated Bengali Handwritten Title & Dynamic Playlist Subtext */}
      <main className="my-auto flex-1 w-full flex flex-col items-center justify-center text-center z-10 py-3 sm:py-6 px-2 sm:px-4 pointer-events-none select-none">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center space-y-0.5 sm:space-y-2"
        >
          {/* Main Title in Big Yellow Bengali Handwritten Typography */}
          <h1
            id="main-bengali-title"
            className="font-bengali-handwritten text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-yellow-300 font-normal tracking-wider leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] filter"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 25px rgba(253,224,71,0.3)',
            }}
          >
            রবীন্দ্র সঙ্গীত
          </h1>

          {/* Subtext in Small White Bengali Handwritten Typography that changes with current playlist */}
          <div className="h-7 sm:h-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentCategory.id}
                id="playlist-subtext"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="font-bengali-handwritten text-base sm:text-2xl md:text-3xl text-white font-normal tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
                style={{
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                }}
              >
                {currentCategory.nameBengali}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* BOTTOM FOOTER / MUSIC PLAYER SECTION */}
      <footer className="w-full flex flex-col items-center z-20 mt-auto pt-2">
        <MusicPlayerCard
          playlistCategories={playlistCategories}
          currentCategory={currentCategory}
          tracks={tracks}
          currentTrack={currentTrack}
          playerState={playerState}
          onSelectCategory={handleSelectCategory}
          onTogglePlay={handleTogglePlay}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          onSelectTrack={handleSelectTrack}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleShuffle={handleToggleShuffle}
          onToggleRepeat={handleToggleRepeat}
        />

        {/* Footer Attribution */}
        <div className="mt-1.5 sm:mt-2.5 text-[10px] sm:text-xs text-white/60 tracking-wider font-medium drop-shadow-sm flex items-center justify-center gap-1.5 flex-wrap">
          <span>Shyamali</span>
          <span className="text-white/30">|</span>
          <span>রবীন্দ্র সঙ্গীত Collection</span>
          <span className="text-white/30">|</span>
          <span>CareFrame Studios</span>
        </div>

        {/* Disclaimer */}
        <p className="mt-1 mb-0.5 text-[9px] sm:text-[10px] text-white/40 tracking-normal text-center max-w-sm sm:max-w-none sm:whitespace-nowrap px-4 leading-tight">
          Disclaimer: Audio sourced from YouTube. We do not claim ownership; all rights belong to their respective copyright holders.
        </p>
      </footer>

      {/* Iti Popup Modal */}
      <ItiModal
        isOpen={isItiModalOpen}
        onClose={() => setIsItiModalOpen(false)}
      />
    </div>
  );
}

