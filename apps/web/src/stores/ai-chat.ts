import type { AiReply } from '@nuska/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Present on assistant answers. */
  reply?: AiReply;
}

interface AiChatState {
  entries: ChatEntry[];
  push: (entry: Omit<ChatEntry, 'id'>) => void;
  clear: () => void;
}

/** Conversation with NUSKA AI, kept for this browser tab only (sessionStorage). */
export const useAiChat = create<AiChatState>()(
  persist(
    (set, get) => ({
      entries: [],
      push: (entry) =>
        set({
          entries: [
            ...get().entries,
            { ...entry, id: `${Date.now()}-${get().entries.length}` },
          ].slice(-30),
        }),
      clear: () => set({ entries: [] }),
    }),
    { name: 'nuska.ai-chat', storage: createJSONStorage(() => sessionStorage) }
  )
);
