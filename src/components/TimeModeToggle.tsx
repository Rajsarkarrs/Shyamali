import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { TimeOfDay, TimeMode } from '../types';

interface TimeModeToggleProps {
  mode: TimeMode;
  effectiveTimeOfDay: TimeOfDay;
  onModeChange: (newMode: TimeMode) => void;
}

export const TimeModeToggle: React.FC<TimeModeToggleProps> = React.memo(({
  mode,
  effectiveTimeOfDay,
  onModeChange,
}) => {
  return (
    <div
      id="time-mode-toggle"
      className="liquid-glass-pill rounded-xl sm:rounded-2xl p-0.5 xs:px-1 sm:px-1.5 h-7 sm:h-9 text-white flex items-center gap-0.5 xs:gap-1 select-none shrink-0"
    >
      {/* Auto Mode: 'A' */}
      <button
        onClick={() => onModeChange('auto')}
        title="Auto Mode (6 AM - 6 PM: Day, 6 PM - 6 AM: Night)"
        className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg text-[10px] xs:text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
          mode === 'auto'
            ? 'bg-white/25 text-amber-300 shadow-md border border-white/30 ring-1 ring-white/20'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        <span>A</span>
      </button>

      {/* Sun / Day Mode */}
      <button
        onClick={() => onModeChange('day')}
        title="Day Mode (Sun)"
        className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center transition-all ${
          mode === 'day'
            ? 'bg-amber-500/80 text-white shadow-md border border-amber-300/40 ring-1 ring-amber-400/50'
            : effectiveTimeOfDay === 'day' && mode === 'auto'
            ? 'bg-amber-500/30 text-amber-200'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        <span className="text-[10px] xs:text-xs sm:text-sm leading-none" role="img" aria-label="Sun">
          ☀️
        </span>
      </button>

      {/* Moon / Night Mode */}
      <button
        onClick={() => onModeChange('night')}
        title="Night Mode (Moon)"
        className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center transition-all ${
          mode === 'night'
            ? 'bg-indigo-600/80 text-white shadow-md border border-indigo-300/40 ring-1 ring-indigo-400/50'
            : effectiveTimeOfDay === 'night' && mode === 'auto'
            ? 'bg-indigo-600/30 text-indigo-200'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        <span className="text-[10px] xs:text-xs sm:text-sm leading-none" role="img" aria-label="Moon">
          🌙
        </span>
      </button>
    </div>
  );
});

