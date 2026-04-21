import { BookSettings } from '../types/bookSettings';
import { themes } from '../styles/themes';

const SERIF_FONTS = ['Bitter', 'Georgia', 'Times New Roman'];
const SANS_SERIF_FONTS = ['Roboto', 'Arial', 'Helvetica'];
const MONOSPACE_FONTS = ['Courier New'];
const FALLBACK_FONTS = ['system-ui'];
const CJK_SERIF_FONTS: string[] = [];
const CJK_SANS_SERIF_FONTS: string[] = [];
const FONT_SCALE = 1.25; // Android-only app

const getFontStyles = (
  serif: string,
  sansSerif: string,
  monospace: string,
  defaultFont: string,
  defaultCJKFont: string,
  fontSize: number,
  minFontSize: number,
  fontWeight: number,
  overrideFont: boolean,
) => {
  const lastSerifFonts = ['Georgia', 'Times New Roman'];
  const serifFonts = [
    serif,
    ...(defaultCJKFont && defaultCJKFont !== serif ? [defaultCJKFont] : []),
    ...SERIF_FONTS.filter(
      (font) => font !== serif && font !== defaultCJKFont && !lastSerifFonts.includes(font),
    ),
    ...CJK_SERIF_FONTS.filter((font) => font !== serif && font !== defaultCJKFont),
    ...lastSerifFonts.filter(
      (font) => SERIF_FONTS.includes(font) && !lastSerifFonts.includes(defaultCJKFont),
    ),
    ...FALLBACK_FONTS,
  ].filter(Boolean);
  const sansSerifFonts = [
    sansSerif,
    ...(defaultCJKFont && defaultCJKFont !== sansSerif ? [defaultCJKFont] : []),
    ...SANS_SERIF_FONTS.filter((font) => font !== sansSerif && font !== defaultCJKFont),
    ...CJK_SANS_SERIF_FONTS.filter((font) => font !== sansSerif && font !== defaultCJKFont),
    ...FALLBACK_FONTS,
  ].filter(Boolean);
  const monospaceFonts = [monospace, ...MONOSPACE_FONTS.filter((font) => font !== monospace)];
  const defaultFontFamily = defaultFont.toLowerCase() === 'serif' ? '--serif' : '--sans-serif';
  return `
    html {
      --serif: ${serifFonts.map((font) => `"${font}"`).join(', ')}, serif;
      --sans-serif: ${sansSerifFonts.map((font) => `"${font}"`).join(', ')}, sans-serif;
      --monospace: ${monospaceFonts.map((font) => `"${font}"`).join(', ')}, monospace;
      --font-size: ${fontSize}px;
      --min-font-size: ${minFontSize}px;
      --font-weight: ${fontWeight};
    }
    html, body {
      font-size: ${fontSize}px !important;
      font-weight: ${fontWeight};
      -webkit-text-size-adjust: none;
      text-size-adjust: none;
    }
    html {
      font-family: var(${defaultFontFamily}) ${overrideFont ? '!important' : ''};
    }
    html body {
      ${overrideFont ? `font-family: var(${defaultFontFamily}) !important;` : ''}
    }
    font[size="1"] { font-size: ${minFontSize}px; }
    font[size="2"] { font-size: ${minFontSize * 1.5}px; }
    font[size="3"] { font-size: ${fontSize}px; }
    font[size="4"] { font-size: ${fontSize * 1.2}px; }
    font[size="5"] { font-size: ${fontSize * 1.5}px; }
    font[size="6"] { font-size: ${fontSize * 2}px; }
    font[size="7"] { font-size: ${fontSize * 3}px; }
    [style*="font-size: 16px"], [style*="font-size:16px"] {
      font-size: 1rem !important;
    }
    pre, code, kbd {
      font-family: var(--monospace);
    }
  `;
};

