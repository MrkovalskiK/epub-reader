import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { readFile, writeFile, mkdir, exists, remove } from '@tauri-apps/plugin-fs';
import type { Book } from '~/types/book';
import { getCoverFilename } from '~/utils/book';
import { svg2png } from '~/utils/svg2png';

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function deleteBookFiles(book: Book): Promise<void> {
  const dataDir = await appDataDir();
  const epubPath = await join(dataDir, 'books', `${book.id}.epub`);
  const coverDir = await join(dataDir, 'books', book.id);
  if (await exists(epubPath)) await remove(epubPath);
  if (await exists(coverDir)) await remove(coverDir, { recursive: true });
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

async function makeBookFromPath(localPath: string) {
  const { makeBook } = await import('foliate-js/view.js');
  const bytes = await readFile(localPath);
  const file = new File([bytes], 'book.epub', { type: 'application/epub+zip' });
  const book = await makeBook(file as unknown as string);
  return book;
}

async function extractEpubMetadata(localPath: string): Promise<{ title: string; author: string; description?: string; genres?: string[]; publisher?: string; publishDate?: string }> {
  try {
    const foliateBook = await makeBookFromPath(localPath) as {
      metadata?: { title?: unknown; author?: unknown; description?: unknown; subject?: unknown; publisher?: unknown; published?: unknown; date?: unknown }
      getCover: () => Promise<Blob | null>
    };
    const { metadata } = foliateBook;
    const rawAuthor = metadata?.author;
    const author = typeof rawAuthor === 'string'
      ? rawAuthor
      : rawAuthor && typeof rawAuthor === 'object' && 'name' in rawAuthor
        ? String((rawAuthor as { name: unknown }).name)
        : 'Unknown Author';

    const rawSubject = metadata?.subject;
    const genres = Array.isArray(rawSubject)
      ? rawSubject.map(String).filter(Boolean)
      : typeof rawSubject === 'string' && rawSubject
        ? [rawSubject]
        : undefined;

    const result = {
      title: typeof metadata?.title === 'string' ? metadata.title : localPath.split('/').pop()?.replace('.epub', '') ?? 'Unknown',
      author,
      description: typeof metadata?.description === 'string' && metadata.description ? metadata.description : undefined,
      genres: genres?.length ? genres : undefined,
      publisher: typeof metadata?.publisher === 'string' && metadata.publisher ? metadata.publisher : undefined,
      publishDate: typeof metadata?.published === 'string' && metadata.published
        ? metadata.published
        : typeof metadata?.date === 'string' && metadata.date
          ? metadata.date
          : undefined,
    };
    return result;
  } catch (e) {
    console.error('[epub-debug] extractEpubMetadata failed:', e);
    return {
      title: localPath.split('/').pop()?.replace('.epub', '') ?? 'Unknown',
      author: 'Unknown Author',
    };
  }
}

async function saveCover(book: Book, localPath: string): Promise<void> {
  try {
    const foliateBook = await makeBookFromPath(localPath) as {
      metadata?: { title?: unknown; author?: unknown }
      resources?: {
        cover?: { href?: string; mediaType?: string; id?: string } | null
        manifest?: { id: string; href: string; mediaType: string }[]
      }
      getCover: () => Promise<Blob | null>
    };

    let cover: Blob | null = null;
    try {
      cover = await foliateBook.getCover();
    } catch (e) {
      console.error('[cover-debug] getCover threw:', e);
      return;
    }
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
  } catch (e) {
    console.error('[cover-debug] saveCover failed:', e);
  }
}
