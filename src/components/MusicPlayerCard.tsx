import React, { useState, useEffect, useRef } from 'react';
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

  const mobileVolumeRef = useRef<HTMLDivElement>(null);
  const desktopVolumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileVolumeRef.current &&
        !mobileVolumeRef.current.contains(event.target as Node)
      ) {
        setIsMobileVolumeOpen(false);
      }
      if (
        desktopVolumeRef.current &&
        !desktopVolumeRef.current.contains(event.target as Node)
      ) {
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

  const progressPercent =
    playerState.duration > 0
      ? (playerState.currentTime / playerState.duration) * 100
      : 0;

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center select-none">
      {/* TOP FLOATING BUTTONS ROW */}
      <div className="flex items-center gap-2 mb-2 sm:mb-2.5 z-30">
        {/* Playlist Category Selector Pill (Opens Floating Menu) */}
        <button
          id="playlist-category-btn"
          onClick={() => setIsPlaylistMenuOpen((prev) => !prev)}
          title="Browse All Playlist Categories"
          className="backdrop-blur-md bg-black/40 hover:bg-black/60 border border-white/20 hover:border-amber-400/50 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-100 shadow-lg flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 group"
        >
          <ListFilter className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>Playlist</span>
          <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-400 transition-transform ${isPlaylistMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Active Selected Playlist Button (Opens Song Drawer) */}
        <button
          id="selected-playlist-songs-btn"
          onClick={() => setIsSongModalOpen(true)}
          title="Select Songs from this Playlist"
          className="backdrop-blur-md bg-black/40 hover:bg-black/60 border border-white/20 hover:border-amber-400/50 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-200 shadow-lg flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95 group"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[220px]">
            {currentCategory.nameEnglish} ({currentCategory.nameBengali})
          </span>
          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-stone-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
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

      {/* MAIN AUDIO PLAYER CARD */}
      <div
        id="audio-player-card"
        className="w-full backdrop-blur-xl bg-black/45 border border-white/20 rounded-2xl sm:rounded-[34px] p-2.5 sm:p-4 text-white shadow-2xl shadow-black/80 relative transition-all duration-300"
      >
        {/* Subtle Ambient Background Warmth Glow without heavy blur filter */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-orange-500/5 pointer-events-none -z-10 rounded-2xl sm:rounded-[34px] overflow-hidden"
        />

        {/* MOBILE LAYOUT (< sm screens) */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Top Row: Thumbnail + Title & Artist + Volume Button */}
          <div className="flex items-center gap-2.5">
            <div
              onClick={() => setIsSongModalOpen(true)}
              className="w-11 h-11 rounded-xl overflow-hidden border border-stone-600/70 shadow-md shrink-0 bg-stone-900 cursor-pointer active:scale-95 transition-transform"
              title="Click to select tracks"
            >
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            <div
              onClick={() => setIsSongModalOpen(true)}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <h3 className="text-xs font-bold text-white tracking-tight truncate leading-snug">
                {currentTrack.title}
              </h3>
              <p className="text-[11px] text-stone-300/85 font-medium truncate">
                {currentTrack.artist}
              </p>
            </div>

            {/* Mobile Volume Control Toggle & Popover Lever */}
            <div className="relative shrink-0" ref={mobileVolumeRef}>
              <button
                onClick={() => setIsMobileVolumeOpen((prev) => !prev)}
                title={playerState.isMuted ? 'Unmute' : 'Volume'}
                className={`p-1.5 sm:p-2 rounded-xl border backdrop-blur-md transition-all active:scale-95 flex items-center justify-center ${
                  isMobileVolumeOpen
                    ? 'bg-stone-800 text-amber-300 border-amber-400/60 shadow-lg'
                    : 'bg-black/40 text-stone-300 hover:text-white border-white/15'
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
                    initial={{ opacity: 0, scale: 0.9, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 z-[100] px-2.5 py-3 rounded-2xl bg-stone-900/95 border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col items-center gap-2.5 w-12"
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
                        onInput={(e) => onVolumeChange(parseInt((e.target as HTMLInputElement).value, 10))}
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

          {/* Progress Slider Track + Timestamps */}
          <div className="w-full">
            <input
              type="range"
              min={0}
              max={playerState.duration || 100}
              value={playerState.currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-stone-700/80 rounded-full appearance-none cursor-pointer accent-stone-300 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-stone-400 mt-0.5">
              <span>{formatDuration(playerState.currentTime)}</span>
              <span>{formatDuration(playerState.duration)}</span>
            </div>
          </div>

          {/* Bottom Row: Controls */}
          <div className="flex items-center justify-center gap-3 pt-0.5">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              title={playerState.isShuffle ? 'Shuffle On' : 'Shuffle Off'}
              className={`p-1.5 rounded-lg transition-all ${
                playerState.isShuffle
                  ? 'text-amber-300 bg-stone-800'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {/* Previous */}
            <button
              onClick={onPrevTrack}
              title="Previous Track"
              className="p-1.5 rounded-lg text-stone-300 hover:text-white active:scale-95"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              title={playerState.isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 bg-white hover:bg-stone-100 rounded-xl flex items-center justify-center text-black shadow-lg active:scale-95 transition-transform"
            >
              {playerState.isPlaying ? (
                <Pause className="w-4 h-4 fill-current text-black" />
              ) : (
                <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNextTrack}
              title="Next Track"
              className="p-1.5 rounded-lg text-stone-300 hover:text-white active:scale-95"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={onToggleRepeat}
              title={playerState.isRepeat ? 'Repeat On' : 'Repeat Off'}
              className={`p-1.5 rounded-lg transition-all ${
                playerState.isRepeat
                  ? 'text-amber-300 bg-stone-800'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* DESKTOP LAYOUT (>= sm screens) */}
        <div className="hidden sm:flex sm:flex-row items-center gap-5">
          {/* Left: Album Cover Art Thumbnail */}
          <div
            onClick={() => setIsSongModalOpen(true)}
            className="relative group shrink-0 cursor-pointer"
            title="Click to select tracks"
          >
            <div className="w-22 h-22 rounded-2xl overflow-hidden border border-stone-600/70 shadow-lg relative bg-stone-900 flex items-center justify-center">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>

          {/* Middle: Track Title, Artist, Progress Bar, Timestamp */}
          <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
            {/* Title & Artist */}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight truncate leading-tight">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-stone-300/90 font-medium truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            {/* Progress Slider Track */}
            <div className="mt-3">
              <div className="relative flex items-center group cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={playerState.duration || 100}
                  value={playerState.currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-1 bg-stone-700/80 rounded-full appearance-none cursor-pointer accent-stone-300 focus:outline-none"
                />
              </div>

              {/* Monospace Timestamp */}
              <div className="text-[11px] font-mono text-stone-400 mt-1 font-medium tracking-tight">
                {formatDuration(playerState.currentTime)} / {formatDuration(playerState.duration)}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Shuffle Button */}
            <button
              onClick={onToggleShuffle}
              title={playerState.isShuffle ? 'Shuffle On' : 'Shuffle Off'}
              className={`p-2 rounded-xl transition-all ${
                playerState.isShuffle
                  ? 'text-amber-300 bg-stone-800'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous Track */}
            <button
              onClick={onPrevTrack}
              title="Previous Track"
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/60 transition-all active:scale-95"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              title={playerState.isPlaying ? 'Pause' : 'Play'}
              className="w-12 h-12 bg-white hover:bg-stone-100 rounded-2xl flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-transform"
            >
              {playerState.isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-black" />
              ) : (
                <Play className="w-5 h-5 fill-current text-black translate-x-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={onNextTrack}
              title="Next Track"
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800/60 transition-all active:scale-95"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Repeat Track */}
            <button
              onClick={onToggleRepeat}
              title={playerState.isRepeat ? 'Repeat On' : 'Repeat Off'}
              className={`p-2 rounded-xl transition-all ${
                playerState.isRepeat
                  ? 'text-amber-300 bg-stone-800'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Desktop Volume Control Button & Floating Popover Lever */}
            <div className="relative shrink-0" ref={desktopVolumeRef}>
              <button
                onClick={() => setIsDesktopVolumeOpen((prev) => !prev)}
                title="Volume"
                className={`p-2 rounded-xl border backdrop-blur-md transition-all active:scale-95 flex items-center justify-center ${
                  isDesktopVolumeOpen
                    ? 'bg-stone-800 text-amber-300 border-amber-400/60 shadow-lg'
                    : 'bg-black/40 text-stone-300 hover:text-white border-white/15'
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
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
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
                        onInput={(e) => onVolumeChange(parseInt((e.target as HTMLInputElement).value, 10))}
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