const getColorStyles = (
  overrideColor: boolean,
  invertImgColorInDark: boolean,
  themeCode: { bg: string; fg: string; primary: string; isDarkMode: boolean },
  backgroundTextureId: string,
  isEink: boolean,
) => {
  const { bg, fg, primary, isDarkMode } = themeCode;
  const hasBackgroundTexture = !!backgroundTextureId && backgroundTextureId !== 'none';
  return `
    html {
      --theme-bg-color: ${bg};
      --theme-fg-color: ${fg};
      --theme-primary-color: ${primary};
      color-scheme: ${isDarkMode ? 'dark' : 'light'};
    }
    html, body {
      color: ${fg};
    }
    html[has-background], body[has-background] {
      --background-set: var(--theme-bg-color);
    }
    html {
      background-color: var(--theme-bg-color, transparent);
      background: var(--background-set, none);
    }
    body {
      ${isEink ? `background-color: ${bg} !important;` : ''}
    }
    section, aside, blockquote, article, nav, header, footer, main, figure,
    div, p, font, h1, h2, h3, h4, h5, h6, li, span {
      ${overrideColor && !hasBackgroundTexture ? `background-color: ${bg} !important;` : ''}
      ${overrideColor && !hasBackgroundTexture ? `color: ${fg} !important;` : ''}
      ${overrideColor && !hasBackgroundTexture ? `border-color: ${fg} !important;` : ''}
    }
    pre, span {
      ${overrideColor ? `background-color: ${bg} !important;` : ''}
    }
    a:any-link {
      ${overrideColor ? `color: ${primary} !important;` : isDarkMode ? 'color: lightblue;' : ''}
      text-decoration: none;
    }
    img {
      ${isDarkMode && invertImgColorInDark ? 'filter: invert(100%);' : ''}
      ${!isDarkMode && overrideColor ? 'mix-blend-mode: multiply;' : ''}
    }
    svg, img {
      ${overrideColor ? 'background-color: transparent !important;' : ''}
    }
    *:has(> hr.background-img):not(body) {
      background-color: ${bg};
    }
    hr.background-img {
      mix-blend-mode: multiply;
    }
    *:has(> img.has-text-siblings):not(body) {
      ${overrideColor ? `background-color: ${bg};` : ''}
    }
    p img.has-text-siblings, span img.has-text-siblings, sup img.has-text-siblings {
      mix-blend-mode: ${isDarkMode ? 'screen' : 'multiply'};
    }
    table {
      overflow: auto;
      display: table !important;
    }
    table:has(> colgroup) {
      table-layout: fixed;
    }
    body.theme-dark code {
      ${isDarkMode ? `color: ${fg}cc;` : ''}
      ${isDarkMode ? `background: color-mix(in srgb, ${bg} 90%, #000);` : ''}
    }
    blockquote {
      ${isDarkMode ? `background: color-mix(in srgb, ${bg} 80%, #000);` : ''}
    }
    blockquote, table * {
      ${isDarkMode && overrideColor ? `background: color-mix(in srgb, ${bg} 80%, #000);` : ''}
    }
    font[color="#000000"], font[color="#000"], font[color="black"],
    font[color="rgb(0,0,0)"], font[color="rgb(0, 0, 0)"],
    *[style*="color: rgb(0,0,0)"], *[style*="color: rgb(0, 0, 0)"],
    *[style*="color: #000"], *[style*="color: #000000"], *[style*="color: black"],
    *[style*="color:rgb(0,0,0)"], *[style*="color:rgb(0, 0, 0)"],
    *[style*="color:#000"], *[style*="color:#000000"], *[style*="color:black"] {
      color: ${fg} !important;
    }
    #pg-header * {
      color: inherit !important;
    }
    .x-ebookmaker, .x-ebookmaker-cover, .x-ebookmaker-coverpage {
      background-color: unset !important;
    }
    .chapterHeader, .chapterHeader * {
      border-color: unset;
      background-color: ${bg} !important;
    }
    .calibre {
      color: unset;
      background-color: unset;
    }
  `;
};

const getPageLayoutStyles = (
  marginTop: number,
  marginRight: number,
  marginBottom: number,
  marginLeft: number,
) => `
  @namespace epub "http://www.idpf.org/2007/ops";
  html {
    --margin-top: ${marginTop}px;
    --margin-right: ${marginRight}px;
    --margin-bottom: ${marginBottom}px;
    --margin-left: ${marginLeft}px;
  }
  html, body {
    max-height: unset;
    -webkit-touch-callout: none;
    -webkit-user-select: text;
  }
  body {
    overflow: unset;
    zoom: 1;
    padding: unset;
    margin: unset;
  }
  svg:where(:not([width])), img:where(:not([width])) {
    width: auto;
  }
  svg:where(:not([height])), img:where(:not([height])) {
    height: auto;
  }
  figure > div:has(img) {
    height: auto !important;
  }
  a {
    position: relative !important;
  }
  a::before {
    content: '';
    position: absolute;
    inset: -10px;
  }
  pre {
    white-space: pre-wrap !important;
  }
  .epubtype-footnote,
  aside[epub|type~="endnote"],
  aside[epub|type~="footnote"],
  aside[epub|type~="note"],
  aside[epub|type~="rearnote"] {
    display: none;
  }
  body {
    line-height: unset;
  }
  .duokan-footnote-content,
  .duokan-footnote-item {
    display: none;
  }
  div:has(> img, > svg) {
    max-width: 100% !important;
  }
  body.paginated-mode td:has(img), body.paginated-mode td :has(img) {
    max-height: calc(var(--available-height) * 0.8 * 1px);
  }
  p {
    display: block;
  }
  .ie6 img {
    width: unset;
    height: unset;
  }
  sup img {
    height: 1em;
  }
  img.has-text-siblings {
    height: 1em;
    vertical-align: baseline;
  }
  :is(div) > img.has-text-siblings[style*="object-fit"] {
    display: block;
    height: auto;
    vertical-align: unset;
  }
  .duokan-footnote img:not([class]) {
    width: 0.8em;
    height: 0.8em;
  }
  div:has(img.singlepage) {
    position: relative;
    width: auto;
    height: auto;
  }
  body.paginated-mode div[style*="page-break-after: always"],
  body.paginated-mode div[style*="page-break-after:always"],
  body.paginated-mode p[style*="page-break-after: always"],
  body.paginated-mode p[style*="page-break-after:always"] {
    margin-bottom: calc(var(--available-height) * 1px);
  }
  .br {
    display: flow-root;
  }
  .h5_mainbody {
    overflow: unset !important;
  }
