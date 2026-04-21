import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Insets { top: number; bottom: number; left: number; right: number; }

function applyInsets(insets: Insets) {
  const root = document.documentElement;
  root.style.setProperty('--sat', `${insets.top}px`);
  root.style.setProperty('--sab', `${insets.bottom}px`);
  root.style.setProperty('--sal', `${insets.left}px`);
  root.style.setProperty('--sar', `${insets.right}px`);
}

async function fetchAndApply() {
  try {
    const insets = await invoke<Insets>('plugin:native-bridge|get_safe_area_insets');
    applyInsets(insets);
  } catch {
    // desktop/browser — index.css env() fallback handles it
  }
}

export function useSafeAreaInsets() {
  useEffect(() => {
    fetchAndApply();
    const handler = () => fetchAndApply();
    screen.orientation?.addEventListener('change', handler);
    window.addEventListener('focus', handler);
    return () => {
      screen.orientation?.removeEventListener('change', handler);
      window.removeEventListener('focus', handler);
    };
  }, []);
}
