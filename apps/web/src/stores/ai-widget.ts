import { create } from 'zustand';

interface AiWidgetState {
  open: boolean;
  /** A question to ask as soon as the widget opens (from the home page examples). */
  pending: string | null;
  setOpen: (open: boolean) => void;
  ask: (question?: string) => void;
  takePending: () => string | null;
}

/** Opens the floating NUSKA AI window from anywhere on the page. */
export const useAiWidget = create<AiWidgetState>((set, get) => ({
  open: false,
  pending: null,
  setOpen: (open) => set({ open }),
  ask: (question) => set({ open: true, pending: question ?? null }),
  takePending: () => {
    const q = get().pending;
    if (q) set({ pending: null });
    return q;
  },
}));