`;

const getParagraphLayoutStyles = (
  overrideLayout: boolean,
  paragraphMargin: number,
  lineSpacing: number,
  wordSpacing: number,
  letterSpacing: number,
  textIndent: number,
  justify: boolean,
  hyphenate: boolean,
) => `
  html {
    --default-text-align: ${justify ? 'justify' : 'start'};
    hanging-punctuation: allow-end last;
    orphans: 2;
    widows: 2;
  }
  html, body {
    text-align: var(--default-text-align);
  }
  [align="left"] { text-align: left; }
  [align="right"] { text-align: right; }
  [align="center"] { text-align: center; }
  [align="justify"] { text-align: justify; }
  :is(hgroup, header) p {
    text-align: unset;
    hyphens: unset;
  }
  p, blockquote, dd, div:not(:has(*:not(b, a, em, i, strong, u, span))) {
    line-height: ${lineSpacing} ${overrideLayout ? '!important' : ''};
    word-spacing: ${wordSpacing}px ${overrideLayout ? '!important' : ''};
    letter-spacing: ${letterSpacing}px ${overrideLayout ? '!important' : ''};
    text-indent: ${textIndent}em ${overrideLayout ? '!important' : ''};
    -webkit-hyphens: ${hyphenate ? 'auto' : 'manual'};
    hyphens: ${hyphenate ? 'auto' : 'manual'};
    -webkit-hyphenate-limit-before: 3;
    -webkit-hyphenate-limit-after: 2;
    -webkit-hyphenate-limit-lines: 2;
    hanging-punctuation: allow-end last;
    widows: 2;
  }
  li {
    line-height: ${lineSpacing} ${overrideLayout ? '!important' : ''};
    -webkit-hyphens: ${hyphenate ? 'auto' : 'manual'};
    hyphens: ${hyphenate ? 'auto' : 'manual'};
  }
  p.aligned-center, blockquote.aligned-center,
  dd.aligned-center, div.aligned-center {
    text-align: center ${overrideLayout ? '!important' : ''};
  }
  p.aligned-left, blockquote.aligned-left,
  dd.aligned-left, div.aligned-left {
    ${justify && overrideLayout ? 'text-align: justify !important;' : ''}
  }
  p.aligned-right, blockquote.aligned-right,
  dd.aligned-right, div.aligned-right {
    text-align: right ${overrideLayout ? '!important' : ''};
  }
  p.aligned-justify, blockquote.aligned-justify,
  dd.aligned-justify, div.aligned-justify {
    ${!justify && overrideLayout ? 'text-align: initial !important;' : ''}
  }
  p:has(> img:only-child), p:has(> span:only-child > img:only-child),
  p:has(> img:not(.has-text-siblings)),
  p:has(> a:first-child + img:last-child) {
    text-indent: initial !important;
  }
  blockquote[align="center"], div[align="center"],
  p[align="center"], dd[align="center"],
  p.aligned-center, blockquote.aligned-center,
  dd.aligned-center, div.aligned-center,
  li p, ol p, ul p, td p {
    text-indent: initial !important;
  }
  p {
    margin-top: ${paragraphMargin}em ${overrideLayout ? '!important' : ''};
    margin-bottom: ${paragraphMargin}em ${overrideLayout ? '!important' : ''};
    margin-left: unset ${overrideLayout ? '!important' : ''};
    margin-right: unset ${overrideLayout ? '!important' : ''};
  }
  div {
    ${overrideLayout ? `margin-top: ${paragraphMargin}em !important;` : ''}
    ${overrideLayout ? `margin-bottom: ${paragraphMargin}em !important;` : ''}
  }
  div.left *, p.left * { text-align: left; }
  div.right *, p.right * { text-align: right; }
  div.center *, p.center * { text-align: center; }
  div.justify *, p.justify * { text-align: justify; }
  .nonindent, .noindent {
    text-indent: unset !important;
  }
