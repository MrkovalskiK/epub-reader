export interface ThemePalette {
  bg: string;
  fg: string;
  primary: string;
  isDarkMode: boolean;
}

export const themes: Record<string, ThemePalette> = {
  light: { bg: '#ffffff', fg: '#1a1a1a', primary: '#2563eb', isDarkMode: false },
  dark:  { bg: '#1c1c1e', fg: '#e5e5e7', primary: '#60a5fa', isDarkMode: true  },
  sepia: { bg: '#f4ecd8', fg: '#433422', primary: '#7c5c2e', isDarkMode: false },
};
