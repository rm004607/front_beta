import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { Wrench, AlertCircle, MapPin, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { servicesAPI, packagesAPI } from '@/lib/api';
import {
  isValidTextField,
  isValidPhone,
  sanitizeInput
} from '@/lib/input-validator';
import PackagesModal from '@/components/PackagesModal';
import { chileData } from '@/lib/chile-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

const PostService = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [comuna, setComuna] = useState(user?.comuna || ''); // Comuna base
  const [baseRegion, setBaseRegion] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [coverageCommunes, setCoverageCommunes] = useState<string[]>([]);
  const [coverageRegion, setCoverageRegion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packagesModalOpen, setPackagesModalOpen] = useState(false);
  const [editBaseLocation, setEditBaseLocation] = useState(false);
  const [userLimits, setUserLimits] = useState<{
    services: {
      free_limit: number;
      used: number;
      remaining: number;
      requires_payment: boolean;
    };
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [canPublish, setCanPublish] = useState(false);

  if (!isLoggedIn) {
    navigate('/registro');
    return null;
  }

  useEffect(() => {
    if (isLoggedIn && (user?.roles.includes('entrepreneur') || user?.role_number === 5)) {
      loadUserLimits();
    }
  }, [isLoggedIn, user]);

  // Pre-llenado de ubicación desde el perfil
  useEffect(() => {
    if (user) {
      if (user.comuna) setComuna(user.comuna);
      if (user.region_id) setBaseRegion(user.region_id);
    }
  }, [user]);

  const loadUserLimits = async () => {
    try {
      setLoadingLimits(true);
      const limits = await packagesAPI.getUserLimits();
      setUserLimits(limits);

      // Si es super-admin, siempre puede publicar
      if (user?.role_number === 5) {
        setCanPublish(true);
      } else if (limits.services.requires_payment) {
        // Si requiere pago, mostrar modal y no permitir publicar
        setCanPublish(false);
        setPackagesModalOpen(true);
      } else {
        // Si tiene publicaciones gratis disponibles, permitir publicar
        setCanPublish(true);
      }
    } catch (error) {
      console.error('Error loading user limits:', error);
      setCanPublish(true); // En caso de error, permitir intentar publicar
    } finally {
      setLoadingLimits(false);
    }
  };

  // Verificar que el usuario sea emprendedor o super-admin (opcional, el backend también lo valida)
  if (!user?.roles.includes('entrepreneur') && user?.role_number !== 5) {
    toast.error('Solo los emprendedores pueden publicar servicios');
    navigate('/servicios');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !description || !comuna) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validaciones de seguridad
    if (!isValidTextField(service, 100)) {
      toast.error('El nombre del servicio contiene caracteres no permitidos');
      return;
    }
    if (!isValidTextField(comuna, 50)) {
      toast.error('La comuna contiene caracteres no permitidos');
      return;
    }
    if (!isValidTextField(description, 2000)) {
      toast.error('La descripción contiene caracteres no permitidos');
      return;
    }
    if (phone && !isValidPhone(phone)) {
      toast.error('El teléfono no es válido');
      return;
    }

    setIsSubmitting(true);
    try {
      const priceRangeString = minPrice && maxPrice ? `${minPrice} - ${maxPrice}` : minPrice || maxPrice || '';

      const response = await servicesAPI.createService({
        service_name: sanitizeInput(service, 100),
        description: sanitizeInput(description, 2000),
        price_range: priceRangeString ? sanitizeInput(priceRangeString, 100) : undefined,
        comuna: sanitizeInput(comuna, 50),
        phone: phone ? sanitizeInput(phone, 20) : undefined,
        // @ts-ignore - Agregando campos nuevos para el backend
        region_id: baseRegion,
        coverage_communes: coverageCommunes,
      });

      toast.success('¡Servicio enviado! Será revisado por un administrador antes de publicarse.');
      await loadUserLimits(); // Actualizar límites
      navigate('/perfil');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error al publicar servicio';

      // Si el error indica que requiere pago, abrir modal de paquetes
      if (error.requires_payment || error.status === 403) {
        setPackagesModalOpen(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si está cargando límites, mostrar loading
  if (loadingLimits) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-2">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Verificando límites de publicaciones...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si requiere pago, solo mostrar el modal (el formulario no se muestra)
  if (!canPublish) {
    return (
      <>
        <PackagesModal
          open={packagesModalOpen}
          onOpenChange={(open) => {
            setPackagesModalOpen(open);
            if (!open) {
              // Si cierra el modal sin seleccionar, volver a servicios
              navigate('/servicios');
            }
          }}
          type="services"
          onPackageSelect={(packageId) => {
            console.log('Paquete seleccionado:', packageId);
            // Aquí se integraría con el sistema de pago
            // Después del pago, se actualizarían los límites y se podría publicar
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10">
        <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
              Ofrecer Servicio
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">Promociona tu oficio o emprendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Aviso de moderación */}
            <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Tu servicio será revisado por un administrador antes de aparecer públicamente. Este proceso puede tomar algunas horas.
              </AlertDescription>
            </Alert>

            {/* Información de límites */}
            {userLimits && user?.role_number !== 5 && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <span>
                      Publicaciones gratis: {userLimits.services.used} / {userLimits.services.free_limit}
                    </span>
                  </div>
                  {userLimits.services.remaining > 0 && (
                    <p className="text-sm mt-1">
                      Te quedan {userLimits.services.remaining} publicación(es) gratis
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="service">Servicio que Ofreces *</Label>
                <Input
                  id="service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Ej: Gasfitería, Peluquería, Diseño Web"
                  required
                />
              </div>

              <div className="space-y-4 p-4 border rounded-xl bg-primary/5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <Label className="text-base font-semibold">Ubicación de Origen</Label>
                    <p className="text-xs text-muted-foreground">Esta es tu ubicación base registrada en tu perfil.</p>
                  </div>
                  {!editBaseLocation && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 h-7 text-xs"
                      onClick={() => setEditBaseLocation(true)}
                    >
                      <Edit size={14} className="mr-1" />
                      Cambiar para este servicio
                    </Button>
                  )}
                </div>

                {!editBaseLocation ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-background py-1.5 px-3 border-primary/20 flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-primary" />
                      {baseRegion && chileData.find(r => r.id === baseRegion)?.name}
                      {baseRegion && ' - '}
                      {comuna || 'Cargando...'}
                    </Badge>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="baseRegion" className="text-xs">Región *</Label>
                      <Select value={baseRegion} onValueChange={(val) => {
                        setBaseRegion(val);
                        setComuna('');
                      }}>
                        <SelectTrigger id="baseRegion" className="h-9">
                          <SelectValue placeholder="Selecciona Región" />
                        </SelectTrigger>
                        <SelectContent>
                          {chileData.map((reg) => (
                            <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="comuna" className="text-xs">Comuna *</Label>
                      <Select value={comuna} onValueChange={setComuna} disabled={!baseRegion}>
                        <SelectTrigger id="comuna" className="h-9">
                          <SelectValue placeholder="Selecciona Comuna" />
                        </SelectTrigger>
                        <SelectContent>
                          {baseRegion && chileData.find(r => r.id === baseRegion)?.communes.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs"
                        onClick={() => {
                          setEditBaseLocation(false);
                          if (user?.comuna) setComuna(user.comuna);
                          if (user?.region_id) setBaseRegion(user.region_id);
                        }}
                      >
                        Restablecer a mi ubicación de perfil
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex flex-col gap-1">
                  <Label className="text-base font-semibold">Zona de Desplazamiento / Cobertura</Label>
                  <p className="text-xs text-muted-foreground">Selecciona las comunas a las que puedes desplazarte para ofrecer tu servicio.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="coverageRegion" className="text-xs">Seleccionar Región para cobertura</Label>
                    <Select value={coverageRegion} onValueChange={setCoverageRegion}>
                      <SelectTrigger id="coverageRegion" className="h-8">
                        <SelectValue placeholder="Elegir Región" />
                      </SelectTrigger>
                      <SelectContent>
                        {chileData.map((reg) => (
                          <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {coverageRegion && (
                    <div className="space-y-2">
                      <Label className="text-xs">Comunas en esta región:</Label>
                      <ScrollArea className="h-48 border rounded-md p-2 bg-background">
                        <div className="grid grid-cols-2 gap-2">
                          {chileData.find(r => r.id === coverageRegion)?.communes.map((c) => (
                            <div key={c} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cov-${c}`}
                                checked={coverageCommunes.includes(c)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setCoverageCommunes([...coverageCommunes, c]);
                                  } else {
                                    setCoverageCommunes(coverageCommunes.filter(item => item !== c));
                                  }
                                }}
                              />
                              <label htmlFor={`cov-${c}`} className="text-sm cursor-pointer truncate">{c}</label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {coverageCommunes.length > 0 && (
                    <div className="pt-2">
                      <Label className="text-xs mb-2 block">Comunas seleccionadas ({coverageCommunes.length}):</Label>
                      <div className="flex flex-wrap gap-1">
                        {coverageCommunes.map(c => (
                          <Badge key={c} variant="secondary" className="pl-2 pr-1 h-6 flex items-center gap-1">
                            {c}
                            <button
                              type="button"
                              onClick={() => setCoverageCommunes(coverageCommunes.filter(item => item !== c))}
                              className="bg-muted-foreground/20 rounded-full p-0.5 hover:bg-muted-foreground/40"
                            >
                              <X size={10} />
                            </button>
                          </Badge>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-destructive hover:text-destructive"
                          onClick={() => setCoverageCommunes([])}
                        >
                          Limpiar todas
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción de tu Servicio *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe tu experiencia, qué servicios específicos ofreces, etc."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minPrice">Precio Mínimo</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="min"
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">Precio Máximo</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="max"
                  />
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  Indica un rango aproximado para que los clientes tengan una referencia
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Teléfono de Contacto (Opcional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={user?.phone || 'Ej: +56 9 1234 5678'}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si no proporcionas un teléfono, se usará el de tu perfil
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/servicios')} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-secondary hover:bg-secondary/90"
                  disabled={isSubmitting || !canPublish}
                >
                  {isSubmitting ? 'Publicando...' : 'Publicar Servicio'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Modal de paquetes (solo se muestra si hay error al publicar) */}
        <PackagesModal
          open={packagesModalOpen && canPublish}
          onOpenChange={setPackagesModalOpen}
          type="services"
          onPackageSelect={(packageId) => {
            console.log('Paquete seleccionado:', packageId);
            // Aquí se integraría con el sistema de pago
          }}
        />
      </div>
    </div>
  );
};

export default PostService;
