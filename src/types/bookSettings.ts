export type ReadingTheme = 'light' | 'dark' | 'sepia';

export interface BookSettings {
  theme: ReadingTheme;
  defaultFont: 'Serif' | 'Sans-serif';
  serifFont: string;
  sansSerifFont: string;
  defaultFontSize: number;
  fontWeight: number;
  lineHeight: number;
  paragraphMargin: number;
  scrolled: boolean;
}
