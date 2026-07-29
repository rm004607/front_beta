import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Copy, Check, Loader2, Shield, School, Building2, MapPin, Briefcase, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { communitiesAPI, type Community, type CommunityType } from '@/lib/api';

const TYPES: { value: CommunityType; label: string; icon: typeof School }[] = [
  { value: 'colegio', label: 'Colegio', icon: School },
  { value: 'condominio', label: 'Condominio / Edificio', icon: Building2 },
  { value: 'barrio', label: 'Barrio', icon: MapPin },
  { value: 'empresa', label: 'Empresa', icon: Briefcase },
  { value: 'otro', label: 'Otro', icon: Hash },
];

const typeMeta = (t: CommunityType) => TYPES.find((x) => x.value === t) ?? TYPES[4];

const Comunidades = () => {
  const { isLoggedIn, isLoading: authLoading } = useUser();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Crear comunidad
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CommunityType>('colegio');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Invitar
  const [inviteFor, setInviteFor] = useState<Community | null>(null);
  const [expiryDays, setExpiryDays] = useState<string>('7');
  const [maxUses, setMaxUses] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await communitiesAPI.mine();
      setCommunities(res.communities ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No pudimos cargar tus comunidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isLoggedIn) load();
    else setLoading(false);
  }, [isLoggedIn, authLoading]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Ponle un nombre a tu comunidad');
      return;
    }
    setCreating(true);
    try {
      await communitiesAPI.create({ name: name.trim(), type, description: description.trim() || undefined });
      toast.success('¡Comunidad creada!');
      setCreateOpen(false);
      setName('');
      setDescription('');
      setType('colegio');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos crear la comunidad.');
    } finally {
      setCreating(false);
    }
  };

  const openInvite = (c: Community) => {
    setInviteFor(c);
    setInviteLink(null);
    setCopied(false);
    setExpiryDays('7');
    setMaxUses('');
  };

  const handleGenerateInvite = async () => {
    if (!inviteFor) return;
    setGenerating(true);
    try {
      const days = Number(expiryDays);
      const expires_at = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
      const uses = Number(maxUses);
      const res = await communitiesAPI.createInvite(inviteFor.id, {
        expires_at,
        max_uses: uses > 0 ? uses : null,
      });
      // Armamos el link con NUESTRA ruta real (/comunidades/invitacion/:token),
      // sin depender del path que arme el backend. Solo necesitamos el token.
      const link = `${window.location.origin}/comunidades/invitacion/${res.invite.token}`;
      setInviteLink(link);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos generar el link.');
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar. Copia el link manualmente.');
    }
  };

  // No logueado
  if (!authLoading && !isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Users size={26} />
            </div>
            <CardTitle className="text-2xl font-heading">Comunidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Crea la comunidad de tu colegio, edificio o barrio y recomiéndense servicios de confianza entre ustedes.
            </p>
            <Button asChild className="w-full font-bold h-11">
              <Link to="/registro?tipo=vecino">Ingresar con mi teléfono</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black">Mis comunidades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Grupos privados donde se recomiendan servicios de confianza.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shrink-0">
              <Plus size={18} className="mr-1.5" /> Crear
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear comunidad</DialogTitle>
              <DialogDescription>Tú serás el administrador y podrás invitar a los demás.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="c-name">Nombre</Label>
                <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Colegio San Pedro — Apoderados" />
              </div>
              <div>
                <Label htmlFor="c-type">Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as CommunityType)}>
                  <SelectTrigger id="c-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="c-desc">Descripción (opcional)</Label>
                <Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿De qué se trata esta comunidad?" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating} className="font-bold">
                {creating ? <><Loader2 size={16} className="mr-2 animate-spin" /> Creando...</> : 'Crear comunidad'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={20} /> Cargando...
        </div>
      ) : loadError ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={load}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : communities.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={26} />
            </div>
            <p className="font-bold">Aún no tienes comunidades</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Crea la primera —tu colegio, tu edificio o tu barrio— e invita a la gente con un link.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="font-bold"><Plus size={18} className="mr-1.5" /> Crear mi primera comunidad</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((c) => {
            const meta = typeMeta(c.type);
            const Icon = meta.icon;
            const isAdmin = c.my_role === 'admin';
            return (
              <Card key={c.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <Link to={`/comunidades/${c.id}`} className="block hover:bg-muted/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg truncate">{c.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{meta.label}</span>
                          {isAdmin && (
                            <Badge variant="secondary" className="text-[10px] gap-1 py-0"><Shield size={10} /> Admin</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2">
                    {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users size={13} /> {c.members_count ?? 0} miembro{(c.members_count ?? 0) === 1 ? '' : 's'}
                    </div>
                  </CardContent>
                </Link>
                {isAdmin && (
                  <div className="px-6 pb-5">
                    <Button variant="outline" size="sm" className="w-full font-semibold" onClick={() => openInvite(c)}>
                      Invitar con link
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de invitación */}
      <Dialog open={!!inviteFor} onOpenChange={(o) => !o && setInviteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar a {inviteFor?.name}</DialogTitle>
            <DialogDescription>Genera un link para compartir. Puedes ponerle vencimiento por tiempo y/o por número de usos.</DialogDescription>
          </DialogHeader>
          {!inviteLink ? (
            <>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <Label htmlFor="exp">Expira en (días)</Label>
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger id="exp"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 día</SelectItem>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="0">Sin vencimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="uses">Máx. usos</Label>
                  <Input id="uses" type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Ilimitado" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleGenerateInvite} disabled={generating} className="font-bold">
                  {generating ? <><Loader2 size={16} className="mr-2 animate-spin" /> Generando...</> : 'Generar link'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="space-y-3 py-2">
              <Label>Comparte este link</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="text-xs" onFocus={(e) => e.target.select()} />
                <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={copyLink}>
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cualquiera con este link podrá unirse mientras esté vigente.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comunidades;
