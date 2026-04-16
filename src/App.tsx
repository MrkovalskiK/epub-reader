import { useEffect } from 'react';
import { App as KonstaApp } from 'konsta/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import { useStore } from './store/index';
import { hydrateStore } from './store/persistence';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { LibraryScreen } from './screens/LibraryScreen';
import { ReaderScreen } from './screens/ReaderScreen';

dayjs.extend(relativeTime);
dayjs.locale('ru');

function App() {
  const { isHydrated, currentBookId } = useStore();

  useEffect(() => {
    hydrateStore();
  }, []);

  if (!isHydrated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <KonstaApp theme="material" safeAreas>
      <AppErrorBoundary>
        {currentBookId ? <ReaderScreen /> : <LibraryScreen />}
      </AppErrorBoundary>
    </KonstaApp>
  );
}

export default App;
