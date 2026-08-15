import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Music2 } from 'lucide-react';
import { PlaylistCategory, Track } from '../types';

interface SongSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: PlaylistCategory;
  currentTrackIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const SongSelectionModal: React.FC<SongSelectionModalProps> = React.memo(({
  isOpen,
  onClose,
  playlist,
  currentTrackIndex,
  isPlaying,
  onSelectTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const displayTracks = playlist.tracks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      t.artist.toLowerCase().includes(query)
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-sm sm:max-w-lg rounded-2xl sm:rounded-[28px] backdrop-blur-xl bg-black/55 border border-white/20 p-3.5 sm:p-6 text-white shadow-2xl shadow-black/95 z-10 overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[85vh] gpu-accelerated"
          >
            {/* Header: PLAYLISTS with Close button */}
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-stone-800/80">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold tracking-[0.15em] sm:tracking-[0.2em] text-stone-200 uppercase font-sans">
                  Playlists
                </h2>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-stone-800/80 text-amber-300 border border-stone-700">
                  {playlist.tracks.length} Songs
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 pointer-events-none" />
              </button>
            </div>

            {/* Tagline / Description */}
            <p className="text-[10px] sm:text-xs text-stone-400 font-medium mt-2 sm:mt-3 mb-2 leading-relaxed">
              {playlist.tagline || 'Gitabitan Puja (পূজা পর্যায়) - Authentic Rabindrasangeet Collection'}
            </p>

            {/* Quick Search */}
            <div className="mb-2 sm:mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs or artists..."
                className="w-full bg-stone-900/90 border border-stone-700/70 rounded-lg sm:rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400/60 transition-colors"
              />
            </div>

            {/* Songs List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 sm:space-y-1.5 custom-scrollbar min-h-40">
              {displayTracks.map((track, displayIdx) => {
                // Find actual global index in playlist.tracks
                const globalIndex = playlist.tracks.findIndex((t) => t.id === track.id);
                const isCurrent = globalIndex === currentTrackIndex;
                const formattedNum = (displayIdx + 1).toString().padStart(2, '0');

                return (
                  <button
                    key={track.id + displayIdx}
                    onClick={() => {
                      onSelectTrack(globalIndex >= 0 ? globalIndex : displayIdx);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl text-left transition-all duration-150 group active:scale-[0.99] ${
                      isCurrent
                        ? 'bg-stone-800/90 border border-amber-400/40 shadow-sm'
                        : 'hover:bg-stone-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      {/* Track Number: Gold if active */}
                      <span
                        className={`w-4 sm:w-5 text-[11px] sm:text-xs font-mono font-bold shrink-0 ${
                          isCurrent ? 'text-amber-400' : 'text-stone-500'
                        }`}
                      >
                        {formattedNum}
                      </span>

                      {/* Album Thumbnail */}
                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden bg-stone-900 border border-stone-700/60 shrink-0 shadow">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
                          }}
                        />
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Title & Artist */}
                      <div className="min-w-0">
                        <h4
                          className={`text-[11px] sm:text-sm font-semibold truncate leading-snug ${
                            isCurrent ? 'text-amber-300' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-stone-400 truncate mt-0.5 font-medium">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* Duration / Playing status */}
                    <div className="shrink-0 ml-2 sm:ml-3 text-right">
                      <span className="text-[10px] sm:text-xs font-mono text-stone-400 font-medium">
                        {formatDuration(track.durationSeconds)}
                      </span>
                    </div>
                  </button>
                );
              })}

              {displayTracks.length === 0 && (
                <div className="py-8 text-center text-xs text-stone-500">
                  No songs matching "{searchQuery}" found in this playlist.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
