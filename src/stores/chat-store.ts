import { create } from 'zustand';
import type { ChatMessage, ChatContext, MentionedElement } from '@/types';
import { generateId } from '@/lib/utils';

interface ChatState {
  messages: Record<string, ChatMessage[]>; // Keyed by chapterId or 'global'
  currentContext: ChatContext;
  isLoading: boolean;

  // Actions
  addMessage: (chatId: string, message: { role: 'user' | 'assistant'; content: string }) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  clearChat: (chatId: string) => void;
  setLoading: (loading: boolean) => void;
  
  // Context Actions
  setIncludeFullBook: (include: boolean) => void;
  setIncludeMasterJson: (include: boolean) => void;
  toggleChapter: (chapterNumber: number) => void;
  addMention: (element: MentionedElement) => void;
  clearMentions: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  currentContext: {
    includeFullBook: false,
    includeMasterJson: true,
    selectedChapters: [],
    mentionedElements: [],
  },
  isLoading: false,

  addMessage: (chatId, message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
      isEdited: false,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), newMessage],
      },
    }));
  },

  updateMessage: (chatId, messageId, content) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === messageId
            ? {
                ...m,
                content,
                isEdited: true,
                originalContent: m.originalContent || m.content,
              }
            : m
        ),
      },
    }));
  },

  clearChat: (chatId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [],
      },
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setIncludeFullBook: (include) => {
    set((state) => ({
      currentContext: { ...state.currentContext, includeFullBook: include },
    }));
  },

  setIncludeMasterJson: (include) => {
    set((state) => ({
      currentContext: { ...state.currentContext, includeMasterJson: include },
    }));
  },

  toggleChapter: (chapterNumber) => {
    set((state) => {
      const chapters = state.currentContext.selectedChapters;
      const newChapters = chapters.includes(chapterNumber)
        ? chapters.filter((c) => c !== chapterNumber)
        : [...chapters, chapterNumber];
      return {
        currentContext: { ...state.currentContext, selectedChapters: newChapters },
      };
    });
  },

  addMention: (element) => {
    set((state) => ({
      currentContext: {
        ...state.currentContext,
        mentionedElements: [...state.currentContext.mentionedElements, element],
      },
    }));
  },

  clearMentions: () => {
    set((state) => ({
      currentContext: { ...state.currentContext, mentionedElements: [] },
    }));
  },
}));
