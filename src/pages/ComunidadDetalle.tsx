import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Shield, Plus, MessageCircle, Loader2, ThumbsUp, School, Building2, MapPin, Briefcase, Hash, Search, X, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { communitiesAPI, servicesAPI, type Community, type Recommendation, type CommunityType } from '@/lib/api';

type PickedService = { id: string; service_name: string; comuna?: string; price_range?: string; image?: string };

const typeMeta = (t?: CommunityType) => {
  const map: Record<string, { label: string; icon: typeof School }> = {
    colegio: { label: 'Colegio', icon: School },
    condominio: { label: 'Condominio / Edificio', icon: Building2 },
    barrio: { label: 'Barrio', icon: MapPin },
    empresa: { label: 'Empresa', icon: Briefcase },
    otro: { label: 'Otro', icon: Hash },
  };
  return map[t ?? 'otro'] ?? map.otro;
};

const initials = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

const ComunidadDetalle = () => {
  const { id = '' } = useParams();
  const { isLoggedIn, isLoading: authLoading } = useUser();

  const [community, setCommunity] = useState<Community | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [myRole, setMyRole] = useState<'admin' | 'member' | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nueva recomendación
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [posting, setPosting] = useState(false);
  // Selector de servicio de Dameldato para adjuntar a la recomendación
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceResults, setServiceResults] = useState<PickedService[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickedService, setPickedService] = useState<PickedService | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await communitiesAPI.get(id);
      setCommunity(c.community);
      setMembersCount(c.members_count ?? 0);
      setMyRole(c.my_role ?? 'member');
      try {
        const r = await communitiesAPI.getRecommendations(id);
        setRecs(r.recommendations ?? []);
      } catch {
        setRecs([]); // el feed puede fallar sin tumbar la página
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar la comunidad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isLoggedIn) loadAll();
    else setLoading(false);
  }, [id, isLoggedIn, authLoading]);

  // Búsqueda de servicios (debounced) para adjuntar a la recomendación
  useEffect(() => {
    if (pickedService) return;
    const q = serviceQuery.trim();
    if (q.length < 2) { setServiceResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await servicesAPI.getServices({ search: q, limit: 5 });
        if (cancelled) return;
        setServiceResults(res.services.map((s) => ({
          id: s.id, service_name: s.service_name, comuna: s.comuna,
          price_range: s.price_range, image: s.image_urls?.[0],
        })));
      } catch {
        if (!cancelled) setServiceResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [serviceQuery, pickedService]);

  const clearForm = () => {
    setTitle(''); setText(''); setContactName(''); setContactPhone('');
    setPickedService(null); setServiceQuery(''); setServiceResults([]);
  };

  const handlePost = async () => {
    if (!text.trim() && !pickedService) {
      toast.error('Escribe una recomendación o adjunta un servicio');
      return;
    }
    setPosting(true);
    try {
      await communitiesAPI.createRecommendation(id, {
        title: title.trim() || undefined,
        text: text.trim() || undefined,
        contact_name: contactName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        service_id: pickedService?.id,
      });
      toast.success('¡Recomendación publicada!');
      setOpen(false);
      clearForm();
      loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos publicar tu recomendación.');
    } finally {
      setPosting(false);
    }
  };

  if (!authLoading && !isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader><CardTitle className="text-2xl font-heading">Comunidad privada</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">Ingresa para ver esta comunidad y sus recomendaciones.</p>
            <Button asChild className="w-full font-bold"><Link to="/registro?tipo=vecino">Ingresar con mi teléfono</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="animate-spin mr-2" size={22} /> Cargando...</div>;
  }

  if (error || !community) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card><CardContent className="py-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{error || 'Comunidad no encontrada.'}</p>
          <Button asChild variant="outline"><Link to="/comunidades"><ArrowLeft size={16} className="mr-1.5" /> Mis comunidades</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  const meta = typeMeta(community.type);
  const Icon = meta.icon;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10 max-w-2xl">
      <Link to="/comunidades" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5">
        <ArrowLeft size={15} /> Mis comunidades
      </Link>

      {/* Encabezado */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-heading font-black truncate">{community.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
            <span>{meta.label}</span>
            <span className="inline-flex items-center gap-1"><Users size={13} /> {membersCount} miembro{membersCount === 1 ? '' : 's'}</span>
            {myRole === 'admin' && <Badge variant="secondary" className="text-[10px] gap-1 py-0"><Shield size={10} /> Admin</Badge>}
          </div>
          {community.description && <p className="text-sm text-muted-foreground mt-2">{community.description}</p>}
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Recomendaciones</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-bold"><Plus size={16} className="mr-1.5" /> Recomendar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recomendar un servicio</DialogTitle>
              <DialogDescription>Comparte un dato de confianza con tu comunidad.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Adjuntar un servicio real de Dameldato (opcional) */}
              <div>
                <Label>Servicio de Dameldato (opcional)</Label>
                {pickedService ? (
                  <div className="flex items-center gap-2 mt-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    {pickedService.image
                      ? <img src={pickedService.image} alt="" className="w-8 h-8 rounded object-cover" />
                      : <Star size={16} className="text-primary shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{pickedService.service_name}</p>
                      {pickedService.comuna && <p className="text-[11px] text-muted-foreground truncate">{pickedService.comuna}</p>}
                    </div>
                    <button type="button" aria-label="Quitar servicio" onClick={() => { setPickedService(null); setServiceQuery(''); }} className="text-muted-foreground hover:text-foreground shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative mt-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={serviceQuery} onChange={(e) => setServiceQuery(e.target.value)} placeholder="Buscar un servicio publicado..." className="pl-9" />
                    {serviceQuery.trim().length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-56 overflow-auto">
                        {searching && <div className="p-3 text-xs text-muted-foreground">Buscando...</div>}
                        {!searching && serviceResults.length === 0 && <div className="p-3 text-xs text-muted-foreground">Sin resultados</div>}
                        {serviceResults.map((s) => (
                          <button key={s.id} type="button" onClick={() => { setPickedService(s); setServiceResults([]); }} className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-muted/50">
                            {s.image
                              ? <img src={s.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                              : <Star size={16} className="text-primary shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{s.service_name}</p>
                              {s.comuna && <p className="text-[11px] text-muted-foreground truncate">{s.comuna}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="r-title">Rubro o servicio</Label>
                <Input id="r-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Gásfiter, Electricista, Costurera..." />
              </div>
              <div>
                <Label htmlFor="r-text">Tu recomendación {pickedService && <span className="text-muted-foreground font-normal">(opcional)</span>}</Label>
                <Textarea id="r-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Ej: Me arregló una filtración al toque, muy buena onda y precio justo." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="r-cname">A quién recomiendas</Label>
                  <Input id="r-cname" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nombre (opcional)" />
                </div>
                <div>
                  <Label htmlFor="r-cphone">Su teléfono</Label>
                  <Input id="r-cphone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+56 9 ... (opcional)" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePost} disabled={posting} className="font-bold">
                {posting ? <><Loader2 size={16} className="mr-2 animate-spin" /> Publicando...</> : 'Publicar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {recs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><ThumbsUp size={22} /></div>
            <p className="font-bold">Aún no hay recomendaciones</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">Sé el primero en recomendar un servicio de confianza a tu comunidad.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recs.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-black shrink-0">
                    {initials(r.author_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.title && <span className="font-bold text-sm">{r.title}</span>}
                      {r.author_name && <span className="text-xs text-muted-foreground">{r.title ? '· ' : ''}por {r.author_name}</span>}
                    </div>
                    {r.text && <p className="text-sm mt-1 leading-relaxed">{r.text}</p>}
                    {r.service && (
                      <Link to="/servicios" className="mt-2 flex items-center gap-3 rounded-xl border border-border hover:border-primary/40 bg-muted/30 p-2.5 transition-colors">
                        {r.service.cover_image_url
                          ? <img src={r.service.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          : <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Star size={18} /></div>}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{r.service.service_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{[r.service.comuna, r.service.price_range].filter(Boolean).join(' · ')}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary shrink-0">Ver</span>
                      </Link>
                    )}
                    {(r.contact_name || r.contact_phone) && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {r.contact_name && <span className="text-xs text-muted-foreground">Contacto: <b className="text-foreground">{r.contact_name}</b></span>}
                        {r.contact_phone && (
                          <a href={waLink(r.contact_phone)} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="h-8 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs">
                              <MessageCircle size={14} className="mr-1.5" /> WhatsApp
                            </Button>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComunidadDetalle;
