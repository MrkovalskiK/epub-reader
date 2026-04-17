interface ErrorBlockProps {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  onRemove?: () => void;
  onRelink?: () => void;
}

export function ErrorBlock({ message, onRetry, onBack, onRemove, onRelink }: ErrorBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">📄</div>
      <p className="text-base text-gray-700">{message}</p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {onRelink && (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            onClick={onRelink}
          >
            Выбрать файл заново
          </button>
        )}
        {onRetry && (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            onClick={onRetry}
          >
            Повторить
          </button>
        )}
        {onRemove && (
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg"
            onClick={onRemove}
          >
            Удалить из библиотеки
          </button>
        )}
        {onBack && (
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg"
            onClick={onBack}
          >
            В библиотеку
          </button>
        )}
      </div>
    </div>
  );
}
