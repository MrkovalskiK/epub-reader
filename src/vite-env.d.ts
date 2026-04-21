/// <reference types="vite/client" />

declare module 'foliate-js/view.js' {
  export function makeBook(url: string): Promise<unknown>;
}

declare module 'foliate-js/vendor/zip.js' {
  export function configure(options: Record<string, unknown>): void;
  export class BlobReader {
    constructor(blob: Blob);
  }
  export class TextWriter {
    constructor();
  }
  export class ZipReader {
    constructor(reader: BlobReader);
    getEntries(): Promise<ZipEntry[]>;
    close(): Promise<void>;
  }
  export interface ZipEntry {
    filename: string;
    getData<T>(writer: TextWriter): Promise<T>;
  }
}
