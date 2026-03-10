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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { X as CloseIcon } from 'lucide-react';

interface Service {
    id: string;
    service_name: string;
    description: string;
    price_range?: string;
    comuna: string;
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
}

interface ServiceCardProps {
    service: Service;
    highlightId?: string | null;
    isSuperAdmin?: boolean;
    onOpenReviews: (service: Service) => void;
    onWhatsApp: (service: Service) => void;
    onEdit?: (service: Service) => void;
    onDelete?: (service: Service) => void;
}

export const ServiceCard = ({
    service,
    highlightId,
    isSuperAdmin,
    onOpenReviews,
    onWhatsApp,
    onEdit,
    onDelete
}: ServiceCardProps) => {
    const getServiceIcon = (name: string, iconName?: string) => {
        if (iconName) {
            const n = iconName;
            // Common icons
            if (n === 'Wrench') return <Wrench />;
            if (n === 'Lightbulb') return <Lightbulb />;
            if (n === 'ShieldCheck') return <ShieldCheck />;
            if (n === 'Sparkles') return <Sparkles />;
            if (n === 'Building2') return <Building2 />;
            if (n === 'Truck') return <Truck />;
            if (n === 'HeartPulse') return <HeartPulse />;
            if (n === 'Briefcase') return <Briefcase />;
            if (n === 'Paintbrush') return <Paintbrush />;
            if (n === 'Hammer') return <Hammer />;
            if (n === 'Scissors') return <Scissors />;
            if (n === 'Camera') return <Camera />;
            if (n === 'Laptop') return <Laptop />;
            if (n === 'ShoppingBag' || n === 'Store') return <ShoppingBag />;
            if (n === 'ChefHat') return <ChefHat />;
            if (n === 'Music') return <Music />;
            if (n === 'Car') return <Car />;
            if (n === 'Home') return <HomeIcon />;
            if (n === 'Phone') return <Phone />;
            if (n === 'Plug') return <Plug />;
            if (n === 'PaintRoller') return <PaintRoller />;
            if (n === 'Flame') return <Flame />;
            if (n === 'Utensils') return <Utensils />;
            if (n === 'Dumbbell') return <Dumbbell />;
            if (n === 'GraduationCap') return <GraduationCap />;
            if (n === 'Baby') return <Baby />;
            if (n === 'Stethoscope') return <Stethoscope />;
            if (n === 'Globe') return <Globe />;
            if (n === 'Database') return <Database />;
            if (n === 'Smartphone') return <Smartphone />;
            if (n === 'Plane') return <Plane />;
            if (n === 'Gift') return <Gift />;
            if (n === 'Trophy') return <Trophy />;
            if (n === 'Coffee') return <Coffee />;
            if (n === 'Wallet') return <Wallet />;
            if (n === 'Trees') return <Trees />;
            if (n === 'PawPrint') return <PawPrint />;
            if (n === 'Flower2') return <Flower2 />;
            if (n === 'Sun') return <Sun />;
            if (n === 'Moon') return <Moon />;
            if (n === 'Bike') return <Bike />;
            if (n === 'Cpu') return <Cpu />;
            if (n === 'Mouse') return <Mouse />;
            if (n === 'Monitor') return <Monitor />;
            if (n === 'Cloud') return <Cloud />;
            if (n === 'Code') return <Code />;
            if (n === 'Languages') return <Languages />;
            if (n === 'Book') return <Book />;
            if (n === 'School') return <School />;
            if (n === 'HardHat') return <HardHat />;
            if (n === 'Construction') return <Construction />;
            if (n === 'Drill') return <Drill />;
            if (n === 'PlugZap') return <PlugZap />;
            if (n === 'Waves') return <Waves />;
            if (n === 'Zap') return <Zap />;
            if (n === 'Ticket') return <Ticket />;
            if (n === 'Video') return <Video />;
            if (n === 'Mic') return <Mic />;
            if (n === 'Smile') return <Smile />;
            if (n === 'Gamepad2') return <Gamepad2 />;
            if (n === 'Brush') return <Brush />;
            if (n === 'Wind') return <Wind />;
            if (n === 'Pill') return <Pill />;
            if (n === 'Activity') return <Activity />;
            if (n === 'Apple') return <Apple />;
            if (n === 'Bone') return <Bone />;
            if (n === 'Gem') return <Gem />;
            if (n === 'Key') return <Key />;
            if (n === 'Anchor') return <Anchor />;
        }
        const n = name.toLowerCase();
        if (n.includes('gasfiter') || n.includes('plomero')) return <Wrench />;
        if (n.includes('electri')) return <Lightbulb />;
        if (n.includes('cerrajer')) return <ShieldCheck />;
        if (n.includes('limpieza') || n.includes('aseo')) return <Sparkles />;
        if (n.includes('construc') || n.includes('albañil')) return <Building2 />;
        if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return <Truck />;
        if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return <HeartPulse />;
        if (n.includes('mecanic')) return <Briefcase />;
        if (n.includes('jardin')) return <Scissors />;
        if (n.includes('gastro') || n.includes('comida') || n.includes('chef')) return <ChefHat />;
        return <Wrench />;
    };

    const getServiceColor = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('gasfiter') || n.includes('plomero') || n.includes('fontaner')) return '#3b82f6'; // blue-500
        if (n.includes('electri')) return '#f59e0b'; // amber-500
        if (n.includes('cerrajer')) return '#334155'; // slate-700
        if (n.includes('limpieza') || n.includes('aseo')) return '#10b981'; // emerald-500
        if (n.includes('construc') || n.includes('albañil')) return '#ea580c'; // orange-600
        if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return '#a855f7'; // purple-500
        if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return '#f43f5e'; // rose-500
        if (n.includes('mecanic')) return '#4f46e5'; // indigo-600
        if (n.includes('jardin')) return '#22c55e'; // green-500
        if (n.includes('gastro') || n.includes('comida') || n.includes('chef')) return '#ef4444'; // red-500
        return 'var(--primary)'; // Default color
    };

    const isLightColor = (color?: string) => {
        if (!color) return false;
        if (color.startsWith('var')) return false;
        try {
            const hex = color.replace('#', '');
            if (hex.length !== 6) return false;
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 180;
        } catch (e) {
            return false;
        }
    };

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
                            {service.profile_image ? (
                                <AvatarImage src={service.profile_image} alt={service.user_name} className="object-cover" />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center">
                                    <div className="scale-110 opacity-90">
                                        {getServiceIcon(service.service_name || service.type_name || '', service.type_icon)}
                                    </div>
                                </AvatarFallback>
                            )}
                        </Avatar>
                        {service.reviews_count && service.reviews_count > 5 && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white p-1 rounded-full shadow-lg border border-white">
                                <Sparkles size={10} className="fill-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-lg sm:text-xl font-black truncate text-slate-900 group-hover:text-primary transition-colors leading-tight">
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
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="text-[10px] sm:text-[11px] text-primary font-black uppercase tracking-widest hover:underline focus:outline-none flex items-center transition-all bg-primary/5 hover:bg-primary/10 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl border border-primary/10">
                                    Detalles completos <ChevronRight className="w-3 sn:w-3.5 h-3 sm:h-3.5 ml-1" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[450px] w-[95%] max-h-[90vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] border-none p-0 bg-transparent shadow-none">
                                <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl relative">
                                    {/* Background decoration */}
                                    <div
                                        className="h-28 w-full absolute top-0 left-0"
                                        style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
                                    >
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />
                                        
                                        {/* Custom Close Button to ensure it works */}
                                        <DialogClose className="absolute top-4 right-4 z-[60] bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-95">
                                            <CloseIcon size={20} />
                                        </DialogClose>
                                    </div>

                                    <div className="pt-12 sm:pt-16 px-6 sm:px-8 pb-8 sm:pb-10 text-center relative z-10">
                                        <Avatar className="w-24 h-24 sm:w-28 sm:h-28 mx-auto border-[4px] sm:border-[6px] border-white shadow-2xl mb-3 sm:mb-4 ring-1 ring-black/5 relative group-hover:scale-105 transition-transform duration-500">
                                            {service.profile_image ? (
                                                <AvatarImage src={service.profile_image} alt={service.user_name} className="object-cover" />
                                            ) : (
                                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white flex flex-col items-center justify-center">
                                                    <div className="scale-[2] sm:scale-[2.5] opacity-90 mb-1">
                                                        {getServiceIcon(service.service_name || service.type_name || '', service.type_icon)}
                                                    </div>
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <DialogTitle className="text-2xl sm:text-3xl font-black mb-1 text-slate-900">{service.user_name}</DialogTitle>
                                        <p className="text-sm font-bold text-primary mb-6">{service.service_name}</p>

                                        <div className="flex items-center justify-center gap-3 mb-8">
                                            <div className="flex items-center gap-2 bg-yellow-400/15 px-5 py-2.5 rounded-2xl border border-yellow-400/20 shadow-sm">
                                                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                                                <span className="text-lg font-black text-slate-800">
                                                    {(service.average_rating && Number(service.average_rating) > 0) ? Number(service.average_rating).toFixed(1) : '0.0'}
                                                </span>
                                            </div>
                                            <div
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-md border-2 ${isLightColor(service.type_color || getServiceColor(service.type_name || '')) ? 'text-slate-900 border-black/10' : 'text-white border-white/20'}`}
                                                style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
                                            >
                                                <div className="scale-100 [&>svg]:w-5 [&>svg]:h-5">
                                                    {getServiceIcon(service.service_name || service.type_name || '', service.type_icon)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 text-left">
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 px-1">Acerca de este servicio</h4>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                                                    {(!service.description || service.description.trim() === '' || service.description.trim() === '.') ? 'Este prestador no ha proporcionado una descripción detallada aún.' : service.description}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
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
                                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 px-1">Zonas de Cobertura</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {service.coverage_communes.map((commune, index) => (
                                                            <span key={index} className="bg-white px-3 py-1 rounded-lg border border-slate-100 text-xs font-bold text-slate-600">
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

                                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8 sm:mt-10">
                                            <Button
                                                variant="outline"
                                                className="w-full rounded-xl sm:rounded-[1.5rem] border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300 h-14 sm:h-16 font-black text-xs sm:text-sm shadow-sm"
                                                onClick={() => {
                                                    onOpenReviews(service);
                                                }}
                                            >
                                                <Star size={18} className="mr-1.5 sm:mr-2 fill-yellow-400 text-yellow-400" />
                                                Reseñas
                                            </Button>
                                            <Button
                                                className="w-full rounded-xl sm:rounded-[1.5rem] bg-[#25D366] hover:bg-[#20ba59] text-white transition-all duration-300 h-14 sm:h-16 font-black text-xs sm:text-sm shadow-xl shadow-green-500/20"
                                                onClick={() => {
                                                    onWhatsApp(service);
                                                }}
                                                disabled={!service.phone}
                                            >
                                                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 sm:mr-2" />
                                                WhatsApp
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                
                <div className="space-y-6 pt-2">
                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2.5 bg-secondary/5 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl border border-secondary/10 overflow-hidden flex-1">
                            <MapPin className="text-secondary shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] sm:text-xs font-bold truncate">{service.comuna}</span>
                                {service.coverage_communes && service.coverage_communes.length > 0 && (
                                    <span className="text-[8px] sm:text-[9px] text-secondary font-black uppercase tracking-tighter">
                                        + {service.coverage_communes.length} de cobertura
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-yellow-400/5 rounded-xl sm:rounded-2xl border border-yellow-400/10 shadow-sm shrink-0">
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs sm:text-sm font-black text-slate-800">
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
