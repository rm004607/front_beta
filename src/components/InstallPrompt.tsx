import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'pwa_install_dismissed';

/**
 * Banner para "agregar a la pantalla de inicio" (PWA).
 * - Android/Chrome: usa el evento beforeinstallprompt → botón "Instalar" nativo.
 * - iOS Safari: no existe ese evento, así que mostramos las instrucciones (Compartir → Agregar a inicio).
 * No se muestra si ya está instalada o si el usuario lo cerró.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<Event & { prompt?: () => void; userChoice?: Promise<unknown> } | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const iosSafari = ios && !/crios|fxios|edgios/i.test(ua);

    if (iosSafari) {
      setIsIOS(true);
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as Event & { prompt?: () => void; userChoice?: Promise<unknown> });
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      localStorage.setItem(DISMISS_KEY, '1');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred?.prompt) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setDeferred(null);
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 md:bottom-4 z-[60] px-3 pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto rounded-2xl border border-border bg-card shadow-2xl p-3.5 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
        <img src="/icon-192.png" alt="" className="w-11 h-11 rounded-xl shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">Instala Dameldato</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              Toca <Share size={12} className="inline align-[-1px]" /> Compartir y luego <b className="text-foreground">"Agregar a inicio"</b>.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              Ábrela como app desde tu pantalla de inicio.
            </p>
          )}
        </div>
        {!isIOS && (
          <Button size="sm" onClick={install} className="font-bold shrink-0 h-9">
            <Download size={15} className="mr-1.5" /> Instalar
          </Button>
        )}
        <button type="button" onClick={dismiss} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground shrink-0 p-1">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
