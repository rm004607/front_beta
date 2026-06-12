import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Star, Package2, Wrench, Share2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { ShareModal } from '@/components/ShareModal';
import { publicProfileAPI, servicesAPI, trackServiceViewInteraction } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ServiceDetailModalContent, type ServiceForDetail } from '@/components/ServiceDetailModal';
import { getServiceIcon } from '@/lib/serviceUtils';

function toSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

const productStatusLabel: Record<string, string> = {
  new: 'Nuevo',
  used: 'Usado',
  refurbished: 'Reacondicionado',
};

type Profile = Awaited<ReturnType<typeof publicProfileAPI.getProfile>>;

function PublicProfileSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 pb-16 lg:pb-24">
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-5 sm:py-10 lg:max-w-3xl lg:px-6 lg:py-12">
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden lg:rounded-3xl mb-8 animate-pulse">
          <div className="flex items-center gap-4 border-b border-border/60 p-6 lg:gap-10 lg:px-10 lg:py-10">
            <div className="flex-1 space-y-3">
              <div className="h-7 w-48 rounded-lg bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-8 w-28 rounded-xl bg-muted" />
            </div>
            <div className="h-20 w-20 lg:h-28 lg:w-28 rounded-full bg-muted shrink-0" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-border/60">
            <div className="px-6 py-4 lg:px-10 lg:py-5 flex flex-col items-center gap-2">
              <div className="h-8 w-10 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="px-6 py-4 lg:px-10 lg:py-5 flex flex-col items-center gap-2">
              <div className="h-8 w-10 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4 lg:p-5 flex flex-row gap-4 animate-pulse"
            >
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-[60%] max-w-[14rem] rounded bg-muted" />
                    <div className="h-3 w-24 rounded-full bg-muted" />
                    <div className="h-3 w-40 rounded bg-muted" />
                  </div>
                </div>
              </div>
              <div className="hidden sm:block w-44 lg:w-52 shrink-0 rounded-xl bg-muted min-h-[7.5rem]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PublicProfile = () => {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const [detailService, setDetailService] = useState<ServiceForDetail | null>(null);

  const profileQuery = useQuery({
    queryKey: ['public-profile', id, slug],
    queryFn: () => publicProfileAPI.getProfile(id!, slug!),
    enabled: Boolean(id && slug),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  const profile = profileQuery.data ?? null;

  useEffect(() => {
    if (!profileQuery.isError || !profileQuery.error) return;
    const err = profileQuery.error as { canonical?: string };
    if (err.canonical) {
      navigate(err.canonical, { replace: true });
    }
  }, [profileQuery.isError, profileQuery.error, navigate]);

  useEffect(() => {
    if (!profile || !slug) return;
    if (profile.user.slug !== slug) {
      navigate(`/perfil/${profile.user.id}/${profile.user.slug}`, { replace: true });
    }
  }, [profile, slug, navigate]);

  if (!id || !slug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm text-muted-foreground">Enlace de perfil no válido.</p>
      </div>
    );
  }

  if (profileQuery.isPending) {
    return <PublicProfileSkeleton />;
  }

  if (profileQuery.isError) {
    const err = profileQuery.error as { canonical?: string } | undefined;
    if (err?.canonical) {
      return null;
    }
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-lg font-medium text-foreground">Perfil no encontrado</p>
        <p className="text-sm text-muted-foreground">El usuario no existe o no está disponible.</p>
      </div>
    );
  }

  const { user, services, products } = profile;
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const toDetailService = (service: Profile['services'][number]): ServiceForDetail => ({
    id: service.id,
    service_name: service.service_name,
    description: service.description,
    comuna: service.comuna,
    region_id: service.region_id,
    region_name: service.region_name,
    offer_region: service.offer_region ?? null,
    coverage_communes: service.coverage_communes,
    coverage_full_region: service.coverage_full_region,
    phone: undefined,
    user_id: user.id,
    user_name: user.name,
    profile_image: user.profile_image ?? undefined,
    average_rating: service.average_rating ? Number(service.average_rating) : undefined,
    reviews_count: service.reviews_count ? Number(service.reviews_count) : undefined,
    type_name: service.service_types?.[0]?.name,
    type_icon: service.service_types?.[0]?.icon,
    type_color: service.service_types?.[0]?.color,
    provider_kyc_status: user.isVerified ? 'verified' : undefined,
    image_urls: service.image_urls,
  });

  const openServiceDetail = async (service: Profile['services'][number]) => {
    setDetailService(toDetailService(service));
    trackServiceViewInteraction({ serviceId: String(service.id), source: 'public_profile' });
    try {
      const { service: full } = await servicesAPI.getServiceById(service.id);
      setDetailService((prev) => {
        if (!prev || prev.id !== service.id) return prev;
        return {
          ...prev,
          coverage_communes:
            full.coverage_communes != null ? full.coverage_communes : prev.coverage_communes,
          coverage_full_region:
            full.coverage_full_region !== undefined ? full.coverage_full_region : prev.coverage_full_region,
          offer_region: full.offer_region ?? prev.offer_region ?? null,
          region_id: full.region_id ?? prev.region_id,
          region_name: full.region_name ?? prev.region_name,
          comuna: full.comuna || prev.comuna,
          description: full.description || prev.description,
          image_urls:
            full.image_urls != null && full.image_urls.length > 0 ? full.image_urls : prev.image_urls,
        };
      });
    } catch {
      /* se mantiene el detalle armado desde el perfil público */
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-16 lg:pb-24">
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-5 sm:py-10 lg:max-w-3xl lg:px-6 lg:py-12">

        {/* Tarjeta de perfil */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden lg:rounded-3xl mb-8">
          <div className="flex items-center gap-4 border-b border-border/60 p-6 lg:gap-10 lg:px-10 lg:py-10">
            {/* Texto — izquierda */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-medium text-foreground lg:text-2xl">{user.name}</h1>
                {user.isVerified && <VerifiedBadge size="md" />}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{user.comuna}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 -ml-2 text-muted-foreground hover:text-foreground rounded-xl px-3 h-8 text-xs"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Compartir perfil
              </Button>
            </div>
            {/* Foto — derecha */}
            <Avatar className="h-20 w-20 ring-2 ring-border lg:h-28 lg:w-28 shrink-0">
              {user.profile_image && (
                <AvatarImage
                  src={user.profile_image}
                  alt={user.name}
                  className="object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <AvatarFallback className="text-xl font-medium bg-muted text-foreground lg:text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-2 divide-x divide-border/60">
            <div className="px-6 py-4 text-center lg:px-10 lg:py-5">
              <p className="text-2xl font-medium text-foreground">{services.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {services.length === 1 ? 'Servicio' : 'Servicios'}
              </p>
            </div>
            <div className="px-6 py-4 text-center lg:px-10 lg:py-5">
              <p className="text-2xl font-medium text-foreground">{products.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {products.length === 1 ? 'Producto' : 'Productos'}
              </p>
            </div>
          </div>
        </div>

        {/* Servicios */}
        {services.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-medium text-foreground">Servicios</h2>
            </div>
            <div className="space-y-3">
              {services.map((service) => {
                const primaryType = service.service_types?.[0];
                return (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all flex flex-row gap-4 items-stretch"
                    onClick={() => void openServiceDetail(service)}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        {getServiceIcon(
                          service.service_name || primaryType?.name || '',
                          primaryType?.icon,
                          undefined,
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{service.service_name}</p>
                        {primaryType && (
                          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground mt-0.5">
                            {primaryType.name}
                          </span>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {service.region_name && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {service.region_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {service.average_rating && Number(service.average_rating) > 0
                              ? Number(service.average_rating).toFixed(1)
                              : '—'}{' '}
                            <span className="text-muted-foreground/60">({service.reviews_count || 0})</span>
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {service.cover_image_url && (
                      <div className="shrink-0 w-[min(42%,9.5rem)] sm:w-44 lg:w-52 self-stretch min-h-[6.5rem] sm:min-h-[7.5rem] rounded-xl overflow-hidden bg-muted/30">
                        <img
                          src={service.cover_image_url}
                          alt={service.service_name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full min-h-[6.5rem] sm:min-h-[7.5rem] object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Productos */}
        {products.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Package2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-medium text-foreground">Productos</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
                >
                  {product.cover_image_url ? (
                    <img
                      src={product.cover_image_url}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted/50 flex items-center justify-center">
                      <Package2 className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                    <div className="flex items-center justify-between mt-1 gap-1 flex-wrap">
                      {product.price != null ? (
                        <p className="text-sm font-medium text-primary">
                          {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(product.price)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">A convenir</p>
                      )}
                      {product.product_status && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          {productStatusLabel[product.product_status] ?? product.product_status}
                        </span>
                      )}
                    </div>
                    {(product.average_rating && Number(product.average_rating) > 0) ? (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {Number(product.average_rating).toFixed(1)}
                        <span className="text-muted-foreground/60">({product.reviews_count || 0})</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Estado vacío */}
        {services.length === 0 && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center">
            <p className="text-sm text-muted-foreground">Este usuario aún no tiene publicaciones.</p>
          </div>
        )}
      </div>

      {/* Modal detalle de servicio */}
      <Dialog open={!!detailService} onOpenChange={(open) => !open && setDetailService(null)}>
        <DialogContent
          disableAnimation
          aria-describedby={undefined}
          className="max-w-[820px] w-[95%] max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] border border-border p-0 bg-card shadow-2xl"
        >
          <DialogTitle className="sr-only">Detalle del servicio</DialogTitle>
          <DialogClose className="absolute top-4 right-4 z-[70] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-95 border-0">
            <X size={20} />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
          {detailService && (
            <ServiceDetailModalContent
              service={detailService}
              onClose={() => setDetailService(null)}
              onOpenReviews={() => navigate(`/servicios?highlight=${detailService.id}`)}
              onWhatsApp={() => navigate(`/servicios?highlight=${detailService.id}`)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={`${window.location.origin}/perfil/${user.id}/${user.slug}`}
        title={`Perfil de ${user.name} en Dameldato`}
      />
    </div>
  );
};

export { toSlug };
export default PublicProfile;
