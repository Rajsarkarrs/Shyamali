import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListMusic, Check, Lock } from 'lucide-react';
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
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Floating Menu Popover */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 z-50 w-[calc(100vw-28px)] max-w-xs sm:max-w-sm sm:w-96 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-black/55 border border-white/20 p-3 sm:p-4 text-white shadow-2xl shadow-black/90 overflow-hidden gpu-accelerated"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-stone-800/80 mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <ListMusic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-100 uppercase tracking-wider">
                    Select Playlist
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-stone-400">
                    Bengali atmospheric & festive audio streams
                  </p>
                </div>
              </div>

              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                {categories.length} Collections
              </span>
            </div>

            {/* Category List */}
            <div className="space-y-1 sm:space-y-1.5 max-h-64 sm:max-h-72 overflow-y-auto pr-1 custom-scrollbar">
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
                    className={`w-full flex items-center justify-between p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl text-left transition-all duration-150 active:scale-[0.99] ${
                      isActive
                        ? 'bg-amber-500/25 border border-amber-400/50 shadow-sm text-white'
                        : isAvailable
                        ? 'hover:bg-stone-800/70 border border-transparent text-stone-200'
                        : 'opacity-50 cursor-not-allowed bg-stone-900/30 border border-transparent text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <span className="text-[11px] sm:text-sm font-semibold tracking-wide truncate">
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

                    <div className="shrink-0 ml-1.5 sm:ml-2">
                      {isActive ? (
                        <span className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-bold text-amber-300 bg-amber-400/20 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-400/30">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>Active</span>
                        </span>
                      ) : isAvailable ? (
                        <span className="text-[9px] sm:text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {cat.tracks.length} Songs
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] text-stone-400 bg-stone-900 px-1.5 sm:px-2 py-0.5 rounded-full border border-stone-800">
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
        </>
      )}
    </AnimatePresence>
  );
});
