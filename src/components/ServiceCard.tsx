import {
    Star, MapPin, MessageCircle, Edit, Trash2, ChevronRight,
    Wrench, Lightbulb, ShieldCheck, Sparkles, Building2, Truck,
    HeartPulse, Briefcase, Paintbrush, Hammer, Scissors, Camera,
    Laptop, ShoppingBag, ChefHat, Music, Car, Home as HomeIcon, Phone,
    HelpCircle, Plug, PaintRoller, Flame, Utensils, Dumbbell, GraduationCap,
    Baby, Stethoscope, Globe, Database, Smartphone, Plane,
    Gift, Trophy, Coffee, Wallet, Trees, PawPrint, Flower2,
    Sun, Moon, Bike, Cpu, Mouse, Monitor, Cloud, Code,
    Languages, Book, School, HardHat, Construction, Drill,
    PlugZap, Waves, Zap, Ticket, Video, Mic, Smile, Gamepad2,
    Brush, Wind, Pill, Activity, Apple, Bone, Gem, Key,
    Anchor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { servicesAPI, configAPI } from '@/lib/api';
import { toast } from 'sonner';
import { getServiceIcon, getServiceColor, isLightColor, getServiceRegionNameOnly } from '@/lib/serviceUtils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

interface Service {
    id: string;
    service_name: string;
    description: string;
    price_range?: string;
    comuna: string;
    region_id?: string;
    region_name?: string;
    offer_region?: { id: string; name: string } | null;
    phone?: string;
    status: string;
    created_at: string;
    user_id: string;
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

interface ServiceCardProps {
    service: Service;
    highlightId?: string | null;
    isSuperAdmin?: boolean;
    onOpenReviews: (service: Service) => void;
    onWhatsApp: (service: Service) => void;
    /** Al hacer clic en "Detalles completos" se abre el modal en la página padre (evita N Dialogs). */
    onOpenDetail?: (service: Service) => void;
    onEdit?: (service: Service) => void;
    onDelete?: (service: Service) => void;
}

export const ServiceCard = ({
    service,
    highlightId,
    isSuperAdmin,
    onOpenReviews,
    onWhatsApp,
    onOpenDetail,
    onEdit,
    onDelete
}: ServiceCardProps) => {

    return (
        <Card
            id={`service-${service.id}`}
            className={`group hover:shadow-2xl transition-all duration-500 border-2 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden ${String(service.id) === highlightId
                ? 'border-primary shadow-xl ring-4 ring-primary/15 scale-[1.02]'
                : 'border-border hover:border-primary/30'
                }`}
        >
            <CardHeader className="pb-3 px-4 sm:px-6 pt-5 sm:pt-6">
                <div className="flex items-start gap-4">
                    <div className="relative shrink-0 mt-0.5 sm:mt-1">
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white shadow-md ring-4 ring-primary/5 transition-transform duration-300 group-hover:scale-105">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center">
                                <div className="scale-110 opacity-90">
                                    {getServiceIcon(service.service_name || service.type_name || '', service.type_icon, service.idicon)}
                                </div>
                            </AvatarFallback>
                        </Avatar>
                        {service.reviews_count && service.reviews_count > 5 && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white p-1 rounded-full shadow-lg border border-white">
                                <Sparkles size={10} className="fill-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-lg sm:text-xl font-black truncate text-foreground group-hover:text-primary transition-colors leading-tight">
                                {(!service.service_name || service.service_name.trim() === '' || service.service_name.trim() === '.') ? 'Servicio Destacado' : service.service_name}
                            </CardTitle>
                        </div>
                        <p className="text-[11px] sm:text-sm text-muted-foreground font-bold truncate mt-0.5">Por {service.user_name}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
                <div className="relative mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 italic leading-relaxed min-h-[2.5rem] sm:min-h-[3rem]">
                        {(!service.description || service.description.trim() === '' || service.description.trim() === '.') ? 'Sin descripción disponible.' : service.description}
                    </p>
                    <div className="flex justify-start mt-3">
                        <button
                            type="button"
                            className="text-[10px] sm:text-[11px] text-primary font-black uppercase tracking-widest hover:underline focus:outline-none flex items-center transition-all bg-primary/5 hover:bg-primary/10 dark:bg-primary/15 dark:hover:bg-primary/20 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl border border-primary/10 dark:border-primary/25"
                            onClick={() => onOpenDetail?.(service)}
                        >
                            Detalles completos <ChevronRight className="w-3 sn:w-3.5 h-3 sm:h-3.5 ml-1" />
                        </button>
                    </div>
                </div>
                
                <div className="space-y-6 pt-2">
                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2.5 bg-secondary/5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl border border-secondary/10 overflow-hidden flex-1">
                            <MapPin className="text-secondary shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] sm:text-xs font-bold truncate">{getServiceRegionNameOnly(service) || '—'}</span>
                                {service.coverage_communes && service.coverage_communes.length > 0 && (
                                    <span className="text-[8px] sm:text-[9px] text-secondary font-black uppercase tracking-tighter">
                                        + {service.coverage_communes.length} comunas (histórico)
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-yellow-400/5 rounded-xl sm:rounded-2xl border border-yellow-400/10 shadow-sm shrink-0">
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs sm:text-sm font-black text-foreground">
                                {(service.average_rating && Number(service.average_rating) > 0) ? Number(service.average_rating).toFixed(1) : '0.0'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold ml-0.5">({service.reviews_count || 0})</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 mt-6">
                        <Button
                            variant="outline"
                            className="w-full border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300 h-12 rounded-[1.25rem] font-black text-xs shadow-sm hover:shadow-md"
                            onClick={() => onOpenReviews(service)}
                        >
                            <Star size={16} className="mr-2 fill-yellow-400 text-yellow-400" />
                            RESEÑAS
                        </Button>
                        <Button
                            className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white h-12 rounded-[1.25rem] font-black text-xs shadow-lg shadow-green-500/10 transition-all active:scale-[0.96] hover:shadow-green-500/20"
                            onClick={() => onWhatsApp(service)}
                            disabled={!service.phone}
                        >
                            <MessageCircle size={20} className="mr-2" />
                            WHATSAPP
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ServiceCard;
