import { Star, MapPin, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DialogTitle } from '@/components/ui/dialog';
import { getServiceIcon, getServiceColor, isLightColor } from '@/lib/serviceUtils';

export interface ServiceForDetail {
  id: string;
  service_name: string;
  description: string;
  comuna: string;
  phone?: string;
  user_name: string;
  profile_image?: string;
  average_rating?: number;
  reviews_count?: number;
  coverage_communes?: string[];
  type_name?: string;
  type_icon?: string;
  type_color?: string;
  idicon?: string;
}

interface ServiceDetailModalProps {
  service: ServiceForDetail;
  onClose: () => void;
  onOpenReviews: (service: ServiceForDetail) => void;
  onWhatsApp: (service: ServiceForDetail) => void;
}

export function ServiceDetailModalContent({ service, onClose, onOpenReviews, onWhatsApp }: ServiceDetailModalProps) {
  return (
    <div className="bg-white dark:bg-card rounded-[3rem] overflow-hidden shadow-2xl relative text-foreground">
      <div
        className="h-28 w-full absolute -top-px -left-px -right-px md:hidden rounded-t-[3rem]"
        style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] relative z-10">
        <div className="bg-muted/30 md:border-r border-border/40 flex flex-col">
          <div
            className="hidden md:block h-28 w-full relative -top-px -left-px -right-px rounded-tl-[3rem]"
            style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />
          </div>

          <div className="pt-12 sm:pt-16 md:pt-0 px-6 sm:px-8 md:px-6 pb-6 md:pb-8 text-center flex-1 flex flex-col">
            <Avatar className="w-24 h-24 sm:w-28 sm:h-28 mx-auto border-[4px] sm:border-[6px] border-white shadow-2xl mb-3 sm:mb-4 ring-1 ring-black/5 relative md:-mt-12">
              <AvatarImage src={service.profile_image} alt={service.user_name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white flex flex-col items-center justify-center">
                <div className="scale-[2] sm:scale-[2.5] opacity-90 mb-1">
                  {getServiceIcon(service.service_name || service.type_name || '', service.type_icon, service.idicon)}
                </div>
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="text-2xl sm:text-3xl md:text-2xl font-black mb-1 text-foreground">{service.user_name}</DialogTitle>
            <span className="inline-flex mx-auto text-xs sm:text-sm font-bold text-primary mb-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/10">
              {service.service_name}
            </span>

            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-yellow-400/15 px-5 py-2.5 rounded-2xl border border-yellow-400/20 shadow-sm">
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                <span className="text-lg font-black text-foreground">
                  {(service.average_rating && Number(service.average_rating) > 0) ? Number(service.average_rating).toFixed(1) : '0.0'}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-md border-2 ${isLightColor(service.type_color || getServiceColor(service.type_name || '')) ? 'text-slate-900 border-black/10' : 'text-white border-white/20'}`}
                style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
              >
                <div className="scale-100 [&>svg]:w-5 [&>svg]:h-5">
                  {getServiceIcon(service.service_name || service.type_name || '', service.type_icon, service.idicon)}
                </div>
              </div>
            </div>

            <div className="hidden md:grid grid-cols-1 gap-3 text-left mb-6">
              <div className="flex flex-col gap-1 bg-secondary/5 p-4 rounded-2xl border border-secondary/10">
                <div className="flex items-center gap-2 text-secondary">
                  <MapPin size={18} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Base</span>
                </div>
                <span className="font-bold text-sm ml-7">{service.comuna}</span>
              </div>
              <div className="flex flex-col gap-1 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles size={18} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Reseñas</span>
                </div>
                <span className="font-bold text-sm ml-7">{service.reviews_count || 0} recibidas</span>
              </div>
            </div>

            <div className="hidden md:grid grid-cols-1 gap-3 mt-auto">
              <Button
                variant="outline"
                className="w-full rounded-xl sm:rounded-[1.5rem] border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300 h-14 font-black text-xs sm:text-sm shadow-sm"
                onClick={() => { onOpenReviews(service); onClose(); }}
              >
                <Star size={18} className="mr-1.5 sm:mr-2 fill-yellow-400 text-yellow-400" />
                Reseñas
              </Button>
              <Button
                className="w-full rounded-xl sm:rounded-[1.5rem] bg-[#25D366] hover:bg-[#20ba59] text-white transition-all duration-300 h-14 font-black text-xs sm:text-sm shadow-xl shadow-green-500/20"
                onClick={() => { onWhatsApp(service); onClose(); }}
                disabled={!service.phone}
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 text-center md:text-left">
          <div className="space-y-6 text-left">
            <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/40">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 px-1">Acerca de este servicio</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-medium">
                {(!service.description || service.description.trim() === '' || service.description.trim() === '.') ? 'Este prestador no ha proporcionado una descripción detallada aún.' : service.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:hidden">
              <div className="flex flex-col gap-1 bg-secondary/5 p-4 rounded-2xl border border-secondary/10">
                <div className="flex items-center gap-2 text-secondary">
                  <MapPin size={18} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Base</span>
                </div>
                <span className="font-bold text-sm ml-7">{service.comuna}</span>
              </div>
              <div className="flex flex-col gap-1 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles size={18} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Reseñas</span>
                </div>
                <span className="font-bold text-sm ml-7">{service.reviews_count || 0} recibidas</span>
              </div>
            </div>

            {service.coverage_communes && service.coverage_communes.length > 0 && (
              <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/40">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 px-1">Zonas de Cobertura</h4>
                <div className="flex flex-wrap gap-2">
                  {service.coverage_communes.map((commune, index) => (
                    <span key={index} className="bg-background px-3 py-1 rounded-lg border border-border text-xs font-bold text-foreground">
                      {commune}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
              <p className="text-[11px] font-black text-muted-foreground text-center uppercase tracking-widest">
                * El precio se coordina directamente con el profesional
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-10 md:hidden">
            <Button
              variant="outline"
              className="w-full rounded-xl sm:rounded-[1.5rem] border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300 h-14 sm:h-16 font-black text-xs sm:text-sm shadow-sm"
              onClick={() => { onOpenReviews(service); onClose(); }}
            >
              <Star size={18} className="mr-1.5 sm:mr-2 fill-yellow-400 text-yellow-400" />
              Reseñas
            </Button>
            <Button
              className="w-full rounded-xl sm:rounded-[1.5rem] bg-[#25D366] hover:bg-[#20ba59] text-white transition-all duration-300 h-14 sm:h-16 font-black text-xs sm:text-sm shadow-xl shadow-green-500/20"
              onClick={() => { onWhatsApp(service); onClose(); }}
              disabled={!service.phone}
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
