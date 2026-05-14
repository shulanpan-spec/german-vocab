import './styles.css';
import { db } from './db';
import { seedAll } from './seed';
import { loadSettings } from './store';
import { registerRoute, setFallback, startRouter } from './router';
import { warmUpTTS } from './tts';
import { cleanupLegacyKeys } from './lib/llm';

async function boot(): Promise<void> {
  // When a new SW takes control (after autoUpdate's skipWaiting), reload once
  // so the user gets the fresh bundle without needing a manual second refresh.
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  cleanupLegacyKeys();
  await db.open();
  await seedAll();
  await loadSettings();

  const { renderHome } = await import('./pages/home');
  const { renderSession } = await import('./pages/session');
  const { renderLibrary } = await import('./pages/library');
  const { renderWordDetail } = await import('./pages/word-detail');
  const { renderSettings } = await import('./pages/settings');

  registerRoute('#/home', renderHome);
  registerRoute('#/session', renderSession);
  registerRoute('#/library', renderLibrary);
  registerRoute('#/word/:id', renderWordDetail);
  registerRoute('#/settings', renderSettings);
  setFallback((root) => {
    root.innerHTML = '<p class="p-4">Not found</p>';
  });

  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) throw new Error('#app missing');
  if (!window.location.hash) {
    window.location.hash = '#/home';
  }
  startRouter(root);

  document.addEventListener('click', () => warmUpTTS(), { once: true });
}

boot().catch((err) => {
  console.error(err);
  document.body.textContent = 'Boot failed: ' + String(err);
});
