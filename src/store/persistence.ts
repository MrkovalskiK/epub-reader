import { useStore, defaultSettings } from './index';
import { saveState, loadState } from '../services/tauri';

export async function hydrateStore(): Promise<void> {
  try {
    const json = await loadState();
    if (json) {
      const saved = JSON.parse(json) as { library?: unknown; readerSettings?: unknown; currentBookId?: unknown };
      useStore.setState({
        library: Array.isArray(saved.library) ? saved.library : [],
        readerSettings: (saved.readerSettings as typeof defaultSettings) ?? defaultSettings,
        currentBookId: typeof saved.currentBookId === 'string' ? saved.currentBookId : null,
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
      const { library, readerSettings, currentBookId } = useStore.getState();
      await saveState(JSON.stringify({ library, readerSettings, currentBookId }));
    } catch (e) {
      console.error('persistStore failed:', e);
    }
  }, 500);
}
