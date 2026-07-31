import { lazy, ComponentType } from 'react';

/**
 * Обертка для React.lazy с автоматическим ретраем и перезагрузкой страницы
 * при расхождении хэшей чанков после деплоя новой версии приложения.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasAlreadyBeenReloaded = sessionStorage.getItem('chunk_failed_reload');

    try {
      const component = await componentImport();
      // Очищаем флаг успешной загрузкой
      sessionStorage.removeItem('chunk_failed_reload');
      return component;
    } catch (error: any) {
      console.error('Dynamic import failed:', error);

      const isChunkLoadError =
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('dynamically imported module');

      if (isChunkLoadError && !pageHasAlreadyBeenReloaded) {
        sessionStorage.setItem('chunk_failed_reload', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}
