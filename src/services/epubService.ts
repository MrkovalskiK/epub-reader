import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { writeFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import type { Book } from '~/types/book';
import { getCoverFilename } from '~/utils/book';
import { svg2png } from '~/utils/svg2png';

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateCoverImageUrl(book: Book): Promise<string | null> {
  const dataDir = await appDataDir();
  const absolutePath = await join(dataDir, 'books', getCoverFilename(book));
  if (!(await exists(absolutePath))) return null;
  return convertFileSrc(absolutePath);
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
  const book: Book = { id, localPath, ...metadata, addedAt: Date.now() };
  await saveCover(book, localPath);
  const coverImageUrl = await generateCoverImageUrl(book);
  return { ...book, coverImageUrl };
}

async function extractEpubMetadata(localPath: string): Promise<{ title: string; author: string }> {
  try {
    const { makeBook } = await import('foliate-js/view.js');
    const foliateBook = await makeBook(convertFileSrc(localPath)) as {
      metadata?: { title?: unknown; author?: unknown }
      getCover: () => Promise<Blob | null>
    };
    const { metadata } = foliateBook;
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
      title: localPath.split('/').pop()?.replace('.epub', '') ?? 'Unknown',
      author: 'Unknown Author',
    };
  }
}

async function saveCover(book: Book, localPath: string): Promise<void> {
  try {
    const { makeBook } = await import('foliate-js/view.js');
    const foliateBook = await makeBook(convertFileSrc(localPath)) as {
      metadata?: { title?: unknown; author?: unknown }
      resources?: {
        cover?: { href?: string; mediaType?: string; id?: string } | null
        manifest?: { id: string; href: string; mediaType: string }[]
      }
      getCover: () => Promise<Blob | null>
    };

    console.log('[cover-debug] resources:', foliateBook.resources);
    console.log('[cover-debug] manifest ids+types:', foliateBook.resources?.manifest?.map(i => [i.id, i.mediaType]));
    console.log('[cover-debug] resources.cover:', foliateBook.resources?.cover);
    console.log('[cover-debug] cover href:', foliateBook.resources?.cover?.href);

    let cover: Blob | null = null;
    try {
      cover = await foliateBook.getCover();
    } catch (e) {
      console.error('[cover-debug] getCover threw:', e);
      return;
    }
    console.log('[cover-debug] blob:', cover, 'type:', cover?.type, 'size:', cover?.size);
    if (!cover) return;

    if (cover.type === 'image/svg+xml') {
      cover = await svg2png(cover);
    }

    const dataDir = await appDataDir();
    const coverDir = await join(dataDir, 'books', book.id);
    if (!(await exists(coverDir))) {
      await mkdir(coverDir, { recursive: true });
    }

    const coverPath = await join(dataDir, 'books', getCoverFilename(book));
    const bytes = new Uint8Array(await cover.arrayBuffer());
    await writeFile(coverPath, bytes);
    console.log('[cover-debug] cover saved to:', coverPath);
  } catch (e) {
    console.error('[cover-debug] saveCover failed:', e);
  }
}
