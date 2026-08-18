import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, Loader2, MapPin, Tag, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { requestsAPI, servicesAPI, type ServiceRequest } from '@/lib/api';

const initials = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'recién';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
};

const Pedidos = () => {
  const { isLoggedIn, isLoading: authLoading, user } = useUser();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [typeId, setTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [comuna, setComuna] = useState(user?.comuna || '');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = mineOnly ? await requestsAPI.mine() : await requestsAPI.list();
      setRequests(res.requests ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No pudimos cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, mineOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    servicesAPI.getServiceTypes({ onlyActive: true })
      .then((r) => setTypes((r.types ?? []).map((t) => ({ id: t.id, name: t.name }))))
      .catch(() => setTypes([]));
  }, []);

  useEffect(() => { if (user?.comuna && !comuna) setComuna(user.comuna); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Escribe qué necesitas'); return; }
    setCreating(true);
    try {
      await requestsAPI.create({
        title: title.trim(),
        service_type_id: typeId || undefined,
        description: description.trim() || undefined,
        comuna: comuna.trim() || undefined,
        region_id: user?.region_id || undefined,
      });
      toast.success('¡Pedido publicado! Avisaremos a los prestadores del rubro.');
      setOpen(false);
      setTitle(''); setTypeId(''); setDescription('');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos publicar tu pedido.');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await requestsAPI.close(id);
      toast.success('Pedido cerrado');
      setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'closed' } : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos cerrar el pedido.');
    }
  };

  if (!authLoading && !isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2"><Megaphone size={26} /></div>
            <CardTitle className="text-2xl font-heading">Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">Publica lo que necesitas y los prestadores del rubro te contactan.</p>
            <Button asChild className="w-full font-bold"><Link to="/registro?tipo=vecino">Ingresar con mi teléfono</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black">Pedidos</h1>
          <p className="text-muted-foreground text-sm mt-1">Dice lo que necesitas y te encuentran los prestadores.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shrink-0"><Plus size={18} className="mr-1.5" /> Publicar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Qué necesitas?</DialogTitle>
              <DialogDescription>Los prestadores del rubro en tu zona recibirán el aviso.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="p-title">Lo que necesitas</Label>
                <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Gásfiter para una filtración en la cocina" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="p-type">Rubro (opcional)</Label>
                  <Select value={typeId} onValueChange={setTypeId}>
                    <SelectTrigger id="p-type"><SelectValue placeholder="Elige rubro" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="p-comuna">Comuna</Label>
                  <Input id="p-comuna" value={comuna} onChange={(e) => setComuna(e.target.value)} placeholder="Tu comuna" />
                </div>
              </div>
              <div>
                <Label htmlFor="p-desc">Detalle (opcional)</Label>
                <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Cuenta un poco más: cuándo, urgencia, presupuesto..." />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating} className="font-bold">
                {creating ? <><Loader2 size={16} className="mr-2 animate-spin" /> Publicando...</> : <><Send size={15} className="mr-2" /> Publicar pedido</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant={mineOnly ? 'outline' : 'default'} size="sm" onClick={() => setMineOnly(false)}>Todos</Button>
        <Button variant={mineOnly ? 'default' : 'outline'} size="sm" onClick={() => setMineOnly(true)}>Mis pedidos</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="animate-spin mr-2" size={20} /> Cargando...</div>
      ) : loadError ? (
        <Card><CardContent className="py-10 text-center space-y-3"><p className="text-sm text-muted-foreground">{loadError}</p><Button variant="outline" onClick={load}>Reintentar</Button></CardContent></Card>
      ) : requests.length === 0 ? (
        <Card><CardContent className="py-14 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Megaphone size={26} /></div>
          <p className="font-bold">{mineOnly ? 'Aún no has publicado pedidos' : 'No hay pedidos por ahora'}</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">Publica lo que necesitas y deja que los prestadores te encuentren.</p>
          <Button onClick={() => setOpen(true)} className="font-bold"><Plus size={18} className="mr-1.5" /> Publicar un pedido</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const mine = r.user_id === user?.id;
            const closed = r.status === 'closed';
            return (
              <Card key={r.id} className={closed ? 'opacity-60' : ''}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-black shrink-0">{initials(r.user_name)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-base leading-tight">{r.title}</p>
                        {closed && <Badge variant="secondary" className="shrink-0 text-[10px]">Cerrado</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                        {r.user_name && <span>por {r.user_name}</span>}
                        {r.created_at && <span>· {timeAgo(r.created_at)}</span>}
                      </div>
                      {r.description && <p className="text-sm mt-2 leading-relaxed">{r.description}</p>}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {r.service_type_name && <Badge variant="outline" className="gap-1 text-[11px]"><Tag size={11} /> {r.service_type_name}</Badge>}
                        {r.comuna && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {r.comuna}</span>}
                      </div>
                      {mine && !closed && (
                        <Button variant="ghost" size="sm" className="mt-3 h-8 text-muted-foreground" onClick={() => handleClose(r.id)}>
                          <CheckCircle2 size={14} className="mr-1.5" /> Marcar como resuelto
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Pedidos;
