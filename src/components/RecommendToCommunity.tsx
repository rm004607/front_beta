import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { communitiesAPI, type Community } from '@/lib/api';

/**
 * Botón + diálogo para recomendar un servicio existente de Dameldato.com a una
 * de tus comunidades (crea una recomendación con service_id en su feed).
 */
export default function RecommendToCommunity({
  serviceId,
  serviceName,
  triggerClassName,
}: {
  serviceId: string;
  serviceName?: string;
  triggerClassName?: string;
}) {
  const { isLoggedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCommunities = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await communitiesAPI.mine();
      setCommunities(res.communities ?? []);
      if ((res.communities ?? []).length === 1) setSelected(res.communities[0].id);
      setLoaded(true);
    } catch {
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (o && isLoggedIn) loadCommunities();
  };

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Elige una comunidad');
      return;
    }
    setSubmitting(true);
    try {
      await communitiesAPI.createRecommendation(selected, {
        service_id: serviceId,
        text: note.trim() || undefined,
      });
      toast.success('¡Recomendado a tu comunidad!');
      setOpen(false);
      setNote('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos recomendarlo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={triggerClassName ?? 'w-full text-primary hover:text-primary hover:bg-primary/5 rounded-xl font-semibold'}>
          <Users size={15} className="mr-1.5" />
          Recomendar a mi comunidad
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recomendar a mi comunidad</DialogTitle>
          <DialogDescription>
            {serviceName ? <>Comparte <b className="text-foreground">{serviceName}</b> con una de tus comunidades.</> : 'Comparte este servicio con una de tus comunidades.'}
          </DialogDescription>
        </DialogHeader>

        {!isLoggedIn ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">Ingresa para recomendar servicios a tu comunidad.</p>
            <Button asChild className="w-full font-bold"><Link to="/registro?tipo=vecino">Ingresar con mi teléfono</Link></Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="animate-spin mr-2" size={18} /> Cargando tus comunidades...</div>
        ) : communities.length === 0 ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">Aún no perteneces a ninguna comunidad. Crea una o únete con un link de invitación.</p>
            <Button asChild variant="outline" className="w-full"><Link to="/comunidades">Ir a comunidades</Link></Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="rc-community">Comunidad</Label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger id="rc-community"><SelectValue placeholder="Elige una comunidad" /></SelectTrigger>
                  <SelectContent>
                    {communities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rc-note">Nota (opcional)</Label>
                <Textarea id="rc-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ej: Me atendió al toque, súper recomendado." />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting || !selected} className="font-bold">
                {submitting ? <><Loader2 size={16} className="mr-2 animate-spin" /> Recomendando...</> : <><Send size={15} className="mr-2" /> Recomendar</>}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
