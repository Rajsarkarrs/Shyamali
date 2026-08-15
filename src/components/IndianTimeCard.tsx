import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

// Instantiate formatters once outside component to prevent GC pauses on low-end CPUs
const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const dayFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'long',
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const hourFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  hour12: false,
});

export const IndianTimeCard: React.FC = React.memo(() => {
  const [timeState, setTimeState] = useState<{
    timeString: string;
    dayName: string;
    dateMonth: string;
    isDaytimeIST: boolean;
  }>(() => {
    const now = new Date();
    const currentHourIST = parseInt(hourFormatter.format(now), 10);
    return {
      timeString: timeFormatter.format(now),
      dayName: dayFormatter.format(now),
      dateMonth: dateFormatter.format(now),
      isDaytimeIST: currentHourIST >= 6 && currentHourIST < 18,
    };
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const currentHourIST = parseInt(hourFormatter.format(now), 10);
      const isDaytimeIST = currentHourIST >= 6 && currentHourIST < 18;

      setTimeState({
        timeString: timeFormatter.format(now),
        dayName: dayFormatter.format(now),
        dateMonth: dateFormatter.format(now),
        isDaytimeIST,
      });
    };

    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="backdrop-blur-md bg-black/35 border border-white/20 rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 text-white shadow-xl flex items-center gap-1.5 sm:gap-2.5 hover:bg-black/45 transition-all select-none group">
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-amber-300 shadow-inner group-hover:scale-105 transition-transform">
        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
      </div>

      <div className="flex flex-col min-w-0">
        <div className="text-[11px] sm:text-sm font-bold tracking-tight text-white font-mono leading-tight">
          {timeState.timeString || '00:00:00 AM'}
        </div>

        <div className="text-[9px] sm:text-[11px] text-white/75 flex items-center gap-1 mt-0.5 font-medium leading-none">
          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/60 shrink-0 hidden xs:inline" />
          <span className="truncate max-w-[100px] sm:max-w-none">{timeState.dayName}, {timeState.dateMonth}</span>
        </div>
      </div>
    </div>
  );
});
