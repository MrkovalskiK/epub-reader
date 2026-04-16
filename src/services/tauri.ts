import { invoke } from '@tauri-apps/api/core';

export async function pickEpubFile(): Promise<string | null> {
  return invoke<string | null>('pick_epub_file');
}

export async function readEpubFile(path: string): Promise<ArrayBuffer> {
  const bytes = await invoke<number[]>('read_epub_file', { path });
  return new Uint8Array(bytes).buffer;
}

export async function saveState(json: string): Promise<void> {
  await invoke('save_state', { json });
}

export async function loadState(): Promise<string | null> {
  return invoke<string | null>('load_state');
}
