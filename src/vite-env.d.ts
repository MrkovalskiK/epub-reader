/// <reference types="vite/client" />

declare module 'foliate-js/view.js' {
  export function makeBook(url: string): Promise<unknown>;
}
