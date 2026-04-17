import { BookSettings } from '../types/bookSettings';
import { themes } from '../styles/themes';

export function getStyles(s: BookSettings): string {
  const palette = themes[s.theme] ?? themes.light;
  const { bg, fg, primary, isDarkMode } = palette;
  const fontFamily = s.defaultFont === 'Serif'
    ? `"${s.serifFont}", Georgia, serif`
    : `"${s.sansSerifFont}", Arial, sans-serif`;

  return `
    html {
      --theme-bg-color: ${bg};
      --theme-fg-color: ${fg};
      --theme-primary-color: ${primary};
      color-scheme: ${isDarkMode ? 'dark' : 'light'};
      font-family: ${fontFamily};
      font-size: ${s.defaultFontSize}px;
      font-weight: ${s.fontWeight};
    }
    html, body {
      background-color: ${bg};
      color: ${fg};
      font-size: ${s.defaultFontSize}px !important;
      font-weight: ${s.fontWeight};
      line-height: ${s.lineHeight};
      -webkit-text-size-adjust: none;
      text-size-adjust: none;
    }
    p { margin-block: ${s.paragraphMargin}em; }
    a:any-link { color: ${primary}; text-decoration: none; }
    img { ${isDarkMode ? 'filter: none;' : ''} max-width: 100%; height: auto; }
  `;
}
