import { create } from 'zustand';

interface ConfirmRequest {
  message: string;
  /** a red button for deleting and other irreversible actions */
  danger: boolean;
  resolve: (ok: boolean) => void;
}

interface ConfirmState {
  request: ConfirmRequest | null;
  ask: (message: string, options?: { danger?: boolean }) => Promise<boolean>;
  answer: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  request: null,
  ask: (message, options) =>
    new Promise<boolean>((resolve) => {
      // a second question while one is open counts as «no» for the first
      get().request?.resolve(false);
      set({ request: { message, danger: options?.danger ?? false, resolve } });
    }),
  answer: (ok) => {
    get().request?.resolve(ok);
    set({ request: null });
  },
}));

/**
 * The site's own confirmation window (instead of the browser's grey one):
 * `if (await askConfirm('Delete?', { danger: true })) …`
 */
export const askConfirm = (message: string, options?: { danger?: boolean }) =>
  useConfirmStore.getState().ask(message, options);
