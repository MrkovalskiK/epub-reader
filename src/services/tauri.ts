import { invoke } from '@tauri-apps/api/core';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function pickEpubFile(): Promise<string | null> {
  if (isTauri()) return invoke<string | null>('pick_epub_file');

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.epub';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      resolve(URL.createObjectURL(file));
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function readEpubFile(path: string): Promise<ArrayBuffer> {
  if (isTauri()) {
    return invoke<ArrayBuffer>('read_epub_file', { path });
  }

  // browser: path is a blob URL created by pickEpubFile
  const res = await fetch(path);
  if (!res.ok) throw new Error('Файл недоступен (blob URL истёк, откройте книгу заново)');
  return res.arrayBuffer();
}

export async function saveState(json: string): Promise<void> {
  if (isTauri()) { await invoke('save_state', { json }); return; }
  localStorage.setItem('epub_reader_state', json);
}

export async function loadState(): Promise<string | null> {
  if (isTauri()) return invoke<string | null>('load_state');
  return localStorage.getItem('epub_reader_state');
}
