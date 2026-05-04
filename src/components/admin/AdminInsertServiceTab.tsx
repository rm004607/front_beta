import { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { servicesAPI, regionsAPI } from '@/lib/api';
import {
  resolveOriginLocation,
  buildServiceRegionPayload,
  resolveComunaForOfferRegionApi,
} from '@/lib/chile-region-helpers';
import { catalogFetchUserMessage } from '@/lib/catalog-fetch-errors';
import { loadRegionOptionsSorted, type RegionOption } from '@/lib/regions-catalog';
import { invalidateServicesListQueries } from '@/lib/services-query';
import {
  isValidTextField,
  validatePhone,
  isValidPhone,
  sanitizeInput,
  getValidationErrorMessage,
} from '@/lib/input-validator';
import { toast } from 'sonner';
import { AlertCircle, ImagePlus, Loader2, MapPin, X } from 'lucide-react';

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

const MAX_SERVICE_PHOTOS = 5;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/**
 * Formulario tipo publicar servicio + nombre del prestador (tercero no registrado).
 * Solo se muestra si `canShowAdminInsertServiceTab` en el padre.
 */
export function AdminInsertServiceTab() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [providerDisplayName, setProviderDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [comuna, setComuna] = useState('');
  const [baseRegion, setBaseRegion] = useState('');
  const [phone, setPhone] = useState('');
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
  const [serviceTypes, setServiceTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<string[]>([]);
  const [customServiceName, setCustomServiceName] = useState('');
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
  const servicePhotoInputRef = useRef<HTMLInputElement>(null);
  const [servicePhotos, setServicePhotos] = useState<File[]>([]);

  const servicePhotoPreviewUrls = useMemo(
    () => servicePhotos.map((f) => URL.createObjectURL(f)),
    [servicePhotos]
  );

  useEffect(() => {
    return () => {
      servicePhotoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [servicePhotoPreviewUrls]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRegionsLoading(true);
      setRegionsError(null);
      try {
        const list = await loadRegionOptionsSorted();
        if (!cancelled) setApiRegions(list);
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
    let cancelled = false;
    (async () => {
      setLoadingServiceTypes(true);
      try {
        const response = await servicesAPI.getServiceTypes();
        if (!cancelled) setServiceTypes((response.types || []).filter((t: { is_active?: boolean }) => t.is_active !== false));
      } catch {
        if (!cancelled) setServiceTypes([]);
      } finally {
        if (!cancelled) setLoadingServiceTypes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  latestBaseRegionRef.current = baseRegion;
  latestCoverageRegionRef.current = coverageRegion;

  const regionLabel = (id: string) => apiRegions.find((r) => r.id === String(id))?.name;
  const regionsCatalogUsable = !regionsLoading && !regionsError && apiRegions.length > 0;
  const baseCommunesForUi = baseCommunesCatalog;
  const coverageCommunesForUi = coverageCommunesCatalog;

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

  const addServicePhotos = (list: FileList | null) => {
    if (!list?.length) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith('image/'));
    setServicePhotos((prev) => {
      const next = [...prev];
      for (const f of incoming) {
        if (next.length >= MAX_SERVICE_PHOTOS) break;
        if (f.size > MAX_PHOTO_BYTES) {
          toast.error(`«${f.name}» supera el máximo de 8 MB por imagen.`);
          continue;
        }
        next.push(f);
      }
      return next;
    });
    if (servicePhotoInputRef.current) servicePhotoInputRef.current.value = '';
  };

  const removeServicePhoto = (index: number) => {
    setServicePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerDisplayName.trim()) {
      toast.error('Indica el nombre de la persona que ofrece el servicio.');
      return;
    }
    if ((selectedServiceTypeIds.length === 0 && !customServiceName.trim()) || !description || !comuna) {
      toast.error('Completa categoría o nombre personalizado, descripción y comuna.');
      return;
    }
    if (!isValidTextField(providerDisplayName.trim(), 120)) {
      toast.error('Nombre del prestador no válido (máx. 120 caracteres).');
      return;
    }
    if (customServiceName && !isValidTextField(customServiceName, 100)) {
      toast.error('Nombre del servicio no válido.');
      return;
    }
    if (!isValidTextField(comuna, 50)) {
      toast.error('Comuna no válida.');
      return;
    }
    if (!isValidTextField(description, 2000)) {
      toast.error('Descripción no válida.');
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
        toast.error('Selecciona un tipo de servicio o escribe un nombre personalizado.');
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

      await servicesAPI.createService(
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
          provider_display_name: sanitizeInput(providerDisplayName.trim(), 120),
        },
        servicePhotos.length > 0 ? { images: servicePhotos } : undefined
      );

      toast.success('Servicio creado. Si el nombre del prestador no se ve, falta soporte en el backend.');
      invalidateServicesListQueries(queryClient);
      setProviderDisplayName('');
      setDescription('');
      setCustomServiceName('');
      setSelectedServiceTypeIds([]);
      setServicePhotos([]);
      setCoverageCommunes([]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al crear el servicio';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Dato insertado 1</CardTitle>
        <CardDescription>
          Publica un servicio como si fuera uno normal; indica el nombre de quien lo ofrece (persona sin cuenta en el sitio).
          Operación registrada como usuario: <span className="font-medium text-foreground">{user?.name}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {regionsLoading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
            Cargando catálogo de regiones…
          </div>
        )}
        {!regionsLoading && regionsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{regionsError}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => setRegionsRetryKey((k) => k + 1)}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <div className="space-y-2">
            <Label htmlFor="provider-name">Nombre de quien ofrece el servicio *</Label>
            <Input
              id="provider-name"
              value={providerDisplayName}
              onChange={(e) => setProviderDisplayName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="max-w-md"
              autoComplete="name"
              required
            />
            <p className="text-xs text-muted-foreground">
              Se envía al backend como <code className="text-[10px]">provider_display_name</code> para mostrarlo como nombre público del anuncio.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Servicio *</Label>
            {loadingServiceTypes ? (
              <p className="text-sm text-muted-foreground">Cargando categorías…</p>
            ) : (
              <Select
                onValueChange={(value) => {
                  if (value === 'other') {
                    setSelectedServiceTypeIds([]);
                    setCustomServiceName(' ');
                  } else {
                    setSelectedServiceTypeIds([value]);
                    setCustomServiceName('');
                  }
                }}
                value={customServiceName ? 'other' : selectedServiceTypeIds[0] || ''}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Tipo de servicio…" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Otro / no está en la lista</SelectItem>
                </SelectContent>
              </Select>
            )}
            {!!customServiceName && (
              <Input
                value={customServiceName === ' ' ? '' : customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                placeholder="Nombre del servicio"
                className="max-w-md"
                required
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="ins-base-region">Región (origen) *</Label>
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
                <SelectTrigger id="ins-base-region">
                  <SelectValue placeholder="Región" />
                </SelectTrigger>
                <SelectContent>
                  {apiRegions.map((reg) => (
                    <SelectItem key={reg.id} value={reg.id}>
                      {reg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins-comuna">Comuna *</Label>
              <Select
                value={comuna}
                onValueChange={setComuna}
                disabled={
                  !baseRegion || loadingBaseCommunes || !!baseCommunesError || baseCommunesForUi.length === 0
                }
              >
                <SelectTrigger id="ins-comuna">
                  <SelectValue placeholder={loadingBaseCommunes ? 'Cargando…' : 'Comuna'} />
                </SelectTrigger>
                <SelectContent>
                  {baseRegion &&
                    baseCommunesForUi.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {baseCommunesError && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="flex flex-wrap gap-2 items-center text-sm">
                    {baseCommunesError}
                    <Button type="button" size="sm" variant="outline" onClick={() => setBaseCommunesRetryKey((k) => k + 1)}>
                      Reintentar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          {baseRegion && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {regionLabel(baseRegion) ?? baseRegion}
              {comuna ? ` · ${comuna}` : ''}
            </p>
          )}

          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <Label className="text-base">Zona de desplazamiento (opcional)</Label>
            <p className="text-xs text-muted-foreground">
              Misma lógica que en publicar servicio: comunas extra donde atiende el prestador.
            </p>
            <div className="max-w-md">
              <Label className="text-xs">Región de cobertura</Label>
              <Select
                value={coverageRegion}
                disabled={!regionsCatalogUsable}
                onValueChange={(rid) => {
                  setCoverageRegion(rid);
                  setCoverageCommunes([]);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Región" />
                </SelectTrigger>
                <SelectContent>
                  {apiRegions.map((reg) => (
                    <SelectItem key={reg.id} value={reg.id}>
                      {reg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {coverageRegion && (
              <>
                {coverageCommunesError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="flex flex-wrap gap-2 text-sm">
                      {coverageCommunesError}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setCoverageCommunesRetryKey((k) => k + 1)}
                      >
                        Reintentar
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <ScrollArea className="h-[180px] rounded-md border p-3">
                  <div className="space-y-2 pr-3">
                    {loadingCoverageCommunes && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando comunas…
                      </div>
                    )}
                    {!loadingCoverageCommunes &&
                      coverageCommunesForUi.map((c) => (
                        <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
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

          <div className="space-y-2">
            <Label htmlFor="ins-desc">Descripción *</Label>
            <Textarea
              id="ins-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe el servicio…"
              required
            />
          </div>

          <div className="space-y-2 max-w-md">
            <Label htmlFor="ins-phone">Teléfono (opcional)</Label>
            <Input
              id="ins-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 …"
              inputMode="tel"
            />
          </div>

          <div className="rounded-xl border border-dashed border-primary/25 p-4">
            <Label className="text-base">Fotos (opcional, máx. {MAX_SERVICE_PHOTOS})</Label>
            <input
              ref={servicePhotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => addServicePhotos(e.target.files)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {servicePhotoPreviewUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeServicePhoto(idx)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Quitar foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {servicePhotos.length < MAX_SERVICE_PHOTOS && (
                <button
                  type="button"
                  onClick={() => servicePhotoInputRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-primary"
                >
                  <ImagePlus className="h-6 w-6" />
                  Añadir
                </button>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando…
              </>
            ) : (
              'Crear servicio'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
