import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  ChevronDown,
  ListFilter,
  Music2,
} from 'lucide-react';
import { Track, PlayerState, PlaylistCategory } from '../types';
import { PlaylistMenuPopover } from './PlaylistMenuPopover';
import { SongSelectionModal } from './SongSelectionModal';

interface MusicPlayerCardProps {
  playlistCategories: PlaylistCategory[];
  currentCategory: PlaylistCategory;
  tracks: Track[];
  currentTrack: Track;
  playerState: PlayerState;
  onSelectCategory: (category: PlaylistCategory) => void;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSelectTrack: (index: number) => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const MusicPlayerCard: React.FC<MusicPlayerCardProps> = React.memo(({
  playlistCategories,
  currentCategory,
  tracks,
  currentTrack,
  playerState,
  onSelectCategory,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onSelectTrack,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
}) => {
  const [isPlaylistMenuOpen, setIsPlaylistMenuOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isMobileVolumeOpen, setIsMobileVolumeOpen] = useState(false);
  const [isDesktopVolumeOpen, setIsDesktopVolumeOpen] = useState(false);

  // Local Scrubbing State for smooth, jitter-free timeline dragging
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState<number>(0);

  const mobileVolumeRef = useRef<HTMLDivElement>(null);
  const desktopVolumeRef = useRef<HTMLDivElement>(null);

  // Close volume popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (mobileVolumeRef.current && !mobileVolumeRef.current.contains(target)) {
        setIsMobileVolumeOpen(false);
      }
      if (desktopVolumeRef.current && !desktopVolumeRef.current.contains(target)) {
        setIsDesktopVolumeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Compute displayed time (uses scrubValue while dragging, else playerState.currentTime)
  const displayedCurrentTime = isScrubbing ? scrubValue : playerState.currentTime;
  const safeDuration = playerState.duration > 0 ? playerState.duration : (currentTrack.durationSeconds || 180);
  const progressPercent = Math.min(100, Math.max(0, (displayedCurrentTime / safeDuration) * 100));

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
  }, []);

  const handleSliderPointerDown = useCallback(() => {
    setIsScrubbing(true);
    setScrubValue(playerState.currentTime);
  }, [playerState.currentTime]);

  const handleSliderPointerUp = useCallback((e: React.PointerEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsScrubbing(false);
    const target = e.target as HTMLInputElement;
    const finalVal = parseFloat(target.value);
    onSeek(finalVal);
  }, [onSeek]);

