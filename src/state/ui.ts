import { create } from 'zustand';
import type { DecodedSchedule } from '../core/sharing';
import type { Option } from '../core/types';
import { cache } from '../data/cache';

export type ViewMode = 'weave' | 'list';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface UIState {
  activeSemesterId: string | null;
  previewCandidate: Option | null;
  viewMode: ViewMode;
  selectedComponentId: string | null;
  activeToast: string | null;
  sharedSchedule: DecodedSchedule | null;
  isSectionChangeModalOpen: boolean;
  theme: ThemeMode;

  setActiveSemesterId: (id: string | null) => void;
  setPreviewCandidate: (candidate: Option | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedComponentId: (id: string | null) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
  setSharedSchedule: (schedule: DecodedSchedule | null) => void;
  setSectionChangeModalOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
}

const THEME_CACHE_KEY = 'loom:v1:theme';

function getInitialTheme(): ThemeMode {
  const cached = cache.get<ThemeMode>(THEME_CACHE_KEY);
  if (cached && ['light', 'dark', 'auto'].includes(cached)) {
    return cached;
  }
  return 'auto';
}

export const useUIStore = create<UIState>((set) => ({
  activeSemesterId: null,
  previewCandidate: null,
  viewMode: 'weave',
  selectedComponentId: null,
  activeToast: null,
  sharedSchedule: null,
  isSectionChangeModalOpen: false,
  theme: getInitialTheme(),

  setActiveSemesterId: (id) => set({ activeSemesterId: id }),
  setPreviewCandidate: (candidate) => set({ previewCandidate: candidate }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedComponentId: (id) => set({ selectedComponentId: id }),

  showToast: (message) => {
    set({ activeToast: message });
  },

  hideToast: () => set({ activeToast: null }),

  setSharedSchedule: (schedule) => set({ sharedSchedule: schedule }),
  setSectionChangeModalOpen: (open) => set({ isSectionChangeModalOpen: open }),

  setTheme: (theme) => {
    cache.set(THEME_CACHE_KEY, theme);
    set({ theme });
  },
}));
