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
    <div className="liquid-glass-pill rounded-xl sm:rounded-2xl px-1.5 xs:px-2.5 sm:px-3 h-7 sm:h-9 text-white shadow-xl flex items-center gap-1 xs:gap-1.5 sm:gap-2 transition-all select-none group shrink-0">
      <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-amber-300 shadow-inner group-hover:scale-105 transition-transform">
        <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
      </div>

      <div className="flex flex-col justify-center min-w-0 leading-none">
        <div className="text-[9.5px] xs:text-[11px] sm:text-xs font-bold tracking-tight text-white font-mono leading-tight whitespace-nowrap">
          {timeState.timeString || '00:00:00 AM'}
        </div>

        <div className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] text-white/75 flex items-center gap-0.5 xs:gap-1 mt-0.5 font-medium leading-none whitespace-nowrap">
          <Calendar className="w-2 h-2 text-white/60 shrink-0 hidden xs:inline" />
          <span className="truncate max-w-[70px] xs:max-w-[95px] sm:max-w-none">{timeState.dayName}, {timeState.dateMonth}</span>
        </div>
      </div>
    </div>
  );
});
