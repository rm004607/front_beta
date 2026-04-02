import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { AlertCircle, MapPin, Edit, Sparkles, Loader2, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { servicesAPI, packagesAPI, configAPI, aiAPI, regionsAPI } from '@/lib/api';
import {
  isValidTextField,
  validatePhone,
  isValidPhone,
  sanitizeInput,
  getValidationErrorMessage
} from '@/lib/input-validator';
import PackagesModal from '@/components/PackagesModal';
import {
  resolveOriginLocation,
  buildServiceRegionPayload,
  resolveComunaForOfferRegionApi,
} from '@/lib/chile-region-helpers';
import { loadRegionOptionsSorted, type RegionOption } from '@/lib/regions-catalog';
import { catalogFetchUserMessage } from '@/lib/catalog-fetch-errors';
import { invalidateServicesListQueries } from '@/lib/services-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

/** Solo filas cuya region_id coincide con la región pedida (evita datos cruzados si la BD responde mal). */
function communesNamesFromApiResponse(
  rid: string,
  r: { region_id: number; communes: { name: string; region_id: number }[] }
): string[] | null {
  if (Number(r.region_id) !== Number(rid)) return null;
  const names = r.communes
    .filter((c) => Number(c.region_id) === Number(rid))
    .map((c) => c.name);
  return names.length > 0 ? names : null;
}

const PostService = () => {
  const { user, isLoggedIn } = useUser();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');
  const [comuna, setComuna] = useState(user?.comuna || ''); // Comuna base
  const [baseRegion, setBaseRegion] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [baseCommunesCatalog, setBaseCommunesCatalog] = useState<string[]>([]);
  const [coverageRegion, setCoverageRegion] = useState('');
  const [coverageCommunes, setCoverageCommunes] = useState<string[]>([]);
  const [coverageCommunesCatalog, setCoverageCommunesCatalog] = useState<string[]>([]);
  const latestBaseRegionRef = useRef('');
  const latestCoverageRegionRef = useRef('');
  const [apiRegions, setApiRegions] = useState<RegionOption[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [regionsRetryKey, setRegionsRetryKey] = useState(0);
  const [baseCommunesError, setBaseCommunesError] = useState<string | null>(null);
  const [baseCommunesRetryKey, setBaseCommunesRetryKey] = useState(0);
  const [coverageCommunesError, setCoverageCommunesError] = useState<string | null>(null);
  const [coverageCommunesRetryKey, setCoverageCommunesRetryKey] = useState(0);
  const [loadingBaseCommunes, setLoadingBaseCommunes] = useState(false);
  const [loadingCoverageCommunes, setLoadingCoverageCommunes] = useState(false);
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
  const [improvingDescription, setImprovingDescription] = useState(false);
  const [suggestedDescription, setSuggestedDescription] = useState('');
  const [showDescriptionSuggestion, setShowDescriptionSuggestion] = useState(false);
  const [aiError, setAiError] = useState<{ message: string; showRetryButton: boolean } | null>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const servicePhotoInputRef = useRef<HTMLInputElement>(null);
  const [servicePhotos, setServicePhotos] = useState<File[]>([]);

  const MAX_SERVICE_PHOTOS = 5;
  const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

  const servicePhotoPreviewUrls = useMemo(
    () => servicePhotos.map((f) => URL.createObjectURL(f)),
    [servicePhotos]
  );

  useEffect(() => {
    return () => {
      servicePhotoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [servicePhotoPreviewUrls]);

  const addServicePhotos = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith('image/'));
    setServicePhotos((prev) => {
      const next = [...prev];
      let skippedOverLimit = false;
      for (const f of incoming) {
        if (next.length >= MAX_SERVICE_PHOTOS) {
          skippedOverLimit = true;
          break;
        }
        if (f.size > MAX_PHOTO_BYTES) {
          toast.error(`«${f.name}» supera el máximo de 8 MB por imagen.`);
          continue;
        }
        next.push(f);
      }
      if (skippedOverLimit) {
        toast.error(`Solo puedes subir hasta ${MAX_SERVICE_PHOTOS} fotos por servicio.`);
      }
      return next;
    });
    if (servicePhotoInputRef.current) servicePhotoInputRef.current.value = '';
  };

  const removeServicePhoto = (index: number) => {
    setServicePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isLoggedIn) {
    navigate('/registro');
    return null;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRegionsLoading(true);
      setRegionsError(null);
      try {
        const list = await loadRegionOptionsSorted();
        if (cancelled) return;
        setApiRegions(list);
        if (list.length === 0) {
          setRegionsError(
            'No recibimos regiones desde el servidor. Puede ser un fallo temporal; no asumimos que el catálogo esté vacío.'
          );
        }
      } catch (e) {
        if (!cancelled) {
          setApiRegions([]);
          setRegionsError(catalogFetchUserMessage(e));
        }
      } finally {
        if (!cancelled) setRegionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regionsRetryKey]);

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

  // Pre-llenado de ubicaciÃ³n desde el perfil
  useEffect(() => {
    if (user) {
      if (user.comuna) setComuna(user.comuna);
      if (user.region_id) {
        setBaseRegion(user.region_id);
        setCoverageRegion(user.region_id);
      }
    }
  }, [user]);

  latestBaseRegionRef.current = baseRegion;
  latestCoverageRegionRef.current = coverageRegion;

  const regionLabel = (id: string) => apiRegions.find((r) => r.id === String(id))?.name;

  const regionsCatalogUsable = !regionsLoading && !regionsError && apiRegions.length > 0;

  /** Solo datos del API: chile-data usa otros numéricos de región y rompe RM vs Aysén. */
  const baseCommunesForUi = baseCommunesCatalog;

  useEffect(() => {
    if (!baseRegion) {
      setBaseCommunesCatalog([]);
      setLoadingBaseCommunes(false);
      setBaseCommunesError(null);
      return;
    }
    setBaseCommunesCatalog([]);
    setBaseCommunesError(null);
    setLoadingBaseCommunes(true);
    let cancelled = false;
    const rid = String(baseRegion);
    (async () => {
      try {
        const r = await regionsAPI.getCommunesByRegion(rid);
        if (cancelled || latestBaseRegionRef.current !== rid) return;
        const names = communesNamesFromApiResponse(rid, r);
        if (names) {
          setBaseCommunesCatalog(names);
        } else {
          setBaseCommunesCatalog([]);
          setBaseCommunesError(
            'La respuesta de comunas no coincide con la región o está vacía. Reintenta o cambia de región.'
          );
        }
      } catch (e) {
        if (!cancelled && latestBaseRegionRef.current === rid) {
          setBaseCommunesCatalog([]);
          setBaseCommunesError(catalogFetchUserMessage(e));
        }
      } finally {
        if (!cancelled && latestBaseRegionRef.current === rid) {
          setLoadingBaseCommunes(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseRegion, baseCommunesRetryKey]);

  const coverageCommunesForUi = coverageCommunesCatalog;

  useEffect(() => {
    if (!coverageRegion) {
      setCoverageCommunesCatalog([]);
      setLoadingCoverageCommunes(false);
      setCoverageCommunesError(null);
      return;
    }
    setCoverageCommunesCatalog([]);
    setCoverageCommunesError(null);
    setLoadingCoverageCommunes(true);
    let cancelled = false;
    const rid = String(coverageRegion);
    (async () => {
      try {
        const r = await regionsAPI.getCommunesByRegion(rid);
        if (cancelled || latestCoverageRegionRef.current !== rid) return;
        const names = communesNamesFromApiResponse(rid, r);
        if (names) {
          setCoverageCommunesCatalog(names);
        } else {
          setCoverageCommunesCatalog([]);
          setCoverageCommunesError(
            'La respuesta de comunas no coincide con la región o está vacía. Reintenta o cambia de región.'
          );
        }
      } catch (e) {
        if (!cancelled && latestCoverageRegionRef.current === rid) {
          setCoverageCommunesCatalog([]);
          setCoverageCommunesError(catalogFetchUserMessage(e));
        }
      } finally {
        if (!cancelled && latestCoverageRegionRef.current === rid) {
          setLoadingCoverageCommunes(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coverageRegion, coverageCommunesRetryKey]);

  const loadUserLimits = async () => {
    try {
      setLoadingLimits(true);
      const limits = await packagesAPI.getUserLimits();
      setUserLimits(limits);

      // Si es super-admin, siempre puede publicar
      if (user?.role_number === 5) {
        setCanPublish(true);
      } else if (!pricingEnabled) {
        // Si pricing estÃ¡ desactivado, siempre permitir publicar gratis
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

  // Verificar que el usuario sea emprendedor o super-admin (opcional, el backend tambiÃ©n lo valida)
  if (!user?.roles.includes('entrepreneur') && user?.role_number !== 5) {
    toast.error(t('post_service.entrepreneur_only'));
    navigate('/servicios');
    return null;
  }

  const handleImproveDescription = async () => {
    const baseText = description.trim();

    if (baseText.length < 20) {
      toast.error('Escribe una descripción de al menos 20 caracteres');
      return;
    }

    setAiError(null);
    try {
      setImprovingDescription(true);
      const response = await aiAPI.rewriteServiceDescription(baseText);
      const suggestion = response?.suggestion?.trim();

      if (!suggestion) {
        toast.error('No se pudo generar una sugerencia');
        return;
      }

      if (!response.changed) {
        setShowDescriptionSuggestion(false);
        toast.success('Tu descripción ya está bien redactada');
        return;
      }

      setSuggestedDescription(suggestion);
      setShowDescriptionSuggestion(true);
    } catch (error: any) {
      if (error?.status === 422 && error?.code === 'unintelligible_input') {
        setAiError({
          message: 'No pudimos entender lo que escribiste. Intenta describirlo de nuevo de forma más clara.',
          showRetryButton: true,
        });
      } else {
        setAiError({
          message: 'Error al mejorar la descripción. Intenta más tarde.',
          showRetryButton: false,
        });
      }
    } finally {
      setImprovingDescription(false);
    }
  };

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
      const phoneError = validatePhone(phone);
      toast.error(getValidationErrorMessage('phone', phoneError === 'format' ? 'format' : 'length'));
      return;
    }

    setIsSubmitting(true);
    try {
      const origin = resolveOriginLocation(sanitizeInput(comuna, 50), baseRegion);
      if ('error' in origin) {
        toast.error(origin.error);
        return;
      }

      const serviceName =
        customServiceName && customServiceName.trim() && customServiceName !== ' '
          ? sanitizeInput(customServiceName.trim(), 100)
          : selectedServiceTypeIds.length > 0
            ? (serviceTypes.find((t) => String(t.id) === String(selectedServiceTypeIds[0]))?.name || '').trim()
            : '';
      if (!serviceName) {
        toast.error('Selecciona un tipo de servicio o escribe un nombre personalizado');
        return;
      }

      const hasCoverage = coverageCommunes.length > 0;
      const regionBuild = hasCoverage
        ? buildServiceRegionPayload(
            coverageRegion || origin.region_id,
            coverageCommunes,
            origin.region_id
          )
        : buildServiceRegionPayload('', [], origin.region_id);

      if (regionBuild.error) {
        toast.error(regionBuild.error);
        return;
      }

      const { region_id: offerRegionId, coverage_communes: coveragePayload } = regionBuild.payload;

      const comunaRes = resolveComunaForOfferRegionApi(
        origin.comuna,
        offerRegionId,
        coveragePayload
      );
      if ('error' in comunaRes) {
        toast.error(comunaRes.error);
        return;
      }

      const response = await servicesAPI.createService(
        {
          service_name: serviceName,
          service_type_ids: selectedServiceTypeIds,
          custom_service_name:
            customServiceName && customServiceName.trim() && customServiceName !== ' '
              ? sanitizeInput(customServiceName.trim(), 100)
              : undefined,
          description: sanitizeInput(description, 2000),
          comuna: comunaRes.comuna,
          phone: phone ? sanitizeInput(phone, 20) : undefined,
          region_id: offerRegionId,
          coverage_communes: coveragePayload ?? [],
        },
        servicePhotos.length > 0 ? { images: servicePhotos } : undefined
      );

      toast.success(t('post_service.service_submitted'));
      await loadUserLimits(); // Actualizar lÃ­mites
      invalidateServicesListQueries(queryClient);
      navigate('/perfil');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : t('post_service.publish_error');

      // Si el error indica que requiere pago, abrir modal de paquetes
      if ((error.requires_payment || error.status === 403) && pricingEnabled) {
        setPackagesModalOpen(true);
      } else if (!pricingEnabled) {
        // Si pricing estÃ¡ desactivado, ignorar errores de pago
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si estÃ¡ cargando lÃ­mites, mostrar loading
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

            // AquÃ­ se integrarÃ­a con el sistema de pago
            // DespuÃ©s del pago, se actualizarÃ­an los lÃ­mites y se podrÃ­a publicar
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

      <div className="container relative z-10 mx-auto max-w-3xl px-4 py-8 lg:max-w-6xl">
        <Card className="glass-card overflow-hidden border-white/5 shadow-2xl">
          <CardHeader className="pb-2 text-center lg:px-10">
            <CardTitle className="mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text font-heading text-3xl font-bold text-transparent sm:text-4xl">
              {t('post_service.title')}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground sm:text-lg">{t('post_service.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="lg:px-10">
            {/* Aviso de moderaciÃ³n */}
            <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                {t('post_service.moderation_alert')}
              </AlertDescription>
            </Alert>

            {userLimits && user?.role_number !== 5 && pricingEnabled && !userLimits.services.is_infinite && (
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
                      (LÃ­mite alcanzado)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {regionsLoading && (
              <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                <span>Cargando catálogo de regiones…</span>
              </div>
            )}
            {!regionsLoading && regionsError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  <span>{regionsError}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-destructive/40"
                    onClick={() => setRegionsRetryKey((k) => k + 1)}
                  >
                    Reintentar
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
                {/* Columna izquierda (móvil: orden 1) — tipo y ubicación */}
                <div className="min-w-0 space-y-6">
              <div className="space-y-4">
                <Label>{t('post_service.service_label')}</Label>
                {loadingServiceTypes ? (
                  <p className="text-sm text-muted-foreground animate-pulse">Cargando categorÃ­as...</p>
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
                          Otro / No estÃ¡ en la lista
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
                      placeholder="Ej: GasfiterÃ­a de urgencia, Paseo de mascotas exÃ³ticas..."
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
                    <p className="text-[11px] text-muted-foreground/90 mt-1">
                      Tu comuna y región de origen. Más abajo puedes marcar otras comunas de la misma región donde te desplazas.
                    </p>
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
                      {baseRegion &&
                        (regionLabel(baseRegion) ??
                          (regionsLoading ? '…' : baseRegion ? `Región ${baseRegion}` : ''))}
                      {baseRegion && ' - '}
                      {comuna || t('common.loading')}
                    </Badge>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="baseRegion" className="text-xs">Región *</Label>
                      <Select
                        value={baseRegion}
                        disabled={!regionsCatalogUsable}
                        onValueChange={(val) => {
                        setBaseRegion(val);
                        setComuna('');
                        setCoverageRegion(val);
                        setCoverageCommunes([]);
                      }}
                      >
                        <SelectTrigger id="baseRegion" className="h-9">
                          <SelectValue
                            placeholder={
                              regionsLoading
                                ? 'Cargando regiones…'
                                : regionsError
                                  ? 'Regiones no disponibles'
                                  : t('services.region_placeholder')
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {apiRegions.map((reg) => (
                            <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="comuna" className="text-xs">{t('wall.comuna')} *</Label>
                      <Select
                        value={comuna}
                        onValueChange={setComuna}
                        disabled={
                          !baseRegion ||
                          loadingBaseCommunes ||
                          !!baseCommunesError ||
                          baseCommunesForUi.length === 0
                        }
                      >
                        <SelectTrigger id="comuna" className="h-9">
                          <SelectValue
                            placeholder={
                              loadingBaseCommunes ? 'Cargando comunas…' : t('services.comuna_placeholder')
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {baseRegion && baseCommunesForUi.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {loadingBaseCommunes && baseRegion && (
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden />
                          Cargando comunas de la región…
                        </p>
                      )}
                      {baseCommunesError && (
                        <Alert variant="destructive" className="mt-2 py-2">
                          <AlertDescription className="flex flex-wrap items-center gap-2 text-sm">
                            <span>{baseCommunesError}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="shrink-0 h-7 text-xs border-destructive/40"
                              onClick={() => setBaseCommunesRetryKey((k) => k + 1)}
                            >
                              Reintentar
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
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
                          if (user?.region_id) {
                            setBaseRegion(user.region_id);
                            setCoverageRegion(user.region_id);
                            setCoverageCommunes([]);
                          }
                        }}
                      >
                        {t('post_service.reset_location')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Zona de desplazamiento (opcional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Marca las comunas adicionales donde atiendes dentro de la región. Si no marcas ninguna, solo se usa tu ubicación de origen.
                  </p>
                </div>
                <div>
                  <Label htmlFor="coverageRegion" className="text-xs">Región de cobertura</Label>
                  <Select
                    value={coverageRegion}
                    disabled={!regionsCatalogUsable}
                    onValueChange={(rid) => {
                      setCoverageRegion(rid);
                      setCoverageCommunes([]);
                    }}
                  >
                    <SelectTrigger id="coverageRegion" className="h-9 mt-1">
                      <SelectValue
                        placeholder={
                          regionsLoading
                            ? 'Cargando regiones…'
                            : regionsError
                              ? 'Regiones no disponibles'
                              : t('services.region_placeholder')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {apiRegions.map((reg) => (
                        <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {coverageRegion && (
                  <>
                    {coverageCommunesError && (
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription className="flex flex-wrap items-center gap-2 text-sm">
                          <span>{coverageCommunesError}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0 h-7 text-xs border-destructive/40"
                            onClick={() => setCoverageCommunesRetryKey((k) => k + 1)}
                          >
                            Reintentar
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    {coverageCommunes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {coverageCommunes.map((c) => (
                          <Badge
                            key={c}
                            variant="secondary"
                            className="pl-2 pr-1 py-1 gap-1 font-normal"
                          >
                            {c}
                            <button
                              type="button"
                              className="rounded-full p-0.5 hover:bg-muted"
                              aria-label={`Quitar ${c}`}
                              onClick={() =>
                                setCoverageCommunes((prev) => prev.filter((x) => x !== c))
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={
                          loadingCoverageCommunes ||
                          !!coverageCommunesError ||
                          coverageCommunesForUi.length === 0
                        }
                        onClick={() => {
                          if (coverageCommunes.length === coverageCommunesForUi.length) {
                            setCoverageCommunes([]);
                          } else {
                            setCoverageCommunes([...coverageCommunesForUi]);
                          }
                        }}
                      >
                        {coverageCommunes.length === coverageCommunesForUi.length
                          ? 'Quitar todas'
                          : 'Seleccionar todas'}
                      </Button>
                    </div>
                    <ScrollArea className="h-[200px] rounded-md border p-3">
                      <div className="space-y-2 pr-3">
                        {loadingCoverageCommunes && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                            <span>Cargando comunas…</span>
                          </div>
                        )}
                        {!loadingCoverageCommunes &&
                          !coverageCommunesError &&
                          coverageCommunesForUi.length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">
                            No hay comunas para mostrar.
                          </p>
                        )}
                        {coverageCommunesForUi.map((c) => (
                          <label
                            key={c}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              checked={coverageCommunes.includes(c)}
                              onCheckedChange={() => {
                                setCoverageCommunes((prev) =>
                                  prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                                );
                              }}
                            />
                            <span>{c}</span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </div>
                </div>

                {/* Columna derecha (móvil: orden 2) — fotos, descripción, teléfono */}
                <div className="min-w-0 space-y-6">
              <div className="rounded-xl border border-dashed border-primary/20 bg-muted/15 p-4 sm:p-5 lg:border-primary/15">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <Label className="text-base font-semibold">Fotos del servicio</Label>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Opcional · máx. {MAX_SERVICE_PHOTOS}
                  </span>
                </div>
                <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
                  Sube hasta cinco imágenes para mostrar tu trabajo. Si no subes ninguna, el anuncio se verá como siempre. Formatos: JPG, PNG, WebP.
                </p>
                <input
                  ref={servicePhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="sr-only"
                  aria-hidden
                  tabIndex={-1}
                  onChange={(e) => addServicePhotos(e.target.files)}
                />
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
                  {servicePhotoPreviewUrls.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeServicePhoto(idx)}
                        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 shadow-md transition hover:bg-black/80 lg:opacity-0 lg:group-hover:opacity-100"
                        aria-label={`Quitar foto ${idx + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {servicePhotos.length < MAX_SERVICE_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => servicePhotoInputRef.current?.click()}
                      className="flex aspect-square min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/30 bg-background/80 text-primary transition hover:border-primary/50 hover:bg-primary/5 sm:min-h-0"
                    >
                      <ImagePlus className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.5} />
                      <span className="px-1 text-center text-[10px] font-semibold leading-tight sm:text-xs">Añadir</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">{t('post_service.description_label')}</Label>
                <Textarea
                  ref={descriptionTextareaRef}
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (showDescriptionSuggestion) {
                      setShowDescriptionSuggestion(false);
                    }
                    if (aiError) setAiError(null);
                  }}
                  placeholder={t('post_service.description_placeholder')}
                  rows={5}
                  required
                />
                {aiError && (
                  <Alert variant="destructive" className="mt-3 select-none">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex flex-wrap items-center gap-2">
                      <span>{aiError.message}</span>
                      {aiError.showRetryButton && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setAiError(null);
                            descriptionTextareaRef.current?.focus();
                          }}
                        >
                          Intentar de nuevo
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="button"
                  variant="default"
                  className="mt-3 border-0 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/30 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-400 focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:opacity-90"
                  onClick={handleImproveDescription}
                  disabled={improvingDescription || description.trim().length < 20}
                >
                  {improvingDescription ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                      <span>Mejorando redacción...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 shrink-0" />
                      <span>Mejorar redacción con IA</span>
                    </>
                  )}
                </Button>

                {showDescriptionSuggestion && suggestedDescription && (
                  <div className="mt-3 p-3 rounded-md border border-primary/30 bg-primary/5 space-y-3">
                    <p className="text-sm font-semibold text-primary">Sugerencia de redacción</p>
                    <p className="text-sm whitespace-pre-wrap">{suggestedDescription}</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setDescription(suggestedDescription);
                          setShowDescriptionSuggestion(false);
                          toast.success('Descripción actualizada con la sugerencia');
                        }}
                      >
                        Usar sugerencia
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDescriptionSuggestion(false)}
                      >
                        Mantener mi texto
                      </Button>
                    </div>
                  </div>
                )}
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
                  className={phone && validatePhone(phone) === 'format' ? 'border-red-500' : ''}
                />
                {phone && validatePhone(phone) === 'format' && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {getValidationErrorMessage('phone', 'format')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('post_service.phone_desc')}
                </p>
              </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/50 pt-6 sm:flex-row sm:gap-4 lg:col-span-2">
                <Button type="button" variant="outline" onClick={() => navigate('/servicios')} className="h-12 flex-1 sm:h-11">
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="h-12 flex-1 bg-secondary hover:bg-secondary/90 sm:h-11"
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

            // AquÃ­ se integrarÃ­a con el sistema de pago
          }}
        />
      </div>
    </div>
  );
};

export default PostService;
