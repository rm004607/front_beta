import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Package2, Wrench, Loader2, Share2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { ShareModal } from '@/components/ShareModal';
import { publicProfileAPI } from '@/lib/api';
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

const PublicProfile = () => {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [detailService, setDetailService] = useState<ServiceForDetail | null>(null);

  useEffect(() => {
    if (!id || !slug) return;
    setLoading(true);
    publicProfileAPI
      .getProfile(id, slug)
      .then((data) => {
        setProfile(data);
        if (data.user.slug !== slug) {
          navigate(`/perfil/${data.user.id}/${data.user.slug}`, { replace: true });
        }
      })
      .catch((err: any) => {
        if (err?.canonical) {
          navigate(err.canonical, { replace: true });
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id, slug, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !profile) {
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
    offer_region: null,
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
  });

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
                <AvatarImage src={user.profile_image} alt={user.name} className="object-cover" />
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
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                    onClick={() => setDetailService(toDetailService(service))}
                  >
                    {/* Cover image si existe */}
                    {service.cover_image_url && (
                      <div className="mb-3 rounded-xl overflow-hidden h-36 w-full">
                        <img
                          src={service.cover_image_url}
                          alt={service.service_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
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
