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
import { useTranslation } from 'react-i18next';
import { Wrench, AlertCircle, MapPin, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { servicesAPI, packagesAPI, configAPI } from '@/lib/api';
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');
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
      limit: number;
      free_limit: number;
      used: number;
      remaining: number;
      requires_payment: boolean;
    };
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [canPublish, setCanPublish] = useState(false);
  const [pricingEnabled, setPricingEnabled] = useState<boolean>(true);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>([]);
  const [customServiceName, setCustomServiceName] = useState('');
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);

  if (!isLoggedIn) {
    navigate('/registro');
    return null;
  }

  useEffect(() => {
    if (isLoggedIn && (user?.roles.includes('entrepreneur') || user?.role_number === 5)) {
      loadUserLimits();
    }
    // Cargar estado de pricing
    const loadPricingConfig = async () => {
      try {
        const response = await configAPI.getPublicPrices();
        if (response.PRICING_ENABLED !== undefined) {
          setPricingEnabled(!!response.PRICING_ENABLED);
        }
      } catch (error) {
        console.error('Error loading pricing config:', error);
      }
    };
    loadPricingConfig();
    loadServiceTypes();
  }, [isLoggedIn, user]);

  const loadServiceTypes = async () => {
    try {
      setLoadingServiceTypes(true);
      const response = await servicesAPI.getServiceTypes();
      setServiceTypes(response.types || []);
    } catch (error) {
      console.error('Error loading service types:', error);
    } finally {
      setLoadingServiceTypes(false);
    }
  };

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
      } else if (!pricingEnabled) {
        // Si pricing está desactivado, siempre permitir publicar gratis
        setCanPublish(true);
      } else if (limits.services.requires_payment) {
        // Verificar si hay paquetes gratuitos disponibles
        const pkgResponse = await packagesAPI.getServicePackages();
        const hasFreePackage = pkgResponse.packages.some((p: any) => p.price === 0);

        if (hasFreePackage) {
          // Si hay paquetes gratis, permitir publicar (simula infinito)
          setCanPublish(true);
        } else {
          // Si requiere pago y no hay paquetes gratis, mostrar modal
          setCanPublish(false);
          setPackagesModalOpen(true);
        }
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
    toast.error(t('post_service.entrepreneur_only'));
    navigate('/servicios');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((selectedServiceTypeIds.length === 0 && !customServiceName.trim()) || !description || !comuna) {
      toast.error(t('post_service.complete_fields'));
      return;
    }

    // Validaciones de seguridad
    if (customServiceName && !isValidTextField(customServiceName, 100)) {
      toast.error(t('post_service.invalid_name'));
      return;
    }
    if (!isValidTextField(comuna, 50)) {
      toast.error(t('post_service.invalid_comuna'));
      return;
    }
    if (!isValidTextField(description, 2000)) {
      toast.error(t('post_service.invalid_description'));
      return;
    }
    if (phone && !isValidPhone(phone)) {
      toast.error(t('post_service.invalid_phone'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await servicesAPI.createService({
        // @ts-ignore - Backend expects service_type_ids and custom_service_name
        service_type_ids: selectedServiceTypeIds,
        custom_service_name: customServiceName ? sanitizeInput(customServiceName, 100) : undefined,
        description: sanitizeInput(description, 2000),
        comuna: sanitizeInput(comuna, 50),
        phone: phone ? sanitizeInput(phone, 20) : undefined,
        region_id: baseRegion,
        coverage_communes: coverageCommunes,
      });

      toast.success(t('post_service.service_submitted'));
      await loadUserLimits(); // Actualizar límites
      navigate('/perfil');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : t('post_service.publish_error');

      // Si el error indica que requiere pago, abrir modal de paquetes
      if ((error.requires_payment || error.status === 403) && pricingEnabled) {
        setPackagesModalOpen(true);
      } else if (!pricingEnabled) {
        // Si pricing está desactivado, ignorar errores de pago
        toast.error(errorMessage);
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
            <p className="text-muted-foreground">{t('post_service.verifying_limits')}</p>
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
            // Log removed for production security

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
              {t('post_service.title')}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">{t('post_service.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Aviso de moderación */}
            <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                {t('post_service.moderation_alert')}
              </AlertDescription>
            </Alert>

            {userLimits && user?.role_number !== 5 && pricingEnabled && (
              <Alert className="mb-6 bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="font-medium">
                  {t('post_service.free_posts')}: {userLimits.services.used} / {userLimits.services.limit}
                  {userLimits.services.remaining > 0 ? (
                    <span className="ml-2 text-primary">
                      ({t('post_service.remaining_posts', { count: userLimits.services.remaining })})
                    </span>
                  ) : (
                    <span className="ml-2 text-destructive">
                      (Límite alcanzado)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label>{t('post_service.service_label')}</Label>
                {loadingServiceTypes ? (
                  <p className="text-sm text-muted-foreground animate-pulse">Cargando categorías...</p>
                ) : (
                  <div className="space-y-4">
                    <Select
                      onValueChange={(value) => {
                        if (value === 'other') {
                          setSelectedServiceTypeIds([]);
                          setCustomServiceName(' '); // Muestra el campo de texto
                        } else {
                          setSelectedServiceTypeIds([value]);
                          setCustomServiceName('');
                        }
                      }}
                      value={customServiceName ? 'other' : selectedServiceTypeIds[0] || ''}
                    >
                      <SelectTrigger className="w-full h-12 rounded-xl border-primary/20 bg-muted/10 focus:ring-primary">
                        <SelectValue placeholder="Selecciona el tipo de servicio..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id} className="rounded-lg">
                            {type.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="other" className="rounded-lg font-semibold text-primary">
                          Otro / No está en la lista
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!!customServiceName && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="customService" className="text-xs text-primary mb-1 block">
                      Sugiere un nombre para tu servicio *
                    </Label>
                    <Input
                      id="customService"
                      value={customServiceName === ' ' ? '' : customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      placeholder="Ej: Gasfitería de urgencia, Paseo de mascotas exóticas..."
                      className="border-primary/30"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border rounded-xl bg-primary/5">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <Label className="text-base font-semibold">{t('post_service.origin_location')}</Label>
                    <p className="text-xs text-muted-foreground">{t('post_service.base_location_desc')}</p>
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
                      {t('post_service.change_for_service')}
                    </Button>
                  )}
                </div>

                {!editBaseLocation ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-background py-1.5 px-3 border-primary/20 flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-primary" />
                      {baseRegion && chileData.find(r => r.id === baseRegion)?.name}
                      {baseRegion && ' - '}
                      {comuna || t('common.loading')}
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
                          <SelectValue placeholder={t('services.region_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {chileData.map((reg) => (
                            <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="comuna" className="text-xs">{t('wall.comuna')} *</Label>
                      <Select value={comuna} onValueChange={setComuna} disabled={!baseRegion}>
                        <SelectTrigger id="comuna" className="h-9">
                          <SelectValue placeholder={t('services.comuna_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {baseRegion && chileData.find(r => String(r.id) === String(baseRegion))?.communes.map((c) => (
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
                        {t('post_service.reset_location')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex flex-col gap-1">
                  <Label className="text-base font-semibold">{t('post_service.coverage_zone')}</Label>
                  <p className="text-xs text-muted-foreground">{t('post_service.coverage_desc')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="coverageRegion" className="text-xs">{t('post_service.coverage_region_label')}</Label>
                    <Select value={coverageRegion} onValueChange={setCoverageRegion}>
                      <SelectTrigger id="coverageRegion" className="h-8">
                        <SelectValue placeholder={t('post_service.choose_region')} />
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
                      <Label className="text-xs">{t('post_service.communes_in_region')}</Label>
                      <ScrollArea className="h-48 border rounded-md p-2 bg-background">
                        <div className="grid grid-cols-2 gap-2">
                          {chileData.find(r => String(r.id) === String(coverageRegion))?.communes.map((c) => (
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
                      <Label className="text-xs mb-2 block">{t('post_service.selected_communes', { count: coverageCommunes.length })}:</Label>
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
                          {t('post_service.clear_all')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">{t('post_service.description_label')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('post_service.description_placeholder')}
                  rows={5}
                  required
                />
                <p className="text-[10px] text-secondary font-medium italic mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Nota: El precio de tu servicio se coordina por interno con los interesados.
                </p>
              </div>


              <div>
                <Label htmlFor="phone">{t('post_service.phone_label')}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={user?.phone || t('post_service.phone_placeholder')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('post_service.phone_desc')}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/servicios')} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-secondary hover:bg-secondary/90"
                  disabled={isSubmitting || !canPublish}
                >
                  {isSubmitting ? t('wall.publishing') : t('services.publish_btn')}
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
            // Log removed for production security

            // Aquí se integraría con el sistema de pago
          }}
        />
      </div>
    </div>
  );
};

export default PostService;
