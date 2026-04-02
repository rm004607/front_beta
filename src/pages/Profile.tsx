import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/contexts/UserContext';
import { MapPin, Phone, Mail, Wrench, Building2, Trash2, FileText, Plus, Star, Users, ChevronRight, Loader2, X } from 'lucide-react';
import { servicesAPI, authAPI, regionsAPI, adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  validatePhone,
  isValidPhone,
  isValidComuna,
  isValidTextField,
  isValidRut,
  formatRut,
  sanitizeInput,
  getValidationErrorMessage
} from '@/lib/input-validator';
import {
  resolveOriginLocation,
  buildServiceRegionPayload,
  resolveComunaForOfferRegionApi,
} from '@/lib/chile-region-helpers';
import { getServiceLocationDisplay, getUserOfferRegionDisplayName } from '@/lib/serviceUtils';
import { loadRegionOptionsSorted, type RegionOption } from '@/lib/regions-catalog';
import { catalogFetchUserMessage } from '@/lib/catalog-fetch-errors';
import { invalidateServicesListQueries } from '@/lib/services-query';

function sortProfileEditCatalogTypes<T extends { name: string; is_active?: boolean }>(types: T[]): T[] {
  return [...types].sort((a, b) => {
    const ac = a.is_active === false ? 1 : 0;
    const bc = b.is_active === false ? 1 : 0;
    if (ac !== bc) return ac - bc;
    return a.name.localeCompare(b.name, 'es');
  });
}

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

interface Service {
  id: string;
  service_name: string;
  description: string;
  price_range?: string;
  comuna: string;
  status: string;
  created_at: string;
  average_rating?: number;
  reviews_count?: number;
  region_id?: string;
  coverage_communes?: string[];
}


