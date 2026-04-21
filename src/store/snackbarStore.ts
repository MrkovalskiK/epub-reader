import { create } from "zustand";

interface SnackbarState {
  message: string | null;
  revision: number;
  open: (message: string, duration?: number) => void;
  close: () => void;
}

export const snackbars = create<SnackbarState>((set) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    message: null,
    revision: 0,
    open: (message, duration = 3000) => {
      if (timer) clearTimeout(timer);
      set(s => ({ message, revision: s.revision + 1 }));
      timer = setTimeout(() => set({ message: null }), duration);
    },
    close: () => {
      if (timer) { clearTimeout(timer); timer = null; }
      set({ message: null });
    },
  };
});
