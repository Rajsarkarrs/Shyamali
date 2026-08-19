import React, { useRef, useEffect } from 'react';
import { TimeOfDay } from '../types';

interface BackgroundVideoProps {
  timeOfDay: TimeOfDay;
  categoryId?: string;
}

export const PLAYLIST_BACKGROUNDS: Record<string, { day: string; night: string }> = {
  puja: {
    day: 'https://ik.imagekit.io/8ja4doxcww/CFS_Vid_00003.mp4?updatedAt=1786807598064',
    night: 'https://ik.imagekit.io/8ja4doxcww/CFS_Vid_00002.mp4?updatedAt=1786807598943',
  },
  swadeshi: {
    day: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786844742/CFS_Vid_00004_uh4noi.mp4',
    night: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786844740/CFS_Vid_00005_dqtaxn.mp4',
  },
  love: {
    day: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786995738/CFS_Vid_00006_Prem_Day_Time_uubnth.mp4',
    night: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786995733/CFS_Vid_00006_Prem_Night_Time_shfqkg.mp4',
  },
  nature: {
    day: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786995733/CFS_Vid_00006_Prokriti_Day_Time_caaj6f.mp4',
    night: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786995732/CFS_Vid_00006_Prokriti_Day_Time-1_wy2kpz.mp4',
  },
  festival: {
    day: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786995735/CFS_Vid_00006_Anusthanik_Day_Time_e7ygtx.mp4',
    night: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786995731/CFS_Vid_00006_Anusthanik_Night_Time_wuudqz.mp4',
  },
  play: {
    day: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786995732/CFS_Vid_00006_Bichitra_Day_Time_jgirya.mp4',
    night: 'https://res.cloudinary.com/dcn8swiqz/video/upload/v1786995737/CFS_Vid_00006_Bichitra_Night_Time_pam3lu.mp4',
  },
};

const DEFAULT_BACKGROUNDS = PLAYLIST_BACKGROUNDS.puja;

export const BackgroundVideo: React.FC<BackgroundVideoProps> = React.memo(({ timeOfDay, categoryId = 'puja' }) => {
  const dayVideoRef = useRef<HTMLVideoElement | null>(null);
  const nightVideoRef = useRef<HTMLVideoElement | null>(null);

  const bgConfig = PLAYLIST_BACKGROUNDS[categoryId] || DEFAULT_BACKGROUNDS;
  const dayUrl = bgConfig.day;
  const nightUrl = bgConfig.night;

  // Manage playback to conserve battery/GPU resources on mobile devices
  useEffect(() => {
    if (timeOfDay === 'day') {
      dayVideoRef.current?.play().catch(() => {});
      // Pause inactive video slightly after fade completes to save CPU/GPU cycles
      const timer = setTimeout(() => {
        nightVideoRef.current?.pause();
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      nightVideoRef.current?.play().catch(() => {});
      const timer = setTimeout(() => {
        dayVideoRef.current?.pause();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [timeOfDay, dayUrl, nightUrl]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20 bg-slate-950 translate-z-0">
      {/* Dark Ambient Fallback Background when video loading or offline */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${
          timeOfDay === 'day'
            ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-900/30'
            : 'bg-gradient-to-br from-indigo-950/60 via-slate-950 to-purple-950/40'
        }`}
      />

      {/* Day Video Layer */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out will-change-[opacity] ${
          timeOfDay === 'day' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: 'translate3d(0, 0, 0)' }}
      >
        <video
          key={`day-${dayUrl}`}
          ref={dayVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover select-none scale-105"
        >
          <source src={dayUrl} type="video/mp4" />
        </video>
      </div>

      {/* Night Video Layer */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out will-change-[opacity] ${
          timeOfDay === 'night' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: 'translate3d(0, 0, 0)' }}
      >
        <video
          key={`night-${nightUrl}`}
          ref={nightVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover select-none scale-105"
        >
          <source src={nightUrl} type="video/mp4" />
        </video>
      </div>

      {/* Atmospheric Vignette & Soft Gradient Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${
          timeOfDay === 'day' 
            ? 'bg-gradient-to-b from-black/30 via-transparent to-black/50' 
            : 'bg-gradient-to-b from-black/50 via-black/20 to-black/70'
        }`}
      />
    </div>
  );
});

