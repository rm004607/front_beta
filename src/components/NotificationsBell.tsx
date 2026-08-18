import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/contexts/UserContext';
import { notificationsAPI, type AppNotification } from '@/lib/api';

const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'recién';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

export default function NotificationsBell() {
  const { isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await notificationsAPI.list();
      setItems(res.notifications ?? []);
      setUnread(res.unread ?? 0);
    } catch {
      // silencioso: el back puede no tener el endpoint aún
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Carga inicial + polling cada 60s
  useEffect(() => {
    if (!isLoggedIn) return;
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [isLoggedIn, load]);

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) load();
  };

  const openItem = async (n: AppNotification) => {
    setOpen(false);
    if (!n.read) {
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      notificationsAPI.markRead(n.id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    setUnread(0);
    notificationsAPI.markAllRead().catch(() => {});
  };

  if (!isLoggedIn) return null;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notificaciones"
          className="relative outline-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full p-1.5 hover:bg-muted transition-colors"
        >
          <Bell size={20} className="text-foreground" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-primary/20 shadow-2xl bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-bold text-sm">Notificaciones</span>
          {unread > 0 && (
            <button onClick={markAll} className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              <CheckCheck size={13} /> Marcar leídas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm"><Loader2 size={16} className="animate-spin mr-2" /> Cargando...</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground px-6">
              <Bell size={22} className="mx-auto mb-2 opacity-40" />
              No tienes notificaciones.
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={`flex w-full text-left gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors ${n.read ? '' : 'bg-primary/[0.04]'}`}
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
