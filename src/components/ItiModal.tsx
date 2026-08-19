import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Linkedin, Instagram, Mail, MessageSquareText, ExternalLink, Globe, ArrowLeft, User } from 'lucide-react';

interface ItiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreatorProfile {
  id: 'akash' | 'shubhranshu';
  name: string;
  image: string;
  fallbackImage: string;
  linkedin: string;
  instagram: string;
  instagramHandle: string;
}

const CREATORS: CreatorProfile[] = [
  {
    id: 'akash',
    name: 'Akash Ghosh',
    image: 'https://res.cloudinary.com/dcn8swiqz/image/upload/v1785936625/1785936218267_ulbtsm.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    linkedin: 'https://www.linkedin.com/in/akash-ghosh-profile-view?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
    instagram: 'https://www.instagram.com/mr.photographerakash?igsh=MW42d2tmZTh6a2drdA%3D%3D&utm_source=qr',
    instagramHandle: '@mr.photographerakash',
  },
  {
    id: 'shubhranshu',
    name: 'Shubhranshu Sarkar',
    image: 'https://res.cloudinary.com/dcn8swiqz/image/upload/v1786817975/shonku.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    linkedin: 'https://www.linkedin.com/in/shubhranshu-sarkar-68a5923a0?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
    instagram: 'https://www.instagram.com/_bound_man_?igsh=MTZmaHY5aW5lNm1iaQ==',
    instagramHandle: '@_bound_man_',
  },
];

