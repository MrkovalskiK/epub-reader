import { create } from "zustand";

interface SnackbarState {
  message: string | null;
  revision: number;
  open: (message: string) => void;
  close: () => void;
}

export const snackbars = create<SnackbarState>((set) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    message: null,
    revision: 0,
    open: (message) => {
      if (timer) clearTimeout(timer);
      set(s => ({ message, revision: s.revision + 1 }));
      timer = setTimeout(() => set({ message: null }), 3000);
    },
    close: () => {
      if (timer) { clearTimeout(timer); timer = null; }
      set({ message: null });
    },
  };
});
