/**
 * App-level state store (mode, language, theme, match phase)
 */
import { create } from 'zustand';
import type { MatchPhase } from '../utils/constants';

export type AppMode = 'fan' | 'staff' | 'command';

interface AppState {
  mode: AppMode;
  language: string;
  theme: 'dark' | 'light';
  matchPhase: MatchPhase;
  matchMinute: number;
  sidebarOpen: boolean;
  currentZone: string;
  seatSection: number;
  seatRow: number;
  seatNumber: number;
  
  setMode: (mode: AppMode) => void;
  setLanguage: (lang: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setMatchPhase: (phase: MatchPhase) => void;
  setMatchMinute: (min: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentZone: (zone: string) => void;
  setSeatInfo: (section: number, row: number, seat: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'command',
  language: 'en',
  theme: 'dark',
  matchPhase: 'first-half',
  matchMinute: 34,
  sidebarOpen: true,
  currentZone: 'gate-a',
  seatSection: 217,
  seatRow: 12,
  seatNumber: 8,

  setMode: (mode) => set({ mode, theme: mode === 'fan' ? 'light' : 'dark' }),
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setMatchPhase: (matchPhase) => set({ matchPhase }),
  setMatchMinute: (matchMinute) => set({ matchMinute }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCurrentZone: (currentZone) => set({ currentZone }),
  setSeatInfo: (seatSection, seatRow, seatNumber) => set({ seatSection, seatRow, seatNumber }),
}));
