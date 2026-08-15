import React, { useRef, useEffect } from 'react';
import { TimeOfDay } from '../types';

interface BackgroundVideoProps {
  timeOfDay: TimeOfDay;
}

const DAY_VIDEO_URL = 'https://ik.imagekit.io/8ja4doxcww/CFS_Vid_00003.mp4?updatedAt=1786807598064';
const NIGHT_VIDEO_URL = 'https://ik.imagekit.io/8ja4doxcww/CFS_Vid_00002.mp4?updatedAt=1786807598943';

export const BackgroundVideo: React.FC<BackgroundVideoProps> = React.memo(({ timeOfDay }) => {
  const dayVideoRef = useRef<HTMLVideoElement | null>(null);
  const nightVideoRef = useRef<HTMLVideoElement | null>(null);

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
  }, [timeOfDay]);

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
          ref={dayVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover select-none scale-105"
        >
          <source src={DAY_VIDEO_URL} type="video/mp4" />
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
          ref={nightVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover select-none scale-105"
        >
          <source src={NIGHT_VIDEO_URL} type="video/mp4" />
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

