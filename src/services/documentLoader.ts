import { readFile } from '@tauri-apps/plugin-fs';

export type FoliateBook = {
  metadata?: unknown;
  toc?: unknown[];
  sections?: unknown[];
  transformTarget?: EventTarget;
  getCover(): Promise<Blob | null>;
};

export class EpubDocumentLoader {
  readonly fileBytes: Uint8Array;
  private name: string;

  constructor(bytes: Uint8Array, name: string) {
    this.fileBytes = bytes;
    this.name = name;
  }

  static async fromPath(localPath: string): Promise<EpubDocumentLoader> {
    const bytes = await readFile(localPath);
    const name = localPath.split('/').pop() ?? 'book.epub';
    return new EpubDocumentLoader(bytes, name);
  }

  isValidZip(): boolean {
    return (
      this.fileBytes[0] === 0x50 &&
      this.fileBytes[1] === 0x4b &&
      this.fileBytes[2] === 0x03 &&
      this.fileBytes[3] === 0x04
    );
  }

  hasContainerXml(): boolean {
    const latin1 = new TextDecoder('latin1').decode(this.fileBytes);
    return latin1.includes('META-INF/container.xml');
  }

  async hasOPF(): Promise<boolean> {
    try {
      const { configure, ZipReader, BlobReader, TextWriter } =
        await import('foliate-js/vendor/zip.js');
      configure({ useWebWorkers: false });
      const reader = new ZipReader(new BlobReader(this.toFile()));
      const entries = await reader.getEntries();
      await reader.close();

      const names = new Set(entries.map((e: { filename: string }) => e.filename));
      const containerEntry = entries.find((e: { filename: string }) => e.filename === 'META-INF/container.xml');
      if (!containerEntry) return false;

      const xml: string = await containerEntry.getData(new TextWriter());
      const match = xml.match(/full-path="([^"]+)"/);
      if (!match) return false;

      return names.has(match[1]);
    } catch {
      return false;
    }
  }

  toFile(): File {
    return new File([this.fileBytes], this.name, { type: 'application/epub+zip' });
  }

  async open(): Promise<FoliateBook> {
    console.log('[documentLoader] open: importing foliate-js/view.js');
    try {
      const { makeBook } = await import('foliate-js/view.js');
      console.log('[documentLoader] open: calling makeBook');
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Превышено время ожидания открытия EPUB (30с)')), 30_000)
      );
      const result = await Promise.race([
        makeBook(this.toFile() as unknown as string) as Promise<FoliateBook>,
        timeout,
      ]);
      console.log('[documentLoader] open: makeBook resolved');
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[documentLoader] open failed:', msg);
      if (msg.includes('not a valid zip')) {
        throw new Error('Повреждённый EPUB: неверный ZIP-архив');
      }
      throw new Error(`Повреждённый EPUB: ${msg}`);
    }
  }
}
