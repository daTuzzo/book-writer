import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '@/types';

interface UIStateStore extends UIState {
  toggleSidebar: () => void;
  toggleChatPanel: () => void;
  setChatPanelWidth: (width: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setEditorFont: (font: string) => void;
  setEditorFontSize: (size: number) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
}

export const useUIStore = create<UIStateStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      chatPanelOpen: true,
      chatPanelWidth: 380,
      theme: 'dark',
      editorFont: 'Georgia',
      editorFontSize: 16,
      autoSaveEnabled: true,
      autoSaveInterval: 5,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),
      setChatPanelWidth: (width) => set({ chatPanelWidth: width }),
      setTheme: (theme) => set({ theme }),
      setEditorFont: (font) => set({ editorFont: font }),
      setEditorFontSize: (size) => set({ editorFontSize: size }),
      setAutoSave: (enabled) => set({ autoSaveEnabled: enabled }),
      setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
    }),
    {
      name: 'book-writer-ui',
    }
  )
);