`;

export function getStyles(s: BookSettings): string {
  const palette = themes[s.theme] ?? themes.light;
  const { bg, fg, primary, isDarkMode } = palette;

  const pageLayoutStyles = getPageLayoutStyles(40, 0, 40, 0);
  const paragraphLayoutStyles = getParagraphLayoutStyles(
    false,
    s.paragraphMargin,
    s.lineHeight,
    0,
    0,
    0,
    true,
    false,
  );
  const fontStyles = getFontStyles(
    s.serifFont,
    s.sansSerifFont,
    'Courier New',
    s.defaultFont,
    '',
    s.defaultFontSize * FONT_SCALE,
    8,
    s.fontWeight,
    false,
  );
  const colorStyles = getColorStyles(false, false, { bg, fg, primary, isDarkMode }, '', false);

  return `${pageLayoutStyles}\n${paragraphLayoutStyles}\n${fontStyles}\n${colorStyles}`;
}

export function transformStylesheet(css: string, vw: number, vh: number, vertical: boolean): string {
  const isInlineStyle = !css.includes('{');
  const ruleRegex = /([^{]+)({[^}]+})/g;

  css = css.replace(ruleRegex, (match, selector, block) => {
    const hasTextAlignCenter = /text-align\s*:\s*center\s*[;$]/.test(block);
    const hasTextIndentZero = /text-indent\s*:\s*0(?:\.0+)?(?:px|em|rem|%)?\s*[;$]/.test(block);
    if (hasTextAlignCenter && hasTextIndentZero) {
      block = block.replace(/(text-align\s*:\s*center)(\s*;|\s*$)/g, '$1 !important$2');
      block = block.replace(
        /(text-indent\s*:\s*0(?:\.0+)?(?:px|em|rem|%)?)(\s*;|\s*$)/g,
        '$1 !important$2',
      );
      return selector + block;
    }
    return match;
  });

  css = css.replace(ruleRegex, (match, selector, block) => {
    const hasWhiteSpaceNowrap = /white-space\s*:\s*nowrap\s*[;$]/.test(block);
    if (hasWhiteSpaceNowrap) {
      if (!/overflow\s*:/.test(block)) {
        block = block.replace(/}$/, ' overflow: clip !important; }');
      }
      return selector + block;
    }
    return match;
  });

  if (isInlineStyle) {
    const hasPageBreakAfterAlways = /page-break-after\s*:\s*always\s*[;]?/.test(css);
    if (hasPageBreakAfterAlways && !/margin-bottom\s*:/.test(css)) {
      css = css.replace(/;?\s*$/, '') + '; margin-bottom: calc(var(--available-height) * 1px)';
    }
  } else {
    css = css.replace(ruleRegex, (match, selector, block) => {
      const hasPageBreakAfterAlways = /page-break-after\s*:\s*always\s*[;$]/.test(block);
      if (hasPageBreakAfterAlways) {
        if (!/margin-bottom\s*:/.test(block)) {
          block = block.replace(/}$/, ' margin-bottom: calc(var(--available-height) * 1px); }');
        }
        return selector + block;
      }
      return match;
    });
  }

  css = css.replace(ruleRegex, (_, selector, block) => {
    if (vertical) return selector + block;
    const directions: string[] = [];
    let hasBleed = false;
    for (const dir of ['top', 'bottom', 'left', 'right']) {
      const bleedRegex = new RegExp(`duokan-bleed\\s*:\\s*[^;]*${dir}[^;]*;`);
      const marginRegex = new RegExp(`margin-${dir}\\s*:`);
      if (bleedRegex.test(block) && !marginRegex.test(block)) {
        hasBleed = true;
        directions.push(dir);
        block = block.replace(
          /}$/,
          ` margin-${dir}: calc(-1 * var(--page-margin-${dir})) !important; }`,
        );
      }
    }
    if (hasBleed) {
      if (!/position\s*:/.test(block)) block = block.replace(/}$/, ' position: relative !important; }');
      if (!/overflow\s*:/.test(block)) block = block.replace(/}$/, ' overflow: hidden !important; }');
      if (!/display\s*:/.test(block)) block = block.replace(/}$/, ' display: flow-root !important; }');
      if (directions.includes('left') && directions.includes('right')) {
        block = block
          .replace(/}$/, ' width: calc(var(--available-width) * 1px) !important; }')
          .replace(/}$/, ' min-width: calc(var(--available-width) * 1px) !important; }')
          .replace(/}$/, ' max-width: calc(var(--available-width) * 1px) !important; }');
      }
      if (directions.includes('top') && directions.includes('bottom')) {
        block = block
          .replace(/}$/, ' height: calc(var(--available-height) * 1px) !important; }')
          .replace(/}$/, ' min-height: calc(var(--available-height) * 1px) !important; }')
          .replace(/}$/, ' max-height: calc(var(--available-height) * 1px) !important; }');
      }
    }
    return selector + block;
  });

  css = css.replace(ruleRegex, (_, selector, block) => {
    if (/\bbody\b/i.test(selector)) {
      const hasSerifFont = /font-family\s*:\s*serif\s*(?:;|\}|$)/.test(block);
      const hasSansSerifFont = /font-family\s*:\s*sans-serif\s*(?:;|\}|$)/.test(block);
      if (hasSerifFont) {
        block = block.replace(/font-family\s*:\s*serif\s*(;|\}|$)/gi, 'font-family: unset$1');
      }
      if (hasSansSerifFont) {
        block = block.replace(/font-family\s*:\s*sans-serif\s*(;|\}|$)/gi, 'font-family: unset$1');
      }
    }
    return selector + block;
  });

  css = css.replace(ruleRegex, (match, selector, block) => {
    const widthMatch = /(?:^|[^a-z-])width\s*:\s*(\d+(?:\.\d+)?)px/.exec(block);
    const pxWidth = widthMatch ? parseFloat(widthMatch[1] ?? '0') : 0;
    if (pxWidth > vw && !/max-width\s*:/.test(block)) {
      block = block.replace(
        /}$/,
        ' width: 100%; max-width: calc(var(--available-width) * 1px); box-sizing: border-box; }',
      );
      return selector + block;
    }
    return match;
  });

  css = css
    .replace(/font-size\s*:\s*xx-small/gi, 'font-size: 0.6rem')
    .replace(/font-size\s*:\s*x-small/gi, 'font-size: 0.75rem')
    .replace(/font-size\s*:\s*small/gi, 'font-size: 0.875rem')
    .replace(/font-size\s*:\s*medium/gi, 'font-size: 1rem')
    .replace(/font-size\s*:\s*large/gi, 'font-size: 1.2rem')
    .replace(/font-size\s*:\s*x-large/gi, 'font-size: 1.5rem')
    .replace(/font-size\s*:\s*xx-large/gi, 'font-size: 2rem')
    .replace(/font-size\s*:\s*xxx-large/gi, 'font-size: 3rem')
    .replace(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi, (_, px) => {
      const rem = parseFloat(px) / FONT_SCALE / 16;
      return `font-size: ${rem}rem`;
    })
    .replace(/font-size\s*:\s*(\d+(?:\.\d+)?)pt/gi, (_, pt) => {
      const rem = parseFloat(pt) / FONT_SCALE / 12;
      return `font-size: ${rem}rem`;
    })
    .replace(/font-size\s*:\s*(\d*\.?\d+)(px|rem|em|%)?/gi, (_, size, unit = 'px') => {
      return `font-size: max(${size}${unit}, var(--min-font-size, 8px))`;
    })
    .replace(/backdrop-filter\s*:\s*brightness\(100%\)\s*[;]?/gi, '')
    .replace(/(\d*\.?\d+)vw/gi, (_, d) => (parseFloat(d) * vw) / 100 + 'px')
    .replace(/(\d*\.?\d+)vh/gi, (_, d) => (parseFloat(d) * vh) / 100 + 'px')
    .replace(/([\s;])-webkit-user-select\s*:\s*none/gi, '$1-webkit-user-select: unset')
    .replace(/([\s;])-moz-user-select\s*:\s*none/gi, '$1-moz-user-select: unset')
    .replace(/([\s;])-ms-user-select\s*:\s*none/gi, '$1-ms-user-select: unset')
    .replace(/([\s;])-o-user-select\s*:\s*none/gi, '$1-o-user-select: unset')
    .replace(/([\s;])user-select\s*:\s*none/gi, '$1user-select: unset')
    .replace(/(font-family\s*:[^;]*?)\bsans-serif\b/gi, '$1READEST_SS_PLACEHOLDER')
    .replace(/(font-family\s*:[^;]*?)\bserif\b(?!-)/gi, '$1var(--serif, serif)')
    .replace(/READEST_SS_PLACEHOLDER/g, 'var(--sans-serif, sans-serif)')
    .replace(/(font-family\s*:[^;]*?)\bmonospace\b/gi, '$1var(--monospace, monospace)')
    .replace(/([\s;])font-weight\s*:\s*normal/gi, '$1font-weight: var(--font-weight)')
    .replace(/([\s;])color\s*:\s*black/gi, '$1color: var(--theme-fg-color)')
    .replace(/([\s;])color\s*:\s*#000000/gi, '$1color: var(--theme-fg-color)')
    .replace(/([\s;])color\s*:\s*#000/gi, '$1color: var(--theme-fg-color)')
    .replace(/([\s;])color\s*:\s*rgb\(0,\s*0,\s*0\)/gi, '$1color: var(--theme-fg-color)');
  return css;
}

export function applyThemeModeClass(doc: Document, isDarkMode: boolean): void {
  doc.body.classList.remove('theme-light', 'theme-dark');
  doc.body.classList.add(isDarkMode ? 'theme-dark' : 'theme-light');
}

export function applyScrollModeClass(doc: Document, isScrollMode: boolean): void {
  doc.body.classList.remove('scroll-mode', 'paginated-mode');
  doc.body.classList.add(isScrollMode ? 'scroll-mode' : 'paginated-mode');
}

export function applyScrollbarStyle(doc: Document, hideScrollbar: boolean): void {
  const styleId = 'scrollbar-hide-style';
  let styleEl = doc.getElementById(styleId) as HTMLStyleElement | null;
  if (hideScrollbar) {
    if (!styleEl) {
      styleEl = doc.createElement('style');
      styleEl.id = styleId;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = 'foliate-view::part(container) { scrollbar-width: none; }';
  } else if (styleEl) {
    styleEl.textContent = 'foliate-view::part(container) { scrollbar-width: thin; }';
  }
}

export function applyImageStyle(doc: Document): void {
  doc.querySelectorAll('img').forEach((img) => {
    const widthAttr = img.getAttribute('width');
    if (widthAttr && (widthAttr.endsWith('%') || widthAttr.endsWith('vw'))) {
      const percentage = parseFloat(widthAttr);
      if (!isNaN(percentage)) {
        img.style.width = `${(percentage / 100) * window.innerWidth}px`;
        img.removeAttribute('width');
      }
    }
    const heightAttr = img.getAttribute('height');
    if (heightAttr && (heightAttr.endsWith('%') || heightAttr.endsWith('vh'))) {
      const percentage = parseFloat(heightAttr);
      if (!isNaN(percentage)) {
        img.style.height = `${(percentage / 100) * window.innerHeight}px`;
        img.removeAttribute('height');
      }
    }
    const parent = img.parentNode;
    if (!parent || parent.nodeType !== Node.ELEMENT_NODE) return;
    const hasTextSiblings = Array.from(parent.childNodes).some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    );
    const isInline = Array.from(parent.childNodes).every(
      (node) => node.nodeType !== Node.ELEMENT_NODE || (node as Element).tagName !== 'BR',
    );
    if (hasTextSiblings && isInline) {
      img.classList.add('has-text-siblings');
    }
  });
  doc.querySelectorAll('hr').forEach((hr) => {
    const computedStyle = window.getComputedStyle(hr);
    if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
      hr.classList.add('background-img');
    }
  });
}

export function applyTableStyle(doc: Document): void {
  doc.querySelectorAll('table').forEach((table) => {
    const parent = table.parentNode;
    if (!parent || parent.nodeType !== Node.ELEMENT_NODE) return;

    let totalTableWidth = 0;
    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th');
      let rowWidth = 0;
      cells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        const widthAttr = cellElement.getAttribute('width');
        const styleWidth = cellElement.style.width;
        const widthStr = widthAttr || styleWidth;
        if (widthStr) {
          const widthValue = parseFloat(widthStr);
          const widthUnit = widthStr.replace(widthValue.toString(), '').trim();
          if (widthUnit === 'px' || !widthUnit) rowWidth += widthValue;
        }
      });
      if (rowWidth > totalTableWidth) totalTableWidth = rowWidth;
    }

    const parentWidth = window.getComputedStyle(parent as Element).width;
    const parentContainerWidth = parseFloat(parentWidth) || 0;
    if (totalTableWidth > 0) {
      table.style.transformOrigin = 'left top';
      table.style.transform = `scale(calc(min(1, var(--available-width) / ${totalTableWidth})))`;
    } else if (parentContainerWidth > 0) {
      table.style.transformOrigin = 'center top';
      table.style.transform = `scale(calc(min(1, var(--available-width) / ${parentContainerWidth})))`;
    }
  });
}

export function keepTextAlignment(doc: Document): void {
  doc.querySelectorAll('div, p, blockquote, dd').forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    if (computedStyle.textAlign === 'center') {
      el.classList.add('aligned-center');
    } else if (computedStyle.textAlign === 'left') {
      el.classList.add('aligned-left');
    } else if (computedStyle.textAlign === 'right') {
      el.classList.add('aligned-right');
    } else if (computedStyle.textAlign === 'justify') {
      el.classList.add('aligned-justify');
    }
  });
}