export const ItiModal: React.FC<ItiModalProps> = React.memo(({ isOpen, onClose }) => {
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);

  // Reset selected creator when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCreator(null);
    }
  }, [isOpen]);

  // Listen for Escape key to close modal or go back from profile view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedCreator) {
          setSelectedCreator(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedCreator, onClose]);

  const otherCreator = selectedCreator
    ? CREATORS.find((c) => c.id !== selectedCreator.id)
    : null;

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
            className="relative z-10 w-full max-w-sm sm:max-w-xl md:max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar liquid-glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 text-white flex flex-col gpu-accelerated"
          >
            {/* Top Navigation Bar: Back Button (if profile selected) + Close Button */}
            <div className="flex items-center justify-between mb-2">
              {selectedCreator ? (
                <button
                  id="profile-back-btn"
                  type="button"
                  onClick={() => setSelectedCreator(null)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-200 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 transition-all duration-200 cursor-pointer shadow active:scale-95"
                  title="Back to Overview"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {/* Top Close Button (X) */}
              <button
                id="iti-modal-close-btn"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 sm:p-2 rounded-xl text-stone-300 hover:text-white bg-stone-900/80 hover:bg-stone-800 border border-stone-600/70 hover:border-stone-400 transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ml-auto"
                aria-label="Close modal"
                title="Close"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none" />
              </button>
            </div>

            {/* Profile Detail View or Default Overview */}
            <AnimatePresence mode="wait">
              {selectedCreator ? (
                <motion.div
                  key={selectedCreator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center text-center py-2 sm:py-3"
                >
                  {/* Glowing Profile Avatar */}
                  <div className="relative mb-3 sm:mb-4">
                    <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/50 via-yellow-400/40 to-amber-600/50 blur-md opacity-75 animate-pulse" />
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-tr from-amber-500 via-stone-700 to-yellow-300 shadow-2xl">
                      <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border-2 border-stone-900 bg-stone-950">
                        <img
                          src={selectedCreator.image}
                          alt={selectedCreator.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = selectedCreator.fallbackImage;
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 tracking-wide mb-4 sm:mb-6">
                    {selectedCreator.name}
                  </h3>

                  {/* Prominent LinkedIn & Instagram Action Buttons */}
                  <div className="w-full max-w-md flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                    {/* LinkedIn Button */}
                    <a
                      href={selectedCreator.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl sm:rounded-2xl bg-[#0A66C2]/20 hover:bg-[#0A66C2] text-white border border-[#0A66C2]/60 hover:border-transparent transition-all duration-300 shadow-lg group active:scale-95"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-[#0A66C2] text-white shadow group-hover:scale-110 transition-transform">
                          <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-xs sm:text-sm font-bold tracking-tight">LinkedIn</div>
                          <div className="text-[10px] sm:text-xs text-blue-200/80 group-hover:text-white/90 truncate">
                            Connect on LinkedIn
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-blue-300 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                    </a>

                    {/* Instagram Button */}
                    <a
                      href={selectedCreator.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#f09433]/20 via-[#dc2743]/20 to-[#bc1888]/20 hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-white border border-pink-500/40 hover:border-transparent transition-all duration-300 shadow-lg group active:scale-95"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow group-hover:scale-110 transition-transform">
                          <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-xs sm:text-sm font-bold tracking-tight">Instagram</div>
                          <div className="text-[10px] sm:text-xs text-pink-200/80 group-hover:text-white/90 truncate">
                            {selectedCreator.instagramHandle}
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-pink-300 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                    </a>
                  </div>

                  {/* Switch to Other Creator Option */}
                  {otherCreator && (
                    <button
                      type="button"
                      onClick={() => setSelectedCreator(otherCreator)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-stone-300 hover:text-white text-xs font-medium transition-all active:scale-95"
                    >
                      <span>View profile of</span>
                      <span className="font-semibold text-amber-300">{otherCreator.name}</span>
                      <span>→</span>
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Modal Title: ইতি */}
                  <div className="text-center mb-2 sm:mb-3">
                    <h2
                      id="iti-modal-title"
                      className="font-bengali-handwritten text-2xl sm:text-4xl text-yellow-300 tracking-wider leading-none drop-shadow-[0_2px_12px_rgba(253,224,71,0.35)]"
                    >
                      ইতি
                    </h2>
                  </div>

                  {/* 2 Interactive Profile Glass Cards Side-by-Side */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-2.5 sm:mb-4">
                    {CREATORS.map((creator) => (
                      <div
                        key={creator.id}
                        onClick={() => setSelectedCreator(creator)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedCreator(creator);
                          }
                        }}
                        className="backdrop-blur-md bg-black/45 hover:bg-black/60 border border-white/20 hover:border-amber-400/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-between text-center transition-all duration-300 shadow-lg group cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] relative overflow-hidden"
                      >
                        {/* Subtle Click Hint Badge */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-400/40">
                            <User className="w-2.5 h-2.5" />
                            <span>View</span>
                          </span>
                        </div>

                        {/* Profile Photo inside Rounded Frame */}
                        <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 bg-gradient-to-tr from-amber-500/40 via-stone-700 to-amber-300/40 group-hover:from-amber-400 group-hover:to-yellow-300 shadow-inner mb-1.5 sm:mb-2 transition-all duration-300">
                          <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden border border-stone-800 sm:border-2 bg-stone-950">
                            <img
                              src={creator.image}
                              alt={creator.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = creator.fallbackImage;
                              }}
                            />
                          </div>
                        </div>

                        {/* Name */}
                        <h3 className="text-xs sm:text-base font-bold text-stone-100 group-hover:text-amber-300 tracking-tight sm:tracking-wide mb-2 sm:mb-3 transition-colors">
                          {creator.name}
                        </h3>

                        {/* Social Direct Click Buttons */}
                        <div
                          className="flex items-center gap-1.5 sm:gap-2 mt-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={creator.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-black/60 hover:bg-[#0A66C2] text-stone-300 hover:text-white border border-white/20 hover:border-transparent transition-all duration-200 flex items-center justify-center shadow-md active:scale-95"
                            aria-label={`${creator.name} LinkedIn`}
                            title="LinkedIn Profile"
                          >
                            <Linkedin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </a>

                          <a
                            href={creator.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-black/60 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-stone-300 hover:text-white border border-white/20 hover:border-transparent transition-all duration-200 flex items-center justify-center shadow-md active:scale-95"
                            aria-label={`${creator.name} Instagram`}
                            title="Instagram Profile"
                          >
                            <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Glass Card: Get in Touch & Official Links */}
                  <div className="backdrop-blur-md bg-black/40 border border-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-2 sm:mb-3 shadow-lg flex flex-col gap-1.5 sm:gap-2">
                    <h4 className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-300/90 text-center">
                      Get in Touch & Official Links
                    </h4>

                    {/* Official Brand Website */}
                    <a
                      href="https://careframestudios.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 hover:from-amber-500/25 hover:via-orange-500/20 hover:to-amber-500/25 border border-amber-400/40 hover:border-amber-300 text-amber-100 hover:text-white text-[11px] sm:text-xs transition-all duration-200 group/web shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md sm:rounded-lg bg-amber-400/20 text-amber-300 group-hover/web:bg-amber-400/30 group-hover/web:text-amber-200 shrink-0">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center truncate">
                          <span className="font-semibold text-white tracking-wide truncate">
                            careframestudios.in
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover/web:opacity-100 shrink-0 text-amber-300 group-hover/web:translate-x-0.5 transition-transform" />
                    </a>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-1.5 sm:gap-2">
                      {/* Email Option */}
                      <a
                        href="mailto:careframestudios@gmail.com"
                        className="flex-1 flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 hover:border-amber-400/40 text-stone-200 hover:text-white text-[10px] sm:text-[11px] transition-all duration-200 group/mail"
                      >
                        <div className="p-1 rounded-md bg-amber-500/15 text-amber-300 group-hover/mail:bg-amber-500/25 shrink-0">
                          <Mail className="w-3 h-3" />
                        </div>
                        <span className="truncate font-medium">careframestudios@gmail.com</span>
                      </a>

                      {/* Feedback / Suggestions Form Link */}
                      <a
                        href="https://forms.gle/NXTkQfZsDuTvUuXm6"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 hover:border-amber-400/40 text-amber-100 hover:text-white text-[10px] sm:text-[11px] transition-all duration-200 group/form"
                      >
                        <div className="p-1 rounded-md bg-amber-500/20 text-amber-300 group-hover/form:bg-amber-500/30 shrink-0">
                          <MessageSquareText className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-left leading-snug flex-1 truncate">
                          Feedback / Suggestions
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover/form:opacity-100 shrink-0 ml-0.5" />
                      </a>
                    </div>
                  </div>

                  {/* Bottom Quote in Bengali Handwritten Font */}
                  <div className="pt-1.5 sm:pt-2.5 border-t border-stone-800/80 text-center flex flex-col items-center justify-center">
                    <p
                      id="iti-modal-quote"
                      className="font-bengali-handwritten text-xs sm:text-xl md:text-2xl text-yellow-200/95 tracking-wide leading-snug drop-shadow-md px-1"
                      style={{
                        textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 15px rgba(253,224,71,0.2)',
                      }}
                    >
                      &ldquo;তিনি আমার প্রাণের আরাম, মনের আনন্দ, আত্মার শান্তি&rdquo;
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

