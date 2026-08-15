export type TimeOfDay = 'day' | 'night';
export type TimeMode = 'auto' | 'day' | 'night';

export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  thumbnail: string;
  durationSeconds: number;
  category?: string;
  audioUrl?: string; // Direct audio fallback stream
}

export interface PlaylistCategory {
  id: string;
  nameEnglish: string;
  nameBengali: string;
  available: boolean;
  tagline?: string;
  playlistUrl?: string;
  subcategories?: string[];
  tracks: Track[];
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrackIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
}

export interface VisitorStats {
  activeCount: number;
  totalVisits: number;
}
