import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Linkedin, Instagram, Mail, MessageSquareText, ExternalLink } from 'lucide-react';

interface ItiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItiModal: React.FC<ItiModalProps> = React.memo(({ isOpen, onClose }) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Main Glass Card Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-sm sm:max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar backdrop-blur-xl bg-black/55 border border-white/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] text-white flex flex-col gpu-accelerated"
          >
            {/* Top Close Button (X) */}
            <button
              id="iti-modal-close-btn"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-2.5 right-2.5 sm:top-5 sm:right-5 z-30 p-1.5 sm:p-2.5 rounded-xl text-stone-300 hover:text-white bg-stone-900/80 hover:bg-stone-800 border border-stone-600/70 hover:border-stone-400 transition-all duration-200 cursor-pointer shadow-lg active:scale-95"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none" />
            </button>

            {/* Modal Title: ইতি */}
            <div className="text-center mb-2.5 sm:mb-6">
              <h2
                id="iti-modal-title"
                className="font-bengali-handwritten text-2xl sm:text-5xl text-yellow-300 tracking-wider leading-none drop-shadow-[0_2px_12px_rgba(253,224,71,0.35)]"
              >
                ইতি
              </h2>
            </div>

            {/* 2 Square Glass Cards Side-by-Side (2 columns on mobile & desktop) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-6 mb-2.5 sm:mb-6">
              {/* Card 1: Akash Ghosh */}
              <div className="backdrop-blur-md bg-black/40 border border-white/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-between text-center hover:border-amber-400/50 transition-all duration-300 shadow-lg group">
                {/* Profile Photo inside Rounded Frame */}
                <div className="relative w-14 h-14 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 bg-gradient-to-tr from-amber-500/40 via-stone-700 to-amber-300/40 shadow-inner mb-1.5 sm:mb-3.5">
                  <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden border border-stone-800 sm:border-2 bg-stone-950">
                    <img
                      src="https://res.cloudinary.com/dcn8swiqz/image/upload/v1785936625/1785936218267_ulbtsm.jpg"
                      alt="Akash Ghosh"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-xs sm:text-lg font-semibold text-stone-100 tracking-tight sm:tracking-wide mb-1.5 sm:mb-3">
                  Akash Ghosh
                </h3>

                {/* Social Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 mt-auto">
                  <a
                    href="https://www.linkedin.com/in/akash-ghosh-profile-view?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/50 hover:bg-[#0A66C2] text-stone-300 hover:text-white border border-white/20 hover:border-transparent transition-all duration-200 flex items-center justify-center shadow-md active:scale-95"
                    aria-label="Akash Ghosh LinkedIn"
                  >
                    <Linkedin className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>

                  <a
                    href="https://www.instagram.com/mr.photographerakash?igsh=MW42d2tmZTh6a2drdA%3D%3D&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/50 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-stone-300 hover:text-white border border-white/20 hover:border-transparent transition-all duration-200 flex items-center justify-center shadow-md active:scale-95"
                    aria-label="Akash Ghosh Instagram"
                  >
                    <Instagram className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </div>

              {/* Card 2: Shubhranshu Sarkar */}
              <div className="backdrop-blur-md bg-black/40 border border-white/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-between text-center hover:border-amber-400/50 transition-all duration-300 shadow-lg group">
                {/* Profile Photo inside Rounded Frame */}
                <div className="relative w-14 h-14 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 bg-gradient-to-tr from-amber-500/40 via-stone-700 to-amber-300/40 shadow-inner mb-1.5 sm:mb-3.5">
                  <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden border border-stone-800 sm:border-2 bg-stone-950">
                    <img
                      src="https://res.cloudinary.com/dcn8swiqz/image/upload/v1786817975/shonku.jpg"
                      alt="Shubhranshu Sarkar"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-xs sm:text-lg font-semibold text-stone-100 tracking-tight sm:tracking-wide mb-1.5 sm:mb-3">
                  Shubhranshu Sarkar
                </h3>

                {/* Social Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 mt-auto">
                  <a
                    href="https://www.linkedin.com/in/shubhranshu-sarkar-68a5923a0?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/50 hover:bg-[#0A66C2] text-stone-300 hover:text-white border border-white/20 hover:border-transparent transition-all duration-200 flex items-center justify-center shadow-md active:scale-95"
                    aria-label="Shubhranshu Sarkar LinkedIn"
                  >
                    <Linkedin className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>

                  <a
                    href="https://www.instagram.com/_bound_man_?igsh=MTZmaHY5aW5lNm1iaQ=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/50 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-stone-300 hover:text-white border border-white/20 hover:border-transparent transition-all duration-200 flex items-center justify-center shadow-md active:scale-95"
                    aria-label="Shubhranshu Sarkar Instagram"
                  >
                    <Instagram className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Glass Card: Get in Touch */}
            <div className="backdrop-blur-md bg-black/40 border border-white/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 mb-2.5 sm:mb-5 shadow-lg flex flex-col gap-2 sm:gap-3">
              <h4 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-amber-300/90 text-center">
                Get in Touch
              </h4>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-1.5 sm:gap-2.5">
                {/* Email Option */}
                <a
                  href="mailto:careframestudios@gmail.com"
                  className="flex-1 flex items-center justify-center sm:justify-start gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 hover:border-amber-400/40 text-stone-200 hover:text-white text-[11px] sm:text-sm transition-all duration-200 group/mail"
                >
                  <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-amber-500/15 text-amber-300 group-hover/mail:bg-amber-500/25 shrink-0">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <span className="truncate font-medium">careframestudios@gmail.com</span>
                </a>

                {/* Feedback / Suggestions Form Link */}
                <a
                  href="https://forms.gle/NXTkQfZsDuTvUuXm6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center sm:justify-start gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 text-amber-100 hover:text-white text-[11px] sm:text-sm transition-all duration-200 group/form"
                >
                  <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-amber-500/20 text-amber-300 group-hover/form:bg-amber-500/30 shrink-0">
                    <MessageSquareText className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-medium text-left leading-snug flex-1 truncate sm:whitespace-normal">
                    Feedback or suggestions form
                  </span>
                  <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60 group-hover/form:opacity-100 shrink-0 ml-0.5" />
                </a>
              </div>
            </div>

            {/* Bottom Quote in Bengali Handwritten Font */}
            <div className="pt-2 sm:pt-4 border-t border-stone-800/80 text-center flex flex-col items-center justify-center">
              <p
                id="iti-modal-quote"
                className="font-bengali-handwritten text-sm sm:text-2xl md:text-3xl text-yellow-200/95 tracking-wide leading-relaxed drop-shadow-md px-1 sm:px-2"
                style={{
                  textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 15px rgba(253,224,71,0.2)',
                }}
              >
                &ldquo;তিনি আমার প্রাণের আরাম, মনের আনন্দ, আত্মার শান্তি&rdquo;
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
