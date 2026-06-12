import { useState, useEffect } from 'react';
import { Star, MapPin, MessageCircle, Sparkles, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DialogTitle } from '@/components/ui/dialog';
import { getServiceIcon, getServiceColor, isLightColor, getServiceLocationDisplay } from '@/lib/serviceUtils';
import { VerifiedBadge, PendingVerificationBadge } from '@/components/VerifiedBadge';
import { toSlug } from '@/pages/PublicProfile';
import { ShareModal } from '@/components/ShareModal';

export interface ServiceForDetail {
  id: string;
  service_name: string;
  description: string;
  comuna: string;
  region_id?: string;
  region_name?: string;
  offer_region?: { id: string; name: string } | null;
  phone?: string;
  user_id: string;
  user_name: string;
  profile_image?: string;
  average_rating?: number;
  reviews_count?: number;
  coverage_communes?: string[];
  /** Enviado por el API cuando la cobertura es el 100 % de la región de oferta. */
  coverage_full_region?: boolean;
  type_name?: string;
  type_icon?: string;
  type_color?: string;
  idicon?: string;
  provider_kyc_status?: string;
  image_urls?: string[];
}

interface ServiceDetailModalProps {
  service: ServiceForDetail;
  onClose: () => void;
  onOpenReviews: (service: ServiceForDetail) => void;
  onWhatsApp: (service: ServiceForDetail) => void;
}