const Profile = () => {
  const { user, isLoggedIn, isLoading, loadUser } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locRegion, setLocRegion] = useState('');
  const [locComuna, setLocComuna] = useState('');
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [showCompleteProfileDialog, setShowCompleteProfileDialog] = useState(false);
  const [completePhone, setCompletePhone] = useState('');
  const [completeRut, setCompleteRut] = useState('');
  const [completeComuna, setCompleteComuna] = useState('');
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editServiceRegion, setEditServiceRegion] = useState('');
  const [editServiceComuna, setEditServiceComuna] = useState('');
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editServiceCoverageCommunes, setEditServiceCoverageCommunes] = useState<string[]>([]);
  const [loadingServiceDetail, setLoadingServiceDetail] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);

  const [completeRegion, setCompleteRegion] = useState('');
  const [apiRegions, setApiRegions] = useState<RegionOption[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [regionsRetryKey, setRegionsRetryKey] = useState(0);
  const [locCommunes, setLocCommunes] = useState<string[]>([]);
  const [locCommunesLoading, setLocCommunesLoading] = useState(false);
  const [locCommunesError, setLocCommunesError] = useState<string | null>(null);
  const [locCommunesRetryKey, setLocCommunesRetryKey] = useState(0);
  const [editServiceCommunes, setEditServiceCommunes] = useState<string[]>([]);
  const [editServiceCommunesLoading, setEditServiceCommunesLoading] = useState(false);
  const [editServiceCommunesError, setEditServiceCommunesError] = useState<string | null>(null);
  const [editServiceCommunesRetryKey, setEditServiceCommunesRetryKey] = useState(0);
  /** Solo super admin: editar categoría (tipo de servicio) */
  const [editServiceTypeIds, setEditServiceTypeIds] = useState<string[]>([]);
  const [serviceTypesForEdit, setServiceTypesForEdit] = useState<
    Array<{ id: string; name: string; is_active?: boolean }>
  >([]);
  const [completeCommunes, setCompleteCommunes] = useState<string[]>([]);
  const [completeCommunesLoading, setCompleteCommunesLoading] = useState(false);
  const [completeCommunesError, setCompleteCommunesError] = useState<string | null>(null);
  const [completeCommunesRetryKey, setCompleteCommunesRetryKey] = useState(0);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await servicesAPI.getMyServices();
      setServices(response.services || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error(error.message || 'Error al cargar servicios');
    } finally {
      setLoadingServices(false);
    }
  };


  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      await servicesAPI.deleteService(serviceId);
      toast.success('Servicio eliminado');
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Error al eliminar servicio');
    }
  };

  const handleEditService = async (service: Service) => {
    setEditingService(service);
    setEditServiceDescription(service.description || '');
    setEditServiceCoverageCommunes(service.coverage_communes || []);
    setEditServiceTypeIds([]);
    setServiceTypesForEdit([]);
    setLoadingServiceDetail(true);
    try {
      const isSuperAdmin = user?.role_number === 5;

      const loadSuperAdminCatalogTypesFresh = async () => {
        try {
          const r = await adminAPI.getAdminServiceTypes({ fresh: true });
          return sortProfileEditCatalogTypes(
            (r.types || []).map((t) => ({
              id: String(t.id),
              name: t.name,
              is_active: t.is_active,
            }))
          );
        } catch {
          try {
            const r = await servicesAPI.getServiceTypes({ onlyActive: true });
            return sortProfileEditCatalogTypes(
              (r.types || []).map((t) => ({
                id: String(t.id),
                name: t.name,
                is_active: true,
              }))
            );
          } catch {
            return [];
          }
        }
      };

      const [detailRes, typesList] = await Promise.all([
        servicesAPI.getServiceById(service.id),
        isSuperAdmin ? loadSuperAdminCatalogTypesFresh() : Promise.resolve([]),
      ]);

      const { service: full } = detailRes;
      const s = full as typeof full & {
        coverage_communes?: string[];
        region_id?: string;
        service_type_ids?: string[];
        types?: Array<{ id: string; name?: string }>;
      };

      const comuna = s.comuna || service.comuna;
      setEditServiceComuna(comuna);
      setEditServiceRegion(s.region_id || '');
      setEditServiceDescription(s.description || service.description || '');
      setEditServiceCoverageCommunes((s.coverage_communes || []).filter(Boolean));

      if (isSuperAdmin) {
        const types = typesList;
        setServiceTypesForEdit(types);
        let ids: string[] = [];
        if (Array.isArray(s.service_type_ids) && s.service_type_ids.length > 0) {
          ids = s.service_type_ids.map(String);
        } else if (Array.isArray(s.types) && s.types.length > 0) {
          ids = s.types.map((t) => String(t.id));
        } else {
          const match = types.find((t) => t.name === service.service_name);
          if (match) ids = [String(match.id)];
        }
        setEditServiceTypeIds(ids);
      }
    } catch {
      setEditServiceComuna(service.comuna);
      setEditServiceRegion(service.region_id || '');
      setEditServiceDescription(service.description || '');
      setEditServiceCoverageCommunes((service.coverage_communes || []).filter(Boolean));
    } finally {
      setLoadingServiceDetail(false);
    }
  };

  const handleSaveService = async () => {
    if (!editingService || !editServiceComuna.trim() || !editServiceRegion) {
      toast.error('Selecciona región y comuna de origen');
      return;
    }
    if (!isValidComuna(editServiceComuna)) {
      toast.error('Comuna no válida');
      return;
    }
    if (!isValidTextField(editServiceDescription, 2000)) {
      toast.error('Descripción no válida');
      return;
    }
    if (user?.role_number === 5 && editServiceTypeIds.length === 0) {
      toast.error('Selecciona una categoría');
      return;
    }

    try {
      setIsSavingService(true);

      const origin = resolveOriginLocation(
        sanitizeInput(editServiceComuna, 50),
        editServiceRegion
      );
      if ('error' in origin) {
        toast.error(origin.error);
        return;
      }

      const regionBuild = buildServiceRegionPayload(
        editServiceRegion,
        editServiceCoverageCommunes,
        origin.region_id
      );
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

      const updatePayload: Parameters<typeof servicesAPI.updateService>[1] = {
        description: sanitizeInput(editServiceDescription, 2000),
        comuna: comunaRes.comuna,
        region_id: offerRegionId,
        coverage_communes: coveragePayload ?? [],
      };

      if (user?.role_number === 5 && editServiceTypeIds.length > 0) {
        const selectedType = serviceTypesForEdit.find((t) => String(t.id) === String(editServiceTypeIds[0]));
        if (selectedType?.name) {
          updatePayload.service_name = sanitizeInput(selectedType.name, 140);
        }
        updatePayload.service_type_ids = editServiceTypeIds.map(String);
      }

      const response = await servicesAPI.updateService(editingService.id, updatePayload);

      const successMsg = response.message || 'Servicio actualizado';
      toast.success(successMsg);
      setEditingService(null);
      invalidateServicesListQueries(queryClient);
      loadServices();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast.error(error.message || 'Error al actualizar servicio');
    } finally {
      setIsSavingService(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-CL');
    } catch {
      return dateString;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'entrepreneur':
        return <Wrench size={16} />;
      case 'company':
        return <Building2 size={16} />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'job-seeker':
        return 'Vecino';
      case 'entrepreneur':
        return 'Emprendedor';
      case 'company':
        return 'Empresa';
      case 'admin':
        return 'Administrador';
      case 'super-admin':
        return 'Super Admin';
      default:
        return role;
    }
  };

  const openLocationDialog = () => {
    if (!user) return;
    setLocRegion(user.region_id ? String(user.region_id) : '');
    setLocComuna(user.comuna || '');
    setLocationDialogOpen(true);
  };

  const openPhoneDialog = () => {
    if (!user) return;
    setEditPhoneValue(user.phone || '');
    setPhoneDialogOpen(true);
  };

  const handleSavePhone = async () => {
    if (!user) return;
    const trimmed = editPhoneValue.trim();
    if (!trimmed) {
      toast.error('Ingresa un número de teléfono');
      return;
    }
    if (!isValidPhone(trimmed)) {
      const phoneError = validatePhone(trimmed);
      toast.error(getValidationErrorMessage('phone', phoneError === 'format' ? 'format' : 'length'));
      return;
    }
    if (trimmed === user.phone) {
      setPhoneDialogOpen(false);
      return;
    }
    try {
      setIsSavingPhone(true);
      await authAPI.updateProfile({
        phone: sanitizeInput(trimmed, 20),
      });
      await loadUser();
      setPhoneDialogOpen(false);
      toast.success('Teléfono actualizado');
    } catch (error: any) {
      console.error('Error updating phone:', error);
      toast.error(error.message || 'No se pudo actualizar el teléfono');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!user || !locRegion || !locComuna.trim()) {
      toast.error('Selecciona región y comuna');
      return;
    }
    if (!isValidComuna(locComuna)) {
      toast.error('Comuna no válida');
      return;
    }
    try {
      setIsSavingLocation(true);
      await authAPI.updateProfile({
        region_id: locRegion,
        comuna: sanitizeInput(locComuna, 50),
      });
      await loadUser();
      setLocationDialogOpen(false);
      toast.success('Ubicación actualizada');
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast.error(error.message || 'No se pudo actualizar la ubicación');
    } finally {
      setIsSavingLocation(false);
    }
  };





  const handleCompleteProfile = async () => {
    if (!completePhone || !completeComuna || !completeRegion || !completeRut) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (!isValidRut(completeRut)) {
      toast.error('Por favor ingresa un RUT válido');
      return;
    }

    if (!isValidPhone(completePhone)) {
      const phoneError = validatePhone(completePhone);
      toast.error(getValidationErrorMessage('phone', phoneError === 'format' ? 'format' : 'length'));
      return;
    }

    if (!isValidComuna(completeComuna)) {
      toast.error('Comuna no válida');
      return;
    }

    try {
      setIsCompletingProfile(true);
      const updateData = {
        phone: sanitizeInput(completePhone, 20),
        rut: sanitizeInput(completeRut.replace(/[^0-9kK]/g, ''), 12),
        comuna: sanitizeInput(completeComuna, 50),
        region_id: completeRegion,
      };

      await authAPI.updateProfile(updateData);

      await loadUser();
      setShowCompleteProfileDialog(false);
      toast.success('¡Perfil completado exitosamente!');
    } catch (error: any) {
      console.error('Error completing profile:', error);
      if (error?.status === 400 && error?.message?.toLowerCase().includes('rut')) {
        toast.error('El RUT ya se encuentra registrado con otra cuenta');
      } else {
        toast.error(error.message || 'Error al completar perfil');
      }
    } finally {
      setIsCompletingProfile(false);
    }
  };

  // TODOS LOS HOOKS DEBEN ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  // Esperar a que termine la carga antes de redirigir
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
          setRegionsError('No se recibieron regiones desde el servidor.');
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
    if (!locRegion) {
      setLocCommunes([]);
      setLocCommunesError(null);
      setLocCommunesLoading(false);
      return;
    }
    let cancelled = false;
    setLocCommunes([]);
    setLocCommunesError(null);
    setLocCommunesLoading(true);
    (async () => {
      try {
        const r = await regionsAPI.getCommunesByRegion(String(locRegion));
        if (cancelled) return;
        const names = communesNamesFromApiResponse(String(locRegion), r);
        if (names) setLocCommunes(names);
        else setLocCommunesError('No se pudo leer el listado de comunas para esa región.');
      } catch (e) {
        if (!cancelled) setLocCommunesError(catalogFetchUserMessage(e));
      } finally {
        if (!cancelled) setLocCommunesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locRegion, locCommunesRetryKey]);

  useEffect(() => {
    if (!editServiceRegion) {
      setEditServiceCommunes([]);
      setEditServiceCommunesError(null);
      setEditServiceCommunesLoading(false);
      return;
    }
    let cancelled = false;
    setEditServiceCommunes([]);
    setEditServiceCommunesError(null);
    setEditServiceCommunesLoading(true);
    (async () => {
      try {
        const r = await regionsAPI.getCommunesByRegion(String(editServiceRegion));
        if (cancelled) return;
        const names = communesNamesFromApiResponse(String(editServiceRegion), r);
        if (names) setEditServiceCommunes(names);
        else setEditServiceCommunesError('No se pudo leer el listado de comunas para esa región.');
      } catch (e) {
        if (!cancelled) setEditServiceCommunesError(catalogFetchUserMessage(e));
      } finally {
        if (!cancelled) setEditServiceCommunesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editServiceRegion, editServiceCommunesRetryKey]);

  useEffect(() => {
    if (!completeRegion) {
      setCompleteCommunes([]);
      setCompleteCommunesError(null);
      setCompleteCommunesLoading(false);
      return;
    }
    let cancelled = false;
    setCompleteCommunes([]);
    setCompleteCommunesError(null);
    setCompleteCommunesLoading(true);
    (async () => {
      try {
        const r = await regionsAPI.getCommunesByRegion(String(completeRegion));
        if (cancelled) return;
        const names = communesNamesFromApiResponse(String(completeRegion), r);
        if (names) setCompleteCommunes(names);
        else setCompleteCommunesError('No se pudo leer el listado de comunas para esa región.');
      } catch (e) {
        if (!cancelled) setCompleteCommunesError(catalogFetchUserMessage(e));
      } finally {
        if (!cancelled) setCompleteCommunesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [completeRegion, completeCommunesRetryKey]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/registro');
    }
  }, [isLoading, isLoggedIn, navigate]);

  // Detectar si hay campos faltantes
  const hasMissingFields = user && (!user.phone || !user.comuna);

  // Manejar query param para abrir modal de completar perfil
  useEffect(() => {
    if (searchParams.get('complete_profile') === 'true' && hasMissingFields) {
      setShowCompleteProfileDialog(true);
      setCompletePhone(user?.phone || '');
      setCompleteComuna(user?.comuna || '');
      setCompleteRegion(user?.region_id || '');
      setCompleteRut(formatRut(user?.rut || ''));
      // Limpiar el query param
      searchParams.delete('complete_profile');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, hasMissingFields, user, setSearchParams]);

  /* Manejo de query param CV removido */

  // Cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (user && isLoggedIn) {
      if (user.roles.includes('entrepreneur') || user.roles.includes('admin') || user.role_number === 5) {
        loadServices();
      }
    }
     
  }, [user, isLoggedIn]);

  /* Notificación de CV removida */

  // Mostrar loading mientras se carga el usuario
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  const domicileRegionName = user.region_id
    ? apiRegions.find((r) => String(r.id) === String(user.region_id))?.name
    : null;
  const offerRegionDisplay = getUserOfferRegionDisplayName(user);
  const regionsCatalogUsable = !regionsLoading && !regionsError && apiRegions.length > 0;

  return (
    <div className="min-h-screen bg-muted/30 pb-16 lg:pb-24">
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-5 sm:py-10 lg:max-w-6xl lg:px-10 lg:py-12 xl:max-w-7xl">
        <div className="mb-6 lg:mb-10">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 lg:text-sm">
            Cuenta
          </p>
          <h1 className="text-2xl font-normal text-foreground tracking-tight sm:text-3xl lg:text-[2rem] lg:tracking-tight">
            Perfil
          </h1>
        </div>

        {hasMissingFields && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm lg:mb-8 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:p-6">
            <p className="text-sm text-muted-foreground mb-3 lg:mb-0 lg:flex-1">
              Falta información de contacto. Complétala una vez para que otros usuarios puedan ubicarte.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => {
                setCompletePhone(user.phone || '');
                setCompleteComuna(user.comuna || '');
                setCompleteRegion(user.region_id || '');
                setCompleteRut(formatRut(user.rut || ''));
                setShowCompleteProfileDialog(true);
              }}
            >
              <Users size={14} className="mr-2" />
              Completar datos
            </Button>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden lg:shadow-md lg:rounded-3xl">
          {/* Móvil: avatar arriba centrado · Escritorio: fila con avatar + nombre */}
          <div className="flex flex-col items-center border-b border-border/60 pt-8 pb-6 px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-10 lg:py-10 lg:text-left">
            <Avatar className="h-20 w-20 ring-1 ring-border lg:h-28 lg:w-28 lg:ring-2 lg:ring-border/80">
              {user.profile_image && <AvatarImage src={user.profile_image} alt={user.name} />}
              <AvatarFallback className="text-xl font-medium bg-muted text-foreground lg:text-3xl">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 flex flex-col items-center lg:mt-0 lg:items-start lg:min-w-0 lg:flex-1">
              <h2 className="text-xl font-medium text-foreground text-center lg:text-2xl lg:font-normal">
                {user.name}
              </h2>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 lg:justify-start lg:gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground lg:px-3 lg:py-1 lg:text-sm"
                  >
                    {getRoleIcon(role)}
                    {getRoleLabel(role)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Móvil: lista vertical · Escritorio: rejilla 2 columnas */}
          <div className="divide-y divide-border/60 lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-0 lg:border-t-0">
            <div
              className={`px-5 py-4 flex items-start gap-3 lg:px-8 lg:py-6 lg:border-r lg:border-border/60 ${
                !user.rut ? 'lg:col-span-2 lg:border-r-0 lg:border-b lg:border-border/60' : ''
              }`}
            >
              <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 lg:h-5 lg:w-5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground lg:text-sm">Correo</p>
                <p className="text-sm text-foreground break-all lg:text-base">{user.email}</p>
              </div>
            </div>
            {user.rut && (
              <div className="px-5 py-4 flex items-start gap-3 lg:px-8 lg:py-6">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground lg:text-sm">RUT</p>
                  <p className="text-sm text-foreground lg:text-base">{user.rut}</p>
                </div>
              </div>
            )}
            <div className="px-5 py-4 lg:px-8 lg:py-6 lg:border-r lg:border-border/60 lg:border-t lg:border-border/60">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground lg:text-sm">Teléfono</p>
                  <p className="text-sm text-foreground lg:text-base">{user.phone || '—'}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 mt-2 text-sm font-normal text-primary lg:mt-3"
                onClick={openPhoneDialog}
              >
                ¿Quieres cambiar tu número?
              </Button>
            </div>
            <div className="px-5 py-4 lg:px-8 lg:py-6 lg:border-t lg:border-border/60">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground lg:text-sm">Ubicación (domicilio)</p>
                  <p className="text-sm text-foreground lg:text-base">
                    {domicileRegionName ? `${domicileRegionName} · ` : ''}
                    {user.comuna || '—'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 mt-2 text-sm font-normal text-primary lg:mt-3"
                onClick={openLocationDialog}
              >
                ¿Quieres cambiar tu ubicación?
              </Button>
            </div>
            {(user.role_number === 2 || user.role_number === 3) && (
              <div className="px-5 py-4 flex items-start gap-3 lg:px-8 lg:py-6 lg:col-span-2 bg-secondary/5 border-t border-secondary/10">
                <MapPin className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary lg:text-xs">
                    Región de oferta
                  </p>
                  <p className="text-sm text-foreground lg:text-base mt-0.5">
                    {offerRegionDisplay || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Según tu servicio activo más reciente; no es tu domicilio.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>


        {(user.roles.includes('entrepreneur') || user.roles.includes('admin') || user.role_number === 5) && (
          <div className="mt-10 lg:mt-14">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground lg:text-xl">Tus publicaciones</h2>
                <p className="text-sm text-muted-foreground lg:text-base lg:mt-1">
                  Ubicación del servicio: región y comuna de oferta (mismo criterio que el backend, sin lista de cobertura).
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full shrink-0 w-full sm:w-auto"
                onClick={() => navigate('/servicios/publicar')}
              >
                <Plus size={14} className="mr-1.5" />
                Nuevo servicio
              </Button>
            </div>

            {loadingServices ? (
              <p className="text-sm text-muted-foreground py-8 text-center lg:py-12">Cargando…</p>
            ) : services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 py-10 text-center lg:py-14 lg:max-w-2xl lg:mx-auto">
                <p className="text-sm text-muted-foreground mb-3 lg:text-base">Aún no tienes servicios publicados</p>
                <Button size="sm" className="rounded-full" onClick={() => navigate('/servicios/publicar')}>
                  Publicar servicio
                </Button>
              </div>
            ) : (
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:gap-6">
                {services
                  .filter((s) => s.status?.toLowerCase().trim() !== 'inactive')
                  .map((service) => (
                    <div
                      key={service.id}
                      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{service.service_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getServiceLocationDisplay(service)} · {formatDate(service.created_at)}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>
                              {(service.average_rating && Number(service.average_rating) > 0)
                                ? Number(service.average_rating).toFixed(1)
                                : '—'}{' '}
                              ({service.reviews_count || 0})
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
                          {service.status?.toLowerCase().trim() === 'active'
                            ? 'Activo'
                            : service.status?.toLowerCase().trim() === 'pending'
                              ? 'Pendiente'
                              : service.status}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-primary -ml-2"
                          onClick={() => handleEditService(service)}
                          disabled={loadingServiceDetail && editingService?.id === service.id}
                        >
                          Editar servicio
                          <ChevronRight className="h-4 w-4 ml-0.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-destructive -ml-2"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl border shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">Cambiar teléfono</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Actualiza el número donde pueden contactarte. El resto de tu perfil no se modifica aquí.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="profile-phone-edit" className="text-xs text-muted-foreground">
                Teléfono
              </Label>
              <Input
                id="profile-phone-edit"
                value={editPhoneValue}
                onChange={(e) => setEditPhoneValue(e.target.value)}
                placeholder="+56 9 1234 5678"
                disabled={isSavingPhone}
                className={
                  editPhoneValue && validatePhone(editPhoneValue) === 'format' ? 'border-red-500 rounded-xl' : 'rounded-xl'
                }
              />
              {editPhoneValue && validatePhone(editPhoneValue) === 'format' && (
                <p className="text-xs text-red-500">{getValidationErrorMessage('phone', 'format')}</p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setPhoneDialogOpen(false)}
                disabled={isSavingPhone}
              >
                Cancelar
              </Button>
              <Button className="rounded-full" onClick={handleSavePhone} disabled={isSavingPhone}>
                {isSavingPhone ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl border shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">Cambiar ubicación</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Actualiza región y comuna. El resto de tu perfil no se modifica aquí.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Región</Label>
                  <Select
                    value={locRegion}
                    onValueChange={(v) => {
                      setLocRegion(v);
                      setLocComuna('');
                    }}
                    disabled={isSavingLocation || !regionsCatalogUsable}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder={regionsLoading ? 'Cargando regiones…' : 'Región'} />
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
                <div>
                  <Label className="text-xs text-muted-foreground">Comuna</Label>
                  <Select
                    value={locComuna}
                    onValueChange={setLocComuna}
                    disabled={!locRegion || isSavingLocation || locCommunesLoading || !!locCommunesError}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue placeholder={locCommunesLoading ? 'Cargando comunas…' : 'Comuna'} />
                    </SelectTrigger>
                    <SelectContent>
                      {locCommunes.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {locCommunesError && (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-xs text-destructive">{locCommunesError}</p>
                      <Button type="button" size="sm" variant="outline" onClick={() => setLocCommunesRetryKey((k) => k + 1)}>
                        Reintentar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {regionsError && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-destructive">{regionsError}</p>
                  <Button type="button" size="sm" variant="outline" onClick={() => setRegionsRetryKey((k) => k + 1)}>
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="rounded-full" onClick={() => setLocationDialogOpen(false)} disabled={isSavingLocation}>
                Cancelar
              </Button>
              <Button className="rounded-full" onClick={handleSaveLocation} disabled={isSavingLocation}>
                {isSavingLocation ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editingService}
          onOpenChange={(open) => {
            if (!open && !isSavingService) setEditingService(null);
          }}
        >
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">Editar servicio</DialogTitle>
              <DialogDescription className="text-sm">
                {editingService ? (
                  <span className="text-muted-foreground">
                    {editingService.service_name}. Puedes actualizar descripción, ubicación y comunas de cobertura
                    {user?.role_number === 5 ? ' (como super admin también la categoría).' : '.'}
                  </span>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            {loadingServiceDetail ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando datos…</p>
            ) : (
              <div className="space-y-5 py-2">
                {user?.role_number === 5 && (
                  <div>
                    <Label htmlFor="edit-service-category" className="text-xs font-medium text-muted-foreground mb-1 block">
                      Categoría
                    </Label>
                    <Select
                      value={editServiceTypeIds[0] || ''}
                      onValueChange={(v) => setEditServiceTypeIds(v ? [v] : [])}
                      disabled={isSavingService || serviceTypesForEdit.length === 0}
                    >
                      <SelectTrigger id="edit-service-category" className="rounded-xl">
                        <SelectValue
                          placeholder={
                            serviceTypesForEdit.length === 0 ? 'Sin tipos disponibles' : 'Selecciona categoría'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypesForEdit.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                            {t.is_active === false ? ' (inactiva)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      El catálogo se carga al abrir el editor desde administración (sin caché) para reflejar cambios recientes.
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Origen (región y comuna)</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Select
                      value={editServiceRegion}
                      onValueChange={(v) => {
                        setEditServiceRegion(v);
                        setEditServiceComuna('');
                        setEditServiceCoverageCommunes([]);
                      }}
                      disabled={isSavingService || !regionsCatalogUsable}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={regionsLoading ? 'Cargando regiones…' : 'Región'} />
                      </SelectTrigger>
                      <SelectContent>
                        {apiRegions.map((reg) => (
                          <SelectItem key={reg.id} value={reg.id}>
                            {reg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={editServiceComuna}
                      onValueChange={setEditServiceComuna}
                      disabled={!editServiceRegion || isSavingService || editServiceCommunesLoading || !!editServiceCommunesError}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={editServiceCommunesLoading ? 'Cargando comunas…' : 'Comuna'} />
                      </SelectTrigger>
                      <SelectContent>
                        {editServiceCommunes.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {editServiceCommunesError && (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-xs text-destructive">{editServiceCommunesError}</p>
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditServiceCommunesRetryKey((k) => k + 1)}>
                        Reintentar
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">Descripción</Label>
                  <Textarea
                    value={editServiceDescription}
                    onChange={(e) => setEditServiceDescription(e.target.value)}
                    rows={4}
                    disabled={isSavingService}
                    placeholder="Describe tu servicio, experiencia y alcance."
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Zona de desplazamiento (opcional)
                  </p>
                  {editServiceCoverageCommunes.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {editServiceCoverageCommunes.map((c) => (
                        <Badge key={c} variant="secondary" className="gap-1 pl-2 pr-1 py-1 font-normal">
                          {c}
                          <button
                            type="button"
                            className="rounded-full p-0.5 hover:bg-muted"
                            onClick={() =>
                              setEditServiceCoverageCommunes((prev) => prev.filter((x) => x !== c))
                            }
                            aria-label={`Quitar ${c}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={editServiceCommunesLoading || editServiceCommunes.length === 0}
                      onClick={() => {
                        if (editServiceCoverageCommunes.length === editServiceCommunes.length) {
                          setEditServiceCoverageCommunes([]);
                        } else {
                          setEditServiceCoverageCommunes([...editServiceCommunes]);
                        }
                      }}
                    >
                      {editServiceCoverageCommunes.length === editServiceCommunes.length
                        ? 'Quitar todas'
                        : 'Seleccionar todas'}
                    </Button>
                  </div>
                  <ScrollArea className="h-[180px] rounded-md border p-3">
                    <div className="space-y-2 pr-3">
                      {editServiceCommunesLoading && (
                        <p className="text-sm text-muted-foreground">Cargando comunas…</p>
                      )}
                      {!editServiceCommunesLoading && editServiceCommunes.length === 0 && (
                        <p className="text-sm text-muted-foreground">No hay comunas para mostrar.</p>
                      )}
                      {editServiceCommunes.map((c) => (
                        <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={editServiceCoverageCommunes.includes(c)}
                            onCheckedChange={() => {
                              setEditServiceCoverageCommunes((prev) =>
                                prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                              );
                            }}
                            disabled={isSavingService}
                          />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setEditingService(null)}
                disabled={isSavingService}
              >
                Cerrar
              </Button>
              <Button
                className="rounded-full min-w-[10rem]"
                onClick={handleSaveService}
                disabled={loadingServiceDetail || isSavingService}
              >
                {isSavingService ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando…
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Dialog para completar perfil */}
        <Dialog open={showCompleteProfileDialog} onOpenChange={setShowCompleteProfileDialog}>
          <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle>Completar Perfil</DialogTitle>
              <DialogDescription>
                Completa tu información personal para que otros usuarios puedan contactarte
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="complete-rut">RUT <span className="text-destructive">*</span></Label>
                  <Input
                    id="complete-rut"
                    value={completeRut}
                    onChange={(e) => setCompleteRut(formatRut(e.target.value))}
                    placeholder="12.345.678-9"
                    className={completeRut && !isValidRut(completeRut) ? 'border-red-500' : ''}
                    disabled={isCompletingProfile}
                  />
                </div>
                <div>
                  <Label htmlFor="complete-phone">Teléfono <span className="text-destructive">*</span></Label>
                  <Input
                    id="complete-phone"
                    value={completePhone}
                    onChange={(e) => setCompletePhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    disabled={isCompletingProfile}
                    className={completePhone && validatePhone(completePhone) === 'format' ? 'border-red-500' : ''}
                  />
                  {completePhone && validatePhone(completePhone) === 'format' && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {getValidationErrorMessage('phone', 'format')}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complete-region">Región</Label>
                  <Select value={completeRegion} onValueChange={(val) => {
                    setCompleteRegion(val);
                    setCompleteComuna('');
                  }} disabled={isCompletingProfile || !regionsCatalogUsable}>
                    <SelectTrigger id="complete-region">
                      <SelectValue placeholder={regionsLoading ? 'Cargando regiones…' : 'Selecciona Región'} />
                    </SelectTrigger>
                    <SelectContent>
                      {apiRegions.map((reg) => (
                        <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="complete-comuna">Comuna</Label>
                  <Select value={completeComuna} onValueChange={setCompleteComuna} disabled={!completeRegion || isCompletingProfile || completeCommunesLoading || !!completeCommunesError}>
                    <SelectTrigger id="complete-comuna">
                      <SelectValue placeholder={completeCommunesLoading ? 'Cargando comunas…' : 'Selecciona Comuna'} />
                    </SelectTrigger>
                    <SelectContent>
                      {completeCommunes.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {completeCommunesError && (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-xs text-destructive">{completeCommunesError}</p>
                      <Button type="button" size="sm" variant="outline" onClick={() => setCompleteCommunesRetryKey((k) => k + 1)}>
                        Reintentar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCompleteProfileDialog(false)}
                disabled={isCompletingProfile}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCompleteProfile}
                disabled={isCompletingProfile || !completePhone.trim() || !completeComuna.trim()}
              >
                {isCompletingProfile ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para ver CV removido */}
      </div>
    </div>
  );
};

export default Profile;
