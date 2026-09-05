import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Compatibility bridge for legacy onboarding code: there is exactly one session key.
// It also emits a same-tab storage event so App reacts immediately to session updates.
if (typeof window !== 'undefined') {
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key: string, value: string) {
    const canonicalKey = key === 'nasiba_user_session' ? 'nasiba_current_session' : key;
    originalSetItem.call(this, canonicalKey, value);
    if (canonicalKey === 'nasiba_current_session') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('nasiba_session_changed'));
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