  const handleNativeChangeCommit = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  }, [onSeek]);

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center select-none">
      {/* TOP FLOATING CATEGORY SELECTOR BUTTONS */}
      <div className="flex items-center gap-2 mb-2.5 z-10 relative">
        {/* Playlist Category Selector Pill */}
        <button
          id="playlist-category-btn"
          onClick={() => setIsPlaylistMenuOpen((prev) => !prev)}
          title="Browse All Playlist Categories"
          className="liquid-glass-pill rounded-xl sm:rounded-2xl px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-100 flex items-center gap-1.5 active:scale-95 group"
        >
          <ListFilter className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>Playlist</span>
          <ChevronDown
            className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${
              isPlaylistMenuOpen ? 'rotate-180 text-amber-300' : ''
            }`}
          />
        </button>

        {/* Active Selected Playlist Button (Opens Song Drawer) */}
        <button
          id="selected-playlist-songs-btn"
          onClick={() => setIsSongModalOpen(true)}
          title="Select Songs from this Playlist"
          className="liquid-glass-pill rounded-xl sm:rounded-2xl px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5 active:scale-95 group"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[220px]">
            {currentCategory.nameEnglish} ({currentCategory.nameBengali})
          </span>
          <ChevronDown className="w-3 h-3 text-stone-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
        </button>
      </div>

      {/* Floating Menu Popover for Categories */}
      <PlaylistMenuPopover
        isOpen={isPlaylistMenuOpen}
        onClose={() => setIsPlaylistMenuOpen(false)}
        categories={playlistCategories}
        activeCategoryId={currentCategory.id}
        onSelectCategory={(cat) => {
          onSelectCategory(cat);
          setIsSongModalOpen(true);
        }}
      />

      {/* Song Selection Modal */}
      <SongSelectionModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        playlist={currentCategory}
        currentTrackIndex={playerState.currentTrackIndex}
        isPlaying={playerState.isPlaying}
        onSelectTrack={onSelectTrack}
      />

      {/* MAIN AUDIO DOCK CARD */}
      <div
        id="audio-player-card"
        className={`w-full liquid-glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-white relative transition-all duration-300 ${
          isMobileVolumeOpen || isDesktopVolumeOpen ? 'z-40' : 'z-20'
        }`}
      >
        {/* Subtle Ambient Background Warmth Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-orange-500/5 pointer-events-none rounded-2xl sm:rounded-3xl overflow-hidden -z-10" />

        {/* ========================================================================= */}
        {/* MOBILE LAYOUT (< sm screens) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-2.5 sm:hidden">
          {/* Top Row: Cover Art + Info + Volume Button */}
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            <div
              onClick={() => setIsSongModalOpen(true)}
              className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-md shrink-0 bg-stone-900 cursor-pointer active:scale-95 transition-transform group"
              title="Click to browse tracks"
            >
              <img
                src={currentTrack.thumbnail || `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.dataset.failed === 'mq') {
                    img.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
                  } else {
                    img.dataset.failed = 'mq';
                    img.src = `https://img.youtube.com/vi/${currentTrack.id}/mqdefault.jpg`;
                  }
                }}
              />
              {/* Playing Animated Equalizer Badge */}
              {playerState.isPlaying && (
                <div className="absolute bottom-1 right-1 flex items-end gap-[2px] px-1 py-0.5 rounded bg-black/75 backdrop-blur-sm">
                  <span className="w-[2px] bg-amber-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2" />
                  <span className="w-[2px] bg-amber-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3" />
                  <span className="w-[2px] bg-amber-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-1.5" />
                </div>
              )}
            </div>

            {/* Title & Artist */}
            <div
              onClick={() => setIsSongModalOpen(true)}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-stone-100 tracking-tight truncate leading-tight">
                  {currentTrack.title}
                </h3>
              </div>
              <p className="text-[11px] text-stone-400 font-medium truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            {/* Mobile Volume Control Toggle & Popover */}
            <div className="relative shrink-0 z-50" ref={mobileVolumeRef}>
              <button
                onClick={() => setIsMobileVolumeOpen((prev) => !prev)}
                title={playerState.isMuted ? 'Unmute' : 'Volume'}
                className={`p-2 rounded-xl liquid-glass-pill transition-all active:scale-95 flex items-center justify-center ${
                  isMobileVolumeOpen
                    ? 'text-amber-300 border-amber-400/60 bg-amber-500/20'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-300" />
                )}
              </button>

              <AnimatePresence>
                {isMobileVolumeOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full right-0 mb-3 z-[100] px-2.5 py-3 rounded-2xl bg-stone-900/95 border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col items-center gap-2.5 w-12"
                  >
                    {/* Top: Percentage Badge */}
                    <span className="text-[11px] font-mono text-amber-300 font-bold select-none leading-none">
                      {playerState.isMuted ? '0%' : `${playerState.volume}%`}
                    </span>

                    {/* Middle: Vertical Volume Slider */}
                    <div className="relative h-24 w-6 flex items-center justify-center">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={playerState.isMuted ? 0 : playerState.volume}
                        onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
                        style={{
                          background: `linear-gradient(to right, #f59e0b ${playerState.isMuted ? 0 : playerState.volume}%, #44403c ${playerState.isMuted ? 0 : playerState.volume}%)`,
                        }}
                        className="w-24 h-1.5 rounded-full appearance-none cursor-pointer accent-amber-400 focus:outline-none -rotate-90 origin-center shadow-inner"
                      />
                    </div>

                    {/* Bottom: Quick Mute Button */}
                    <button
                      onClick={onToggleMute}
                      title={playerState.isMuted ? 'Unmute' : 'Mute'}
                      className="p-1 rounded-lg text-stone-300 hover:text-white transition-colors active:scale-95 shrink-0"
                    >
                      {playerState.isMuted || playerState.volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive Progress Slider Track + Timestamps */}
          <div className="w-full">
            <div className="relative h-3 flex items-center group cursor-pointer">
              {/* Custom Track Background */}
              <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-[width] duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Native Input Layer on top for effortless touch seeking */}
              <input
                type="range"
                min={0}
                max={safeDuration}
                step={0.5}
                value={displayedCurrentTime}
                onChange={handleSliderChange}
                onPointerDown={handleSliderPointerDown}
                onPointerUp={handleSliderPointerUp}
                onTouchStart={handleSliderPointerDown}
                onTouchEnd={handleSliderPointerUp}
                onMouseUp={handleSliderPointerUp}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-stone-400 mt-0.5">
              <span>{formatDuration(displayedCurrentTime)}</span>
              <span>{formatDuration(safeDuration)}</span>
            </div>
          </div>

          {/* Controls Deck */}
          <div className="flex items-center justify-between px-2 pt-0.5">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              title={playerState.isShuffle ? 'Shuffle On' : 'Shuffle Off'}
              className={`p-2 rounded-xl liquid-glass-pill transition-all active:scale-95 ${
                playerState.isShuffle
                  ? 'text-amber-300 border-amber-400/60 bg-amber-500/20'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={onPrevTrack}
              title="Previous Track"
              className="p-2 rounded-xl liquid-glass-pill text-stone-300 hover:text-amber-300 active:scale-90 transition-all"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play / Pause Liquid Glass Button */}
            <button
              onClick={onTogglePlay}
              title={playerState.isPlaying ? 'Pause' : 'Play'}
              className="w-11 h-11 liquid-glass-pill rounded-full flex items-center justify-center text-amber-300 hover:text-amber-200 border border-amber-400/50 shadow-[0_4px_20px_rgba(245,158,11,0.25)] active:scale-95 transition-all"
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 fill-amber-300 text-amber-300" />
              ) : (
                <Play className="w-5 h-5 fill-amber-300 text-amber-300 translate-x-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNextTrack}
              title="Next Track"
              className="p-2 rounded-xl liquid-glass-pill text-stone-300 hover:text-amber-300 active:scale-90 transition-all"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={onToggleRepeat}
              title={playerState.isRepeat ? 'Repeat On' : 'Repeat Off'}
              className={`p-2 rounded-xl liquid-glass-pill transition-all active:scale-95 ${
                playerState.isRepeat
                  ? 'text-amber-300 border-amber-400/60 bg-amber-500/20'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP LAYOUT (>= sm screens) */}
        {/* ========================================================================= */}
        <div className="hidden sm:flex sm:flex-row items-center gap-4 md:gap-5">
          {/* Left: Album Art */}
          <div
            onClick={() => setIsSongModalOpen(true)}
            className="relative group shrink-0 cursor-pointer"
            title="Click to browse tracks"
          >
            <div className="w-20 h-20 md:w-22 md:h-22 rounded-2xl overflow-hidden border border-white/20 shadow-lg relative bg-stone-900 flex items-center justify-center">
              <img
                src={currentTrack.thumbnail || `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.dataset.failed === 'mq') {
                    img.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
                  } else {
                    img.dataset.failed = 'mq';
                    img.src = `https://img.youtube.com/vi/${currentTrack.id}/mqdefault.jpg`;
                  }
                }}
              />
              {/* Playing Animated Equalizer Badge */}
              {playerState.isPlaying && (
                <div className="absolute bottom-1.5 right-1.5 flex items-end gap-[2px] px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm">
                  <span className="w-[2.5px] bg-amber-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2.5" />
                  <span className="w-[2.5px] bg-amber-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-4" />
                  <span className="w-[2.5px] bg-amber-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-2" />
                </div>
              )}
            </div>
          </div>

          {/* Middle: Title, Artist, Timeline Scrubber Bar, Timestamps */}
          <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
            {/* Title & Artist & Category Tag */}
            <div
              onClick={() => setIsSongModalOpen(true)}
              className="cursor-pointer min-w-0 group"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-stone-100 tracking-tight truncate leading-tight group-hover:text-amber-300 transition-colors">
                  {currentTrack.title}
                </h3>
              </div>
              <p className="text-xs text-stone-400 font-medium truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            {/* Interactive Timeline Progress Scrubber */}
            <div className="mt-2.5">
              <div className="relative h-4 flex items-center group cursor-pointer">
                {/* Track background */}
                <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden relative group-hover:h-2 transition-all">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-[width] duration-75"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Glowing Thumb Indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ left: `${progressPercent}%` }}
                />

                {/* Full-width transparent input layer for accurate mouse and touch seek */}
                <input
                  type="range"
                  min={0}
                  max={safeDuration}
                  step={0.5}
                  value={displayedCurrentTime}
                  onChange={handleSliderChange}
                  onPointerDown={handleSliderPointerDown}
                  onPointerUp={handleSliderPointerUp}
                  onTouchStart={handleSliderPointerDown}
                  onTouchEnd={handleSliderPointerUp}
                  onMouseUp={handleSliderPointerUp}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>

              {/* Timestamp Row */}
              <div className="flex justify-between text-[11px] font-mono text-stone-400 font-medium tracking-tight mt-0.5">
                <span>{formatDuration(displayedCurrentTime)}</span>
                <span>{formatDuration(safeDuration)}</span>
              </div>
            </div>
          </div>

          {/* Right: Controls Deck */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Shuffle Button */}
            <button
              onClick={onToggleShuffle}
              title={playerState.isShuffle ? 'Shuffle On' : 'Shuffle Off'}
              className={`p-2.5 rounded-xl liquid-glass-pill transition-all active:scale-95 ${
                playerState.isShuffle
                  ? 'text-amber-300 border-amber-400/60 bg-amber-500/20'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous Track */}
            <button
              onClick={onPrevTrack}
              title="Previous Track"
              className="p-2.5 rounded-xl liquid-glass-pill text-stone-300 hover:text-amber-300 transition-all active:scale-95"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play / Pause Liquid Glass Button */}
            <button
              onClick={onTogglePlay}
              title={playerState.isPlaying ? 'Pause' : 'Play'}
              className="w-12 h-12 liquid-glass-pill rounded-full flex items-center justify-center text-amber-300 hover:text-amber-200 border border-amber-400/50 shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95 transition-all"
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 fill-amber-300 text-amber-300" />
              ) : (
                <Play className="w-5 h-5 fill-amber-300 text-amber-300 translate-x-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={onNextTrack}
              title="Next Track"
              className="p-2.5 rounded-xl liquid-glass-pill text-stone-300 hover:text-amber-300 transition-all active:scale-95"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Repeat Track */}
            <button
              onClick={onToggleRepeat}
              title={playerState.isRepeat ? 'Repeat On' : 'Repeat Off'}
              className={`p-2.5 rounded-xl liquid-glass-pill transition-all active:scale-95 ${
                playerState.isRepeat
                  ? 'text-amber-300 border-amber-400/60 bg-amber-500/20'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Desktop Volume Control Button & Popover */}
            <div className="relative shrink-0 z-50" ref={desktopVolumeRef}>
              <button
                onClick={() => setIsDesktopVolumeOpen((prev) => !prev)}
                title="Volume"
                className={`p-2.5 rounded-xl liquid-glass-pill transition-all active:scale-95 flex items-center justify-center ${
                  isDesktopVolumeOpen
                    ? 'text-amber-300 border-amber-400/60 bg-amber-500/20'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-300" />
                )}
              </button>

              <AnimatePresence>
                {isDesktopVolumeOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] px-2.5 py-3 rounded-2xl bg-stone-900/95 border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col items-center gap-2.5 w-12"
                  >
                    {/* Top: Percentage Badge */}
                    <span className="text-[11px] font-mono text-amber-300 font-bold select-none leading-none">
                      {playerState.isMuted ? '0%' : `${playerState.volume}%`}
                    </span>

                    {/* Middle: Vertical Volume Slider */}
                    <div className="relative h-24 w-6 flex items-center justify-center">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={playerState.isMuted ? 0 : playerState.volume}
                        onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
                        style={{
                          background: `linear-gradient(to right, #f59e0b ${playerState.isMuted ? 0 : playerState.volume}%, #44403c ${playerState.isMuted ? 0 : playerState.volume}%)`,
                        }}
                        className="w-24 h-1.5 rounded-full appearance-none cursor-pointer accent-amber-400 focus:outline-none -rotate-90 origin-center shadow-inner"
                      />
                    </div>

                    {/* Bottom: Quick Mute Button */}
                    <button
                      onClick={onToggleMute}
                      title={playerState.isMuted ? 'Unmute' : 'Mute'}
                      className="p-1 rounded-lg text-stone-300 hover:text-white transition-colors active:scale-95 shrink-0"
                    >
                      {playerState.isMuted || playerState.volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
