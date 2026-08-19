import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListMusic, Check, Lock, X } from 'lucide-react';
import { PlaylistCategory } from '../types';

interface PlaylistMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  categories: PlaylistCategory[];
  activeCategoryId: string;
  onSelectCategory: (category: PlaylistCategory) => void;
}

export const PlaylistMenuPopover: React.FC<PlaylistMenuPopoverProps> = React.memo(({
  isOpen,
  onClose,
  categories,
  activeCategoryId,
  onSelectCategory,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Centered Playlist Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-[28px] liquid-glass-card p-4 sm:p-5 text-white z-10 overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[85vh] shadow-2xl gpu-accelerated"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-stone-800/80 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  <ListMusic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-100 uppercase tracking-wider font-sans">
                    Select Playlist
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-stone-400">
                    Bengali atmospheric & festive audio streams
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-800/80 text-amber-300 border border-stone-700">
                  {categories.length} Collections
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
            </div>

            {/* Category List */}
            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              {categories.map((cat) => {
                const isActive = cat.id === activeCategoryId;
                const isAvailable = cat.available;

                return (
                  <button
                    key={cat.id}
                    disabled={!isAvailable}
                    onClick={() => {
                      if (isAvailable) {
                        onSelectCategory(cat);
                        onClose();
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all duration-150 active:scale-[0.99] ${
                      isActive
                        ? 'bg-amber-500/25 border border-amber-400/50 shadow-sm text-white'
                        : isAvailable
                        ? 'hover:bg-stone-800/70 border border-transparent text-stone-200'
                        : 'opacity-50 cursor-not-allowed bg-stone-900/30 border border-transparent text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-mono transition-colors ${
                          isActive
                            ? 'bg-amber-400 text-black'
                            : isAvailable
                            ? 'bg-stone-800 text-stone-300 border border-stone-700'
                            : 'bg-stone-900 text-stone-600'
                        }`}
                      >
                        {cat.nameEnglish.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-semibold tracking-wide truncate">
                            {cat.nameEnglish}
                          </span>
                          <span className="text-[11px] sm:text-xs text-amber-200/90 font-medium">
                            ({cat.nameBengali})
                          </span>
                        </div>
                        {cat.tagline && (
                          <p className="text-[9px] sm:text-[10px] text-stone-400 truncate mt-0.5">
                            {cat.tagline}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isActive ? (
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>Active</span>
                        </span>
                      ) : isAvailable ? (
                        <span className="text-[9px] sm:text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {cat.tracks.length} Songs
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[8px] sm:text-[9px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800">
                          <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          <span>Coming Soon</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
