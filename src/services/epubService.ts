import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import type { Book } from '~/types/book';

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function importEpub(contentUri: string): Promise<Book> {
  const id = await sha256(contentUri);
  const dataDir = await appDataDir();
  const localPath = await join(dataDir, 'books', `${id}.epub`);

  const result = await invoke<{ success: boolean; error?: string }>(
    'plugin:native-bridge|copy_uri_to_path',
    { uri: contentUri, dst: localPath }
  );
  if (!result.success) throw new Error(result.error ?? 'Failed to copy EPUB');

  const metadata = await extractEpubMetadata(localPath);
  return { id, localPath, ...metadata, addedAt: Date.now() };
}

async function extractEpubMetadata(localPath: string): Promise<{ title: string; author: string }> {
  try {
    const { makeBook } = await import('foliate-js/view.js');
    const book = await makeBook(convertFileSrc(localPath)) as { metadata?: { title?: unknown; author?: unknown } };
    const { metadata } = book;
    const rawAuthor = metadata?.author;
    const author = typeof rawAuthor === 'string'
      ? rawAuthor
      : rawAuthor && typeof rawAuthor === 'object' && 'name' in rawAuthor
        ? String((rawAuthor as { name: unknown }).name)
        : 'Unknown Author';
    return {
      title: typeof metadata?.title === 'string' ? metadata.title : localPath.split('/').pop()?.replace('.epub', '') ?? 'Unknown',
      author,
    };
  } catch {
    return {
      title:  localPath.split('/').pop()?.replace('.epub', '') ?? 'Unknown',
      author: 'Unknown Author',
    };
  }
}
