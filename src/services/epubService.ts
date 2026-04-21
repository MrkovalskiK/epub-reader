import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { writeFile, mkdir, exists, remove, rename } from '@tauri-apps/plugin-fs';
import type { Book } from '~/types/book';
import { getCoverFilename } from '~/utils/book';
import { svg2png } from '~/utils/svg2png';
import { EpubDocumentLoader, type FoliateBook } from '~/services/documentLoader';

export class DuplicateBookError extends Error {
  constructor() {
    super('Book already exists in library');
    this.name = 'DuplicateBookError';
  }
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

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function importEpub(contentUri: string): Promise<Book> {
  const dataDir = await appDataDir();
  const booksDir = await join(dataDir, 'books');
  if (!(await exists(booksDir))) {
    await mkdir(booksDir, { recursive: true });
  }
  const tempPath = await join(booksDir, `_import_tmp_${Date.now()}.epub`);

  const result = await invoke<{ success: boolean; error?: string }>(
    'plugin:native-bridge|copy_uri_to_path',
    { uri: contentUri, dst: tempPath }
  );
  if (!result.success) throw new Error(result.error ?? 'Failed to copy EPUB');

  const loader = await EpubDocumentLoader.fromPath(tempPath);

  if (!loader.isValidZip()) {
    await remove(tempPath);
    throw new Error('Invalid EPUB: not a ZIP archive');
  }

  if (!loader.hasContainerXml()) {
    await remove(tempPath);
    throw new Error('Invalid EPUB: missing META-INF/container.xml');
  }

  let doc: FoliateBook;
  try {
    doc = await loader.open();
  } catch (e) {
    await remove(tempPath);
    throw e;
  }

  // Compute content hash: full file if ≤8192 bytes, else first+last 4096 bytes + size
  const bytes = loader.fileBytes;
  const CHUNK = 4096;
  const sizeBytes = new Uint8Array(8);
  const sizeView = new DataView(sizeBytes.buffer);
  sizeView.setBigUint64(0, BigInt(bytes.length), false);
  let hashInput: Uint8Array;
  if (bytes.length <= CHUNK * 2) {
    hashInput = new Uint8Array(bytes.length + 8);
    hashInput.set(bytes, 0);
    hashInput.set(sizeBytes, bytes.length);
  } else {
    const prefix = bytes.slice(0, CHUNK);
    const suffix = bytes.slice(bytes.length - CHUNK);
    hashInput = new Uint8Array(CHUNK * 2 + 8);
    hashInput.set(prefix, 0);
    hashInput.set(suffix, CHUNK);
    hashInput.set(sizeBytes, CHUNK * 2);
  }
  const id = await sha256Bytes(hashInput);

  const finalPath = await join(booksDir, `${id}.epub`);
  if (await exists(finalPath)) {
    await remove(tempPath);
    throw new DuplicateBookError();
  }

  await rename(tempPath, finalPath);

  const metadata = extractMetadataFromDoc(doc, finalPath);
  const book: Book = { id, localPath: finalPath, ...metadata, addedAt: Date.now() };
  await saveCoverFromDoc(book, doc);
  const coverImageUrl = await generateCoverImageUrl(book);
  return { ...book, coverImageUrl };
}

function extractMetadataFromDoc(
  doc: FoliateBook,
  fallbackPath: string,
): { title: string; author: string; description?: string; genres?: string[]; publisher?: string; publishDate?: string } {
  const metadata = doc.metadata as Record<string, unknown> | undefined;
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

  return {
    title: typeof metadata?.title === 'string' ? metadata.title : fallbackPath.split('/').pop()?.replace('.epub', '') ?? 'Unknown',
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
}

async function saveCoverFromDoc(book: Book, doc: FoliateBook): Promise<void> {
  try {
    let cover: Blob | null = null;
    try {
      cover = await doc.getCover();
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
    const coverBytes = new Uint8Array(await cover.arrayBuffer());
    await writeFile(coverPath, coverBytes);
  } catch (e) {
    console.error('[cover-debug] saveCoverFromDoc failed:', e);
  }
}
