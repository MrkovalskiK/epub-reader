# EPUB Reader

Мобильное приложение для чтения EPUB-файлов, разработанное в рамках тестового задания.
Платформа: Android. Работает полностью офлайн.

---

## Содержание

1. [Архитектура](#архитектура)
2. [Работа с EPUB](#работа-с-epub)
3. [Работа с данными](#работа-с-данными)
4. [Обработка ошибок](#обработка-ошибок)
5. [Производительность](#производительность)
6. [Используемые библиотеки](#используемые-библиотеки)
7. [Требования к окружению](#требования-к-окружению)
8. [Инструкция по сборке](#инструкция-по-сборке)
9. [Потенциальные риски и ограничения](#потенциальные-риски-и-ограничения)

---

## Архитектура

### Общий подход

**Tauri 2** (Rust backend + WebView frontend) с **React 19 + TypeScript + Vite**

#### Почему Tauri, а не React Native?

- **EPUB = HTML/CSS/JS**: рендеринг в WebView естествен, избегаем реализации собственного движка вёрстки
- **Rust backend**: нативные возможности Android без JVM/Kotlin

#### Почему foliate-js?

- Активно поддерживаемая open-source библиотека (основа Gnome Books)
- Поддержка EPUB2, EPUB3, CFI-позиций, оглавления (TOC)
- Нативный рендеринг через `<foliate-view>` custom element в WebView
- Не требует ArrayBuffer-передачи через IPC — читает файл напрямую

### Схема слоёв

```
Tauri Rust backend
  ↓
  (native-bridge: copy_uri_to_path)
  ↓
Services
  ├── epubService.ts   — импорт EPUB, извлечение метаданных, сохранение обложки
  └── storageService.ts — персистентность (library, progress, settings)
  ↓
Store (Zustand)
  ├── libraryStore    — список книг, инициализация, добавление/удаление
  └── readerStore     — текущий CFI, fraction, TOC, режим чтения, настройки
  ↓
Screens
  ├── LibraryScreen   — библиотека книг
  └── ReaderScreen    — экран чтения
  ↓
Components
  ├── EpubViewer          — рендеринг через foliate-js
  ├── ReaderNav           — навигация, настройки шрифта/темы
  ├── TableOfContents     — оглавление
  ├── BookCard            — карточка книги в библиотеке
  ├── BookDetailsSheet    — детали книги (описание, жанры, издатель)
  ├── BookActionSheet     — действия (удалить)
  ├── ErrorBlock          — отображение ошибок
  └── AppErrorBoundary    — глобальный React error boundary
```

### Типы данных

#### Book

```typescript
interface Book {
  id: string;           // SHA-256 от content URI файла
  title: string;
  author: string;
  localPath: string;    // путь в appDataDir/books/{id}.epub
  coverPath?: string;   // путь в appDataDir/books/{id}/cover.*
  coverImageUrl?: string | null;  // asset URL для отображения
  addedAt: number;      // Unix timestamp (ms)
  description?: string;
  genres?: string[];
  publisher?: string;
  publishDate?: string;
}
```

#### ReadingProgress

```typescript
interface ReadingProgress {
  bookId: string;
  cfi: string;      // EPUB CFI позиция
  fraction: number; // 0.0–1.0
  updatedAt: number;
}
```

#### BookSettings (per-book)

```typescript
interface BookSettings {
  theme: 'light' | 'dark' | 'sepia';
  defaultFont: 'Serif' | 'Sans-serif';
  serifFont: string;
  sansSerifFont: string;
  defaultFontSize: number;
  fontWeight: number;
  lineHeight: number;
  paragraphMargin: number;
  scrolled: boolean;
}
```

### Зоны ответственности

| Слой | Обязанности |
|---|---|
| **Services** | Внешние вызовы (Tauri IPC, foliate-js, FS); преобразование данных; работа с файлами |
| **Store** | Единый источник правды; триггер персистентности |
| **Screens** | Оркестрация бизнес-логики экрана; управление навигацией |
| **Components** | Переиспользуемые UI-блоки; presentation logic |

---

## Работа с EPUB

### Поток импорта файла

```
Android file picker (ACTION_OPEN_DOCUMENT)
  ↓
  (content URI: content://...)
  ↓
native-bridge: copy_uri_to_path(uri, dst)
  (Rust копирует файл в appDataDir/books/{sha256}.epub)
  ↓
extractEpubMetadata(localPath)
  (foliate-js: makeBook → metadata.title, author, description, genres, publisher, publishDate)
  ↓
saveCover(book, localPath)
  (foliate-js: getCover() → Blob → writeFile)
  ↓
generateCoverImageUrl(book)
  (convertFileSrc → asset URL для WebView)
  ↓
libraryStore.addBook(book)
```

### Рендеринг EPUB

```
EpubViewer mount
  ↓
document.createElement('foliate-view')
  ↓
view.open(file)   ← File object из readFile(localPath)
  ↓
view.addEventListener('relocate', ...)   ← CFI + fraction
view.addEventListener('load', ...)       ← TOC
  ↓
view.goTo(savedCfi)   ← восстановление позиции
```

### Режимы чтения

| Режим | Описание |
|---|---|
| **paginated** | Пагинация (по умолчанию) |
| **scrolled** | Вертикальный скролл |

Режим сохраняется per-book в `book-settings.json` (поле `scrolled` в `BookSettings`).

### CFI (Canonical Fragment Identifier)

**Что это?** Точная позиция в документе, независящая от размера экрана.

**Как хранится?** Вместе с `fraction` (0.0–1.0) в `reading-progress.json` per-book.

**Восстановление позиции:**
```javascript
view.goTo(savedCfi)  // при открытии книги
```

### Темы и настройки

- Темы: `light`, `dark`, `sepia` — CSS применяется через foliate-js `setStyles()`
- Настройки per-book: шрифт, размер, межстрочный интервал, отступы
- Сохраняются в `book-settings.json` при закрытии книги (back navigation)

### EPUB2 vs EPUB3

foliate-js нормализует оба формата — TOC доступен единообразно через событие `load`.

### Ограничения

| Ограничение | Описание |
|---|---|
| **Нет поддержки DRM** | Защищённые EPUB не работают |
| **Сложные CSS-макеты** | Могут отличаться от специализированных читалок |
| **Большие файлы** | Медленная загрузка при >50MB |

---

## Работа с данными

### Персистентность

Данные хранятся в **трёх отдельных JSON-файлах** через `tauri-plugin-store` (`LazyStore`):

| Файл | Содержимое |
|---|---|
| `library.json` | Массив `Book[]` |
| `reading-progress.json` | Map `bookId → ReadingProgress` |
| `book-settings.json` | Map `bookId → BookSettings` |

**Преимущество перед localStorage:** файлы переживают перезапуск WebView и хранятся в sandbox приложения.

### Схема сохранения прогресса

```
foliate-view 'relocate' event
  ↓
readerStore.setCfi(cfi, fraction)   ← немедленно в памяти
  ↓
saveProgress(bookId, cfi, fraction) ← debounce 500ms
  ↓
progressStore.set(bookId, {...})
progressStore.save()
  ↓
reading-progress.json
```

### Инициализация библиотеки

```
App mount
  ↓
libraryStore.init()
  ↓
loadLibrary()                      ← library.json
  ↓
generateCoverImageUrl() для каждой книги (batch по 20)
  ↓
set({ books, initialized: true })
  ↓
рендер LibraryScreen
```

Пока `initialized === false` — показывается спиннер загрузки.

### ID книги

```typescript
id = SHA-256(contentUri)  // уникален per-file, стабилен при повторном импорте
```

### Удаление книги

При удалении очищается: `library.json`, `reading-progress.json`, `book-settings.json`, файл EPUB и папка с обложкой.

---

## Обработка ошибок

| Сценарий | Обработка |
|---|---|
| **Импорт: copy_uri_to_path fails** | Выброс ошибки → UI показывает сообщение |
| **Импорт: извлечение метаданных fails** | Fallback: title из имени файла, author = "Unknown Author" |
| **Рендеринг: файл недоступен** | `view.open()` fails → ErrorBlock в ReaderScreen |
| **Пустое оглавление** | TOC пуст → кнопка "Оглавление" не показывает элементов |
| **Сбой рендеринга React** | AppErrorBoundary → ErrorBlock с возможностью вернуться |
| **Обложка недоступна** | `imgFailed` state → fallback иконка 📖 |
| **Настройки не загружены** | Fallback на `DEFAULT_BOOK_SETTINGS` |

---

## Производительность

| Проблема | Решение |
|---|---|
| **Долгая загрузка обложек** | Batch-загрузка по 20 книг при инициализации |
| **Частая запись прогресса** | Debounce 500ms на `saveProgress()` |
| **Лишние ре-рендеры EpubViewer** | `forwardRef` + `useCallback` + `useRef` для stale closure |
| **Загрузка обложек при старте** | `initialized` флаг — UI не рендерится до готовности |
| **SVG обложки** | Конвертируются в PNG через `svg2png()` перед сохранением |

---

## Используемые библиотеки

| Библиотека | Версия | Назначение | Обоснование |
|---|---|---|---|
| **foliate-js** | github upstream | Парсинг + рендеринг EPUB | Активный проект; EPUB2/3; CFI; TOC; getCover() |
| **konsta** | 5 | UI-компоненты | Mobile-first; iOS + Material стиль; Tailwind-based |
| **tailwindcss** | 4 | Стилизация | Требуется для Konsta; utility-first |
| **zustand** | 5 | Управление состоянием | Минимальный boilerplate; без Provider |
| **lucide-react** | 1 | Иконки | Tree-shakeable SVG иконки |
| **dayjs** | 1 | Форматирование дат | 2KB; относительное время ("2 часа назад") |
| **tauri-plugin-dialog** | 2 | Нативный file picker | Android file selection; фильтр .epub |
| **tauri-plugin-fs** | 2 | Чтение/запись файлов | Чтение EPUB и запись обложек |
| **tauri-plugin-store** | 2 | Персистентность | LazyStore; отдельные JSON-файлы на устройстве |
| **@tauri-apps/api** | 2 | Tauri API client | invoke, convertFileSrc, path utils |

---

## Требования к окружению

### Инструменты

| Инструмент | Версия | Установка |
|---|---|---|
| **Rust** | 1.77+ | `rustup install stable` |
| **Node.js** | 20+ | `nvm install 20` |
| **pnpm** | 9+ | `npm install -g pnpm@9` |
| **Android SDK** | API 34 | Android Studio SDK Manager |
| **Android NDK** | 27 | Android Studio SDK Manager |
| **Java** | 17 | `JAVA_HOME` → JDK 17 |

### Переменные окружения

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/27.x.x
export JAVA_HOME=/path/to/jdk-17
```

### Проверка окружения

```bash
rustc --version    # ≥ 1.77
node --version     # ≥ 20
pnpm --version     # ≥ 9
java -version      # ≥ 17
adb --version      # для установки на устройство
```

---

## Инструкция по сборке

### 1. Клонирование и подготовка

```bash
git clone https://github.com/MrkovalskiK/epub-reader
cd epub-reader

pnpm install

# Инициализировать Android-проект (первый раз)
pnpm tauri android init
```

### 2. Debug APK (разработка)

```bash
pnpm tauri android build --debug

# APK: src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk

adb install src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk

# Или с hot reload:
pnpm tauri android dev
```

### 3. Release APK

```bash
pnpm tauri android build --release

# APK: src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk
```

### 4. Логи и отладка

```bash
# Логи Android
adb logcat | grep -i tauri

# WebView DevTools
# Chrome: chrome://inspect/#devices (USB-отладка)
```

---

## Потенциальные риски и ограничения

### Риски

| Риск | Описание | Вероятность | Митигация |
|---|---|---|---|
| **Различия WebView на Android 8–14** | CSS-рендеринг EPUB может отличаться | HIGH | Тестирование на нескольких версиях |
| **Нестабильный CFI для нестандартных EPUB** | foliate-js не гарантирует CFI для повреждённых файлов | MEDIUM | Fallback на начало книги при ошибке |
| **Потеря данных при удалении приложения** | tauri-plugin-store хранит в sandbox | MEDIUM | Документировано; будущая задача: экспорт |
| **Файл перемещён пользователем** | localPath становится невалидным | MEDIUM | ErrorBlock + удаление из библиотеки |

### Функциональные ограничения

| Ограничение | Статус |
|---|---|
| Нет поддержки DRM | Не планируется |
| Нет шифрования хранилища | Не хранить чувствительные данные |
| Файл читается заново при каждом открытии | Нет кэширования parsed book |

---

## Лицензия

MIT
