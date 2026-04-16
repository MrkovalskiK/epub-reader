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
6. [Эксплуатация в production](#эксплуатация-в-production)
7. [Используемые библиотеки](#используемые-библиотеки)
8. [Требования к окружению](#требования-к-окружению)
9. [Инструкция по сборке](#инструкция-по-сборке)
10. [Потенциальные риски и ограничения](#потенциальные-риски-и-ограничения)

---

## Архитектура

### Общий подход

**Tauri 2** (Rust backend + WebView frontend) с **React 19 + TypeScript**

#### Почему Tauri, а не React Native?

- **EPUB = HTML/CSS/JS**: рендеринг в WebView естествен, избегаем реализации собственного движка верстки
- **Rust backend**: нативные возможности Android без JVM/Kotlin
- **Единая кодовая база**: код фронтенда можно переиспользовать между web и mobile

#### Почему epubjs?

- Отраслевой стандарт
- Поддержка CFI-позиций (точные позиции в документе)
- Автоматическое извлечение оглавления (TOC)
- Единый API для EPUB2 и EPUB3

### Схема слоёв

```
Tauri Rust backend
  ↓
  (pick_epub_file, read_epub_file, save_state, load_state)
  ↓
Services (src/services/tauri.ts — типизированные invoke-обёртки)
  ↓
Store (Zustand: library[], readerSettings, isHydrated)
  ↓
Store Persistence (hydrateStore / persistStore → tauri-plugin-store)
  ↓
Hooks (useEpub — Book instance; useRendition — Rendition lifecycle)
  ↓
Screens (LibraryScreen, ReaderScreen)
  ↓
Components (BookCard, EpubViewer, TocSheet, SettingsSheet, ErrorBlock, AppErrorBoundary)
```

### Структура Store (Zustand)

#### BookRecord

```typescript
{
  id: string;                    // btoa(encodeURIComponent(path)).slice(0, 12)
  path: string;                  // абсолютный путь к файлу
  title: string;                 // извлечено из EPUB metadata
  author: string;                // автор из metadata
  lastCfi: string;               // CFI-позиция (формат: epubcfi(...))
  lastChapterIndex: number;      // номер последней прочитанной главы
  totalChapters: number;         // всего глав в EPUB
  progressPercent: number;       // lastChapterIndex / totalChapters * 100
  lastReadAt: string;            // ISO 8601 дата-время
  addedAt: string;               // ISO 8601 дата-время добавления
}
```

#### ReaderSettings

```typescript
{
  fontSize: number;              // 12–28px
  theme: 'light' | 'sepia' | 'dark';
}
```

#### Флаг гидрации

```typescript
isHydrated: boolean;             // false → спиннер; true → рендер
```

### Зоны ответственности

| Слой | Обязанности |
|---|---|
| **Services** | Внешние вызовы (Tauri IPC); типизированные обёртки; преобразование данных |
| **Hooks** | Lifecycle epubjs (инициализация Book, Rendition); подписка на события |
| **Store** | Единый источник правды; state management; trigger persistence |
| **Screens** | Бизнес-логика экранов; управление навигацией; orchestration |
| **Components** | Переиспользуемые UI-блоки; presentation logic; доступность |

### Обработка ошибок на каждом слое

1. **Сервисный слой**: бросает исключения
2. **Хуки**: перехватывают, логируют, обновляют state
3. **Компоненты**: отображают ErrorBlock или Sentry breadcrumb

---

## Работа с EPUB

### Поток загрузки файла

```
Native file picker
  ↓
  (path: string)
  ↓
readEpubFile(path)
  ↓
  (Vec<u8> из Rust)
  ↓
  (number[] → Uint8Array → ArrayBuffer)
  ↓
ePub(arrayBuffer)
  ↓
book.ready (асинхронный)
  ↓
рендеринг в WebView
```

### CFI (Canonical Fragment Identifier)

**Что это?** Точная позиция в документе, независящая от размера экрана и разбивки на страницы.

**Почему CFI надёжнее номера страницы?** Номер страницы зависит от ширины экрана; CFI — это позиция в структуре документа (спецификация EPUB).

**Как работает?** Форма: `/2/4[chap01]!/4/2/16,/1:0,/1:100`

**Восстановление позиции:**
```javascript
rendition.display(cfi)  // Восстанавливает позицию после открытия книги
```

**Валидация перед сохранением:** `/^epubcfi\(.+\)$/` — защита от повреждённых значений

### Режим scrolled-doc

- **Нет пагинации**: весь документ скролится вертикально
- **Стабильнее на разных Android WebView**: минимизирует CSS-зависимость
- **Более простая логика**: нет расчёта страниц

### EPUB2 vs EPUB3 TOC

| Версия | Формат | epubjs нормализует в |
|---|---|---|
| EPUB2 | `toc.ncx` (XML) | `book.navigation.toc` |
| EPUB3 | `nav.html` | `book.navigation.toc` |

**Вложенные элементы TOC:** свойство `NavItem.subitems` поддерживает до 3 уровней вложенности.

### Ограничения

| Ограничение | Описание |
|---|---|
| **Нет поддержки DRM** | Защищённые EPUB не работают |
| **Сложные CSS-макеты** | Могут отличаться от специализированных читалок |
| **Большие файлы >50MB** | Медленная загрузка; предупреждение пользователю |

---

## Работа с данными

### Персистентность

**Механизм:** Zustand + `tauri-plugin-store` → `app_state.json` на устройстве

**Преимущество перед localStorage:** переживает перезапуск WebView

**Схема:**
```
Store mutation
  ↓
  (immediate update in memory)
  ↓
persistStore() (debounced 500ms)
  ↓
tauri-plugin-store
  ↓
app_state.json
```

### Отслеживание прогресса

- **Базис:** chapter-based процент, не страничный
- **Формула:** `progressPercent = (lastChapterIndex / totalChapters) * 100`
- **lastChapterIndex:** обновляется немедленно (в памяти) на каждый `relocated` event
- **CFI:** дебаунс 500мс перед записью на диск
- **Защита от race condition:** дебаунс + немедленный update гарантирует не потерять progress между сессиями

### CFI-валидация

```javascript
// Перед сохранением
if (!/^epubcfi\(.+\)$/.test(cfi)) {
  console.warn('Invalid CFI, resetting to start');
  return '';
}
```

### Гидрация при старте

```
App mounted
  ↓
isHydrated === false
  ↓
  (показать спиннер)
  ↓
hydrateStore()
  (loadState() из tauri-plugin-store)
  ↓
setHydrated(true) в finally
  (гарантия: даже если loadState() бросит, приложение стартует)
  ↓
рендер UI (с пустой библиотекой или загруженными книгами)
```

**Важно:** даже если `loadState()` бросит исключение, приложение не зависает благодаря `finally`.

### Потеря данных

- **При удалении приложения:** store очищается (ограничение `tauri-plugin-store`)
- **Шифрование:** отсутствует; не хранить чувствительные данные
- **Будущая задача:** экспорт прогресса в JSON

---

## Обработка ошибок

| Сценарий | Обработка |
|---|---|
| **Файл удалён между сессиями** | `readEpubFile` fails → ErrorBlock "Файл недоступен" + кнопка [Удалить из библиотеки] |
| **Повреждённый CFI** | `rendition.display(cfi)` в try/catch → `display()` с пустым CFI + очистить `lastCfi` |
| **Пустое оглавление** | "Оглавление недоступно" (message) + читалка работает |
| **Сбой рендеринга React** | AppErrorBoundary → ErrorBlock "Перезапустить" + log в Sentry |
| **Android Back Button** | `document.addEventListener('backbutton')` → `closeBook()` |
| **Повреждённый JSON в store** | `JSON.parse` fails → catch → start fresh с пустой library |
| **Прерывание при записи** | дебаунс 500мс + немедленный update `lastChapterIndex` в памяти |

### Пример: обработка missing file

```javascript
try {
  const uint8Array = await readEpubFile(book.path);
  // ...
} catch (error) {
  // Файл удалён или недоступен
  showErrorBlock('Файл недоступен', [
    { label: 'Удалить из библиотеки', action: () => removeBook(book.id) },
    { label: 'Закрыть', action: () => closeBook() }
  ]);
  logToSentry(error, { context: 'readEpubFile', bookId: book.id });
}
```

---

## Производительность

### Оптимизации

| Проблема | Решение |
|---|---|
| **Долгий парсинг EPUB** | Спиннер; `book.ready` — асинхронный; user feedback |
| **Частая запись прогресса** | Дебаунс 500мс на `persistStore()` |
| **Загрузка изображений** | epubjs ленивая загрузка per-chapter |
| **Лишние ре-рендеры EpubViewer** | `React.memo` + `forwardRef` |
| **Смена темы/шрифта** | `rendition.themes()` — CSS без перепарсинга EPUB |
| **Большой файл >50MB** | Предупреждение при добавлении в библиотеку |

### Метрики

- **Cold start:** <2s (гидрация store)
- **Book load:** <3s (парсинг EPUB, зависит от размера)
- **Theme switch:** <200ms (CSS update)
- **Scroll smoothness:** 60 FPS (scrolled-doc режим, React.memo)

---

## Эксплуатация в production

### Мониторинг

**Sentry интеграция:**
- `@sentry/react` в WebView
- `window.onerror` + `unhandledrejection` auto-capture
- Теги: версия приложения, Android API level, device model
- Breadcrumbs: чтение файла, загрузка EPUB, CFI-восстановление

**Логирование:**
- Уровень `console.error`: ошибки persist/hydrate, критические события
- Уровень `console.warn`: большие файлы (>50MB), повреждённые CFI
- Production: Sentry breadcrumbs вместо console.log

### Релизы

**Versioning:** Semver (MAJOR.MINOR.PATCH)

**Процесс:**
1. Обновить `tauri.conf.json` версию
2. Обновить `CHANGELOG.md`
3. Create git tag: `git tag v1.2.3`
4. Build: `pnpm tauri android build --release`

**Подпись APK:**
- Keystore хранить в **secrets менеджере** (не в репо)
- Release APK проверить на тестовом устройстве перед публикацией
- Сохранять старые APK для возможности отката

### Обработка инцидентов

| Приоритет | Сценарий | Действие |
|---|---|---|
| **P0** | Crash при старте | Откат на предыдущий APK; hotfix + patch |
| **P1** | Потеря прогресса | Баг-фикс + патч в 24 часа |
| **P2** | UX issue | Планируется в следующий спринт |

### Работа с EPUB

- **Файл читается заново** при каждом открытии (не кэшируется для безопасности)
- **При перемещении файла:** ErrorBlock + возможность удалить из библиотеки
- **Будущая задача:** копирование файла в sandbox приложения для надёжности

---

## Используемые библиотеки

| Библиотека | Версия | Назначение | Обоснование | Ограничения |
|---|---|---|---|---|
| **epubjs** | 0.3 | Парсинг + рендеринг EPUB | Отраслевой стандарт; CFI; TOC; ArrayBuffer | Нет DRM; сложные CSS; EPUB2/3 различия |
| **konsta** | 3 | UI-компоненты | Разработан для Tauri/Capacitor; iOS + Material готовые компоненты | Требует Tailwind |
| **tailwindcss** | 4 | Стилизация | Требуется для Konsta; mobile-first | Конфигурация отличается от v3 |
| **@use-gesture/react** | — | Свайп-жесты | epubjs-iframe блокирует жесты; overlay div перехватывает | Нельзя захватить жесты внутри iframe |
| **zustand** | 5 | Управление состоянием | Минимальный boilerplate; custom persistence; мале bundle | Race condition при холодном старте (решён isHydrated) |
| **dayjs** | — | Форматирование дат | 2KB; относительное время (e.g., "2 часа назад") | Локаль импортируется явно |
| **tauri-plugin-dialog** | 2 | Нативный file picker | Android file selection; фильтр .epub | UI зависит от версии Android |
| **tauri-plugin-fs** | 2 | Чтение файлов | Чтение байт EPUB с устройства | Требует `read` permission в capabilities.json |
| **tauri-plugin-store** | 2 | Персистентность state | Переживает перезапуск WebView; надёжнее localStorage | Очищается при удалении приложения; нет шифрования |
| **@tauri-apps/api** | 2 | Tauri API client | Invoke, listen events, OS info | Требует инициализации в main.ts |

---

## Требования к окружению

### Инструменты

| Инструмент | Требуемая версия | Установка |
|---|---|---|
| **Rust** | 1.77+ | `rustup install stable` |
| **Node.js** | 20+ | `nvm install 20` |
| **pnpm** | 9+ | `npm install -g pnpm@9` |
| **Android SDK** | API 34 | Android Studio SDK Manager |
| **Android NDK** | 27 | Android Studio SDK Manager |
| **Java** | 17 | `JAVA_HOME` → JDK 17 |

### Установка Tauri CLI

```bash
cargo install tauri-cli --version "^2"
# или
pnpm add -D @tauri-apps/cli@^2
```

### Переменные окружения

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/27.x.x
export JAVA_HOME=/path/to/jdk-17
# Добавить в ~/.zshrc или ~/.bashrc для постоянства
```

### Проверка окружения

```bash
rustc --version          # ≥ 1.77
node --version          # ≥ 20
pnpm --version          # ≥ 9
java -version           # ≥ 17
adb --version           # для установки на устройство
```

---

## Инструкция по сборке

### 1. Клонирование и подготовка

```bash
git clone https://github.com/MrkovalskiK/epub-reader
cd epub-reader

# Установить зависимости
pnpm install

# Инициализировать Android-проект (первый раз только)
pnpm tauri android init
```

### 2. Debug APK (разработка)

```bash
# Собрать debug APK
pnpm tauri android build --debug

# APK находится в:
# src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk

# Установить на подключённое устройство/эмулятор
adb install src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk

# Или через Tauri (автоматично):
pnpm tauri android dev
```

### 3. Release APK (продакшн)

```bash
# Убедиться, что keystore настроен (см. Tauri docs)
pnpm tauri android build --release

# APK:
# src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk

# Установить:
adb install src-tauri/gen/android/app/build/outputs/apk/release/app-release.apk
```

### 4. Разработка на Desktop (hot reload)

```bash
pnpm tauri dev
# Откроется окно с приложением
# Hot reload при сохранении кода (Ctrl+R для перезагрузки)
```

### 5. Логи и отладка

```bash
# Логи Android
adb logcat | grep -i tauri

# Inspect WebView (DevTools)
# Chrome: chrome://inspect/#devices (требует подключения по USB)
```

---

## Потенциальные риски и ограничения

### Критические риски

| Риск | Описание | Вероятность | Митигация |
|---|---|---|---|
| **Различия WebView на Android 8–14** | CSS-рендеринг EPUB может отличаться между версиями | HIGH | Тестирование на нескольких версиях; scrolled-doc минимизирует CSS-зависимость |
| **Нестабильный CFI при повреждённых EPUB** | epubjs не гарантирует CFI для нестандартных файлов | MEDIUM | Валидация CFI перед сохранением; fallback на начало книги |
| **Потеря данных при удалении приложения** | tauri-plugin-store хранит в sandbox приложения | MEDIUM | Документировано в README; будущая задача: экспорт прогресса в JSON |

### Функциональные ограничения

| Ограничение | Описание | Статус |
|---|---|---|
| **Нет поддержки DRM** | Защищённые EPUB не открываются | Как есть (не планируется) |
| **Нет шифрования store** | Прогресс хранится в открытом JSON | Как есть; не хранить sensitive данные |
| **Нет синхронной записи** | tauri-plugin-store асинхронный | Как есть; дебаунс предотвращает потери |
| **Ограничения JavaScript в WebView** | Нельзя захватить жесты внутри iframe | Как есть; overlay div workaround |
| **Файл перемещён пользователем** | Путь становится недействительным | Как есть; ErrorBlock + удаление из библиотеки |
| **Большие EPUB (>50MB)** | Медленная загрузка, риск OOM | Как есть; предупреждение; будущая задача: стриминг |

### Будущие улучшения

- [ ] Копирование EPUB в sandbox приложения для надёжности
- [ ] Экспорт/импорт прогресса (JSON)
- [ ] Закладки и аннотации
- [ ] Поиск по тексту
- [ ] Синхронизация между устройствами (требует backend)
- [ ] Стриминг для больших файлов
- [ ] Поддержка PDF (отдельная задача)

---

## Лицензия

MIT

## Контакты

Разработано в рамках тестового задания.
