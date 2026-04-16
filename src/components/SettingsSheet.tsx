import { Sheet, Toolbar, Link, Block, BlockTitle, Button } from 'konsta/react';
import { ReaderSettings } from '../store/index';

interface SettingsSheetProps {
  open: boolean;
  settings: ReaderSettings;
  onClose: () => void;
  onUpdate: (patch: Partial<ReaderSettings>) => void;
}

const THEMES: { value: ReaderSettings['theme']; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'sepia', label: 'Сепия' },
  { value: 'dark', label: 'Тёмная' },
];

export function SettingsSheet({ open, settings, onClose, onUpdate }: SettingsSheetProps) {
  return (
    <Sheet opened={open} onBackdropClick={onClose}>
      <Toolbar top>
        <div className="left" />
        <div className="title font-semibold">Настройки</div>
        <div className="right">
          <Link toolbar onClick={onClose}>
            Закрыть
          </Link>
        </div>
      </Toolbar>
      <div style={{ paddingTop: '44px' }}>
        <BlockTitle>Размер шрифта</BlockTitle>
        <Block>
          <div className="flex items-center justify-between gap-4">
            <Button
              outline
              onClick={() => onUpdate({ fontSize: Math.max(12, settings.fontSize - 2) })}
            >
              A−
            </Button>
            <span className="text-lg font-medium">{settings.fontSize}px</span>
            <Button
              outline
              onClick={() => onUpdate({ fontSize: Math.min(28, settings.fontSize + 2) })}
            >
              A+
            </Button>
          </div>
        </Block>

        <BlockTitle>Тема</BlockTitle>
        <Block>
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <Button
                key={t.value}
                outline={settings.theme !== t.value}
                onClick={() => onUpdate({ theme: t.value })}
                className="flex-1"
              >
                {t.label}
              </Button>
            ))}
          </div>
        </Block>
      </div>
    </Sheet>
  );
}