export function ServiceDetailModalContent({ service, onClose, onOpenReviews, onWhatsApp }: ServiceDetailModalProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareUrl = `${window.location.origin}/perfil/${service.user_id}/${toSlug(service.user_name)}`;
  const photoUrls = (service.image_urls ?? []).filter(Boolean);
  const [photoIndex, setPhotoIndex] = useState(0);
  const categoryColor = service.type_color || getServiceColor(service.type_name || '');
  const categoryTextClass = isLightColor(categoryColor) ? 'text-slate-950' : 'text-white';
  const serviceTitle =
    (!service.service_name || service.service_name.trim() === '' || service.service_name.trim() === '.')
      ? 'Servicio destacado'
      : service.service_name;
  const description =
    (!service.description || service.description.trim() === '' || service.description.trim() === '.')
      ? 'Este prestador no ha proporcionado una descripción detallada aún.'
      : service.description;
  const reviewsCount = Number(service.reviews_count || 0);
  const ratingValue =
    service.average_rating && Number(service.average_rating) > 0
      ? Number(service.average_rating).toFixed(1)
      : '0.0';

  useEffect(() => {
    setPhotoIndex(0);
  }, [service.id]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white text-foreground shadow-2xl dark:bg-card sm:rounded-[2.5rem]">
      <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-border/60 bg-muted/25 lg:border-b-0 lg:border-r">
          <div
            className={`min-h-28 ${categoryTextClass}`}
            style={{ backgroundColor: categoryColor }}
          />

          <div className="px-5 pb-5 pt-0 sm:px-6 lg:pb-6">
            <Avatar className="relative -mt-10 mb-4 h-20 w-20 border-4 border-white shadow-xl ring-1 ring-black/5 sm:h-24 sm:w-24">
              <AvatarFallback className="bg-primary text-white">
                <div className="scale-[1.8] opacity-95">
                  {getServiceIcon(serviceTitle, service.type_icon, service.idicon)}
                </div>
              </AvatarFallback>
            </Avatar>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Prestador</p>
                <Link
                  to={`/perfil/${service.user_id}/${toSlug(service.user_name)}`}
                  className="mt-1 block text-xl font-black leading-tight text-foreground hover:text-primary"
                >
                  {service.user_name}
                </Link>
                {(service.provider_kyc_status === 'verified' || service.provider_kyc_status === 'pending') && (
                  <div className="mt-2">
                    {service.provider_kyc_status === 'verified'
                      ? <VerifiedBadge size="md" />
                      : <PendingVerificationBadge size="md" />}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-yellow-300/50 bg-yellow-50 px-3 py-3 text-yellow-900">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-xl font-black tabular-nums">{ratingValue}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-yellow-800/70">{reviewsCount} reseñas</p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-3 py-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Categoría</p>
                  <p className="mt-1 line-clamp-1 text-sm font-black">{service.type_name || serviceTitle}</p>
                </div>
              </div>

              <div className="hidden space-y-2 lg:block">
                <Button
                  className="h-12 w-full rounded-2xl bg-[#25D366] text-sm font-black text-white shadow-lg shadow-green-500/20 hover:bg-[#20ba59]"
                  onClick={() => { onWhatsApp(service); onClose(); }}
                  disabled={!service.phone}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contactar por WhatsApp
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    onClick={() => { onOpenReviews(service); onClose(); }}
                  >
                    <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
                    Reseñas
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl"
                    onClick={() => setShareOpen(true)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <div className="border-b border-border/60 px-5 py-5 sm:px-8 sm:py-7">
            <DialogTitle className="pr-10 text-2xl font-black leading-tight text-foreground sm:text-4xl">
              {serviceTitle}
            </DialogTitle>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold">Por {service.user_name}</span>
              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-flex" />
              <span>{getServiceLocationDisplay(service)}</span>
            </div>
          </div>

          <div className="flex-1 space-y-5 px-5 py-5 pb-28 sm:px-8 sm:py-7 lg:pb-8">
            <section className="rounded-3xl border border-border/60 bg-muted/20 p-5 sm:p-6">
              <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                Descripción del servicio
              </h4>
              <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-foreground/85">
                {description}
              </p>
            </section>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <div className="flex items-center gap-2 text-emerald-700">
                  <MapPin className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Ubicación</span>
                </div>
                <p className="mt-2 text-sm font-black leading-snug">{getServiceLocationDisplay(service)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Cobertura</span>
                </div>
                <p className="mt-2 text-sm font-black leading-snug">
                  {service.coverage_full_region
                    ? 'Toda la región'
                    : service.coverage_communes && service.coverage_communes.length > 0
                      ? `${service.coverage_communes.length} comunas adicionales`
                      : 'Comuna indicada'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Precio</p>
                <p className="mt-2 text-sm font-black leading-snug">Se coordina directamente con el profesional</p>
              </div>
            </div>

            {service.coverage_communes && service.coverage_communes.length > 0 && (
              <section className="rounded-3xl border border-border/60 bg-background p-5">
                <h4 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Comunas de cobertura
                </h4>
                <div className="flex flex-wrap gap-2">
                  {service.coverage_communes.map((commune, index) => (
                    <span key={index} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-bold">
                      {commune}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {photoUrls.length > 0 && (
              <section className="rounded-3xl border border-border/60 bg-background p-5 sm:p-6">
                <h4 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Fotos del servicio
                </h4>
                {photoUrls.length === 1 ? (
                  <a
                    href={photoUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/photo block w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/40 ring-1 ring-black/5"
                  >
                    <img
                      src={photoUrls[0]}
                      alt=""
                      className="block h-auto max-h-[min(85vh,720px)] w-full transition-transform duration-300 group-hover/photo:scale-[1.005]"
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/40 ring-1 ring-black/5">
                      <img
                        src={photoUrls[photoIndex]}
                        alt=""
                        className="block h-auto max-h-[min(85vh,720px)] w-full"
                        loading="lazy"
                      />
                      {photoIndex > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="absolute left-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm hover:bg-background"
                          onClick={() => setPhotoIndex((i) => i - 1)}
                          aria-label="Foto anterior"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                      )}
                      {photoIndex < photoUrls.length - 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm hover:bg-background"
                          onClick={() => setPhotoIndex((i) => i + 1)}
                          aria-label="Foto siguiente"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold tabular-nums">
                        {photoIndex + 1} / {photoUrls.length}
                      </span>
                      <a
                        href={photoUrls[photoIndex]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-primary underline-offset-2 hover:underline"
                      >
                        Abrir imagen
                      </a>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:px-6 lg:hidden">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button
                className="h-12 rounded-2xl bg-[#25D366] text-sm font-black text-white shadow-lg shadow-green-500/20 hover:bg-[#20ba59]"
                onClick={() => { onWhatsApp(service); onClose(); }}
                disabled={!service.phone}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contactar por WhatsApp
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-2xl"
                onClick={() => setShareOpen(true)}
                aria-label="Compartir"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-9 w-full rounded-xl text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
              onClick={() => { onOpenReviews(service); onClose(); }}
            >
              <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
              Ver reseñas
            </Button>
          </div>
        </main>
      </div>
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title={`${serviceTitle} en Dameldato`}
      />
    </div>
  );
}
