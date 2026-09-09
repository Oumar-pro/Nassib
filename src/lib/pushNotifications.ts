import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return Boolean(
    VAPID_PUBLIC_KEY &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window,
  );
}

export async function enablePushNotifications(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!userId) return { ok: false, error: 'Utilisateur non authentifié.' };
  if (!isPushSupported()) return { ok: false, error: 'Les notifications push ne sont pas disponibles sur cet appareil.' };

  try {
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, error: 'Permission de notification refusée.' };

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = subscription.toJSON();
    const endpoint = json.endpoint;
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!endpoint || !p256dh || !auth) return { ok: false, error: 'Abonnement push invalide.' };

    const { error } = await supabase
      ?.from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 500),
        is_active: true,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'user_id,endpoint' });

    if (error) return { ok: false, error: error.message };
    await supabase?.from('notification_preferences').upsert({
      user_id: userId,
      push_notifications_enabled: true,
      last_app_opened_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Erreur inconnue.' };
  }
}

export async function disablePushNotifications(userId: string): Promise<void> {
  if (!userId) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const subscription = await registration?.pushManager.getSubscription().catch(() => null);
  if (subscription) await subscription.unsubscribe().catch(() => undefined);
  await supabase?.from('notification_preferences').upsert({
    user_id: userId,
    push_notifications_enabled: false,
  }, { onConflict: 'user_id' });
  if (subscription) {
    await supabase?.from('push_subscriptions').update({ is_active: false }).eq('user_id', userId).eq('endpoint', subscription.endpoint);
  }
}

export async function touchAppOpen(userId: string): Promise<void> {
  if (!userId) return;
  await supabase?.from('notification_preferences').upsert({
    user_id: userId,
    last_app_opened_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}
