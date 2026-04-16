import { useStore, defaultSettings } from './index';
import { saveState, loadState } from '../services/tauri';

export async function hydrateStore(): Promise<void> {
  try {
    const json = await loadState();
    if (json) {
      const saved = JSON.parse(json) as { library?: unknown; readerSettings?: unknown };
      useStore.setState({
        library: Array.isArray(saved.library) ? saved.library : [],
        readerSettings: (saved.readerSettings as typeof defaultSettings) ?? defaultSettings,
      });
    }
  } catch (e) {
    console.error('hydrateStore failed, starting fresh:', e);
  } finally {
    useStore.getState().setHydrated();
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function persistStore(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      const { library, readerSettings } = useStore.getState();
      await saveState(JSON.stringify({ library, readerSettings }));
    } catch (e) {
      console.error('persistStore failed:', e);
    }
  }, 500);
}
