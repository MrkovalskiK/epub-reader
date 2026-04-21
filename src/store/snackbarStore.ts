import { create } from "zustand";

interface SnackbarState {
	message: string | null;
	open: (message: string) => void;
	close: () => void;
}

export const snackbars = create<SnackbarState>((set) => ({
	message: null,
	open: (message) => {
		set({ message });
		setTimeout(() => set({ message: null }), 3000);
	},
	close: () => set({ message: null }),
}));
