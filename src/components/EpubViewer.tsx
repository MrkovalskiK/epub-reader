export interface EpubViewerHandle {
  goTo: (href: string) => void;
  prev: () => void;
  next: () => void;
}
