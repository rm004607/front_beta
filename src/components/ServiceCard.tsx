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
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
            if (n === 'Wrench') return <Wrench size={20} />;
            if (n === 'Lightbulb') return <Lightbulb size={20} />;
            if (n === 'ShieldCheck') return <ShieldCheck size={20} />;
            if (n === 'Sparkles') return <Sparkles size={20} />;
            if (n === 'Building2') return <Building2 size={20} />;
            if (n === 'Truck') return <Truck size={20} />;
            if (n === 'HeartPulse') return <HeartPulse size={20} />;
            if (n === 'Briefcase') return <Briefcase size={20} />;
            if (n === 'Paintbrush') return <Paintbrush size={20} />;
            if (n === 'Hammer') return <Hammer size={20} />;
            if (n === 'Scissors') return <Scissors size={20} />;
            if (n === 'Camera') return <Camera size={20} />;
            if (n === 'Laptop') return <Laptop size={20} />;
            if (n === 'ShoppingBag' || n === 'Store') return <ShoppingBag size={20} />;
            if (n === 'ChefHat') return <ChefHat size={20} />;
            if (n === 'Music') return <Music size={20} />;
            if (n === 'Car') return <Car size={20} />;
            if (n === 'Home') return <HomeIcon size={20} />;
            if (n === 'Phone') return <Phone size={20} />;
            if (n === 'Plug') return <Plug size={20} />;
            if (n === 'PaintRoller') return <PaintRoller size={20} />;
            if (n === 'Flame') return <Flame size={20} />;
            if (n === 'Utensils') return <Utensils size={20} />;
            if (n === 'Dumbbell') return <Dumbbell size={20} />;
            if (n === 'GraduationCap') return <GraduationCap size={20} />;
            if (n === 'Baby') return <Baby size={20} />;
            if (n === 'Stethoscope') return <Stethoscope size={20} />;
            if (n === 'Globe') return <Globe size={20} />;
            if (n === 'Database') return <Database size={20} />;
            if (n === 'Smartphone') return <Smartphone size={20} />;
            if (n === 'Plane') return <Plane size={20} />;
            if (n === 'Gift') return <Gift size={20} />;
            if (n === 'Trophy') return <Trophy size={20} />;
            if (n === 'Coffee') return <Coffee size={20} />;
            if (n === 'Wallet') return <Wallet size={20} />;
            if (n === 'Trees') return <Trees size={20} />;
            if (n === 'PawPrint') return <PawPrint size={20} />;
            if (n === 'Flower2') return <Flower2 size={20} />;
            if (n === 'Sun') return <Sun size={20} />;
            if (n === 'Moon') return <Moon size={20} />;
            if (n === 'Bike') return <Bike size={20} />;
            if (n === 'Cpu') return <Cpu size={20} />;
            if (n === 'Mouse') return <Mouse size={20} />;
            if (n === 'Monitor') return <Monitor size={20} />;
            if (n === 'Cloud') return <Cloud size={20} />;
            if (n === 'Code') return <Code size={20} />;
            if (n === 'Languages') return <Languages size={20} />;
            if (n === 'Book') return <Book size={20} />;
            if (n === 'School') return <School size={20} />;
            if (n === 'HardHat') return <HardHat size={20} />;
            if (n === 'Construction') return <Construction size={20} />;
            if (n === 'Drill') return <Drill size={20} />;
            if (n === 'PlugZap') return <PlugZap size={20} />;
            if (n === 'Waves') return <Waves size={20} />;
            if (n === 'Zap') return <Zap size={20} />;
            if (n === 'Ticket') return <Ticket size={20} />;
            if (n === 'Video') return <Video size={20} />;
            if (n === 'Mic') return <Mic size={20} />;
            if (n === 'Smile') return <Smile size={20} />;
            if (n === 'Gamepad2') return <Gamepad2 size={20} />;
            if (n === 'Brush') return <Brush size={20} />;
            if (n === 'Wind') return <Wind size={20} />;
            if (n === 'Pill') return <Pill size={20} />;
            if (n === 'Activity') return <Activity size={20} />;
            if (n === 'Apple') return <Apple size={20} />;
            if (n === 'Bone') return <Bone size={20} />;
            if (n === 'Gem') return <Gem size={20} />;
            if (n === 'Key') return <Key size={20} />;
            if (n === 'Anchor') return <Anchor size={20} />;
        }
        const n = name.toLowerCase();
        if (n.includes('gasfiter') || n.includes('plomero')) return <Wrench size={20} />;
        if (n.includes('electri')) return <Lightbulb size={20} />;
        if (n.includes('cerrajer')) return <ShieldCheck size={20} />;
        if (n.includes('limpieza') || n.includes('aseo')) return <Sparkles size={20} />;
        if (n.includes('construc') || n.includes('albañil')) return <Building2 size={20} />;
        if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return <Truck size={20} />;
        if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return <HeartPulse size={20} />;
        if (n.includes('mecanic')) return <Briefcase size={20} />;
        if (n.includes('fontaner') || n.includes('gasfiter')) return <Wrench size={20} />;
        if (n.includes('jardin')) return <Scissors size={20} />;
        if (n.includes('gastro') || n.includes('comida') || n.includes('chef')) return <ChefHat size={20} />;
        return <Wrench size={20} />;
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
            className={`group hover:shadow-2xl transition-all duration-500 border-2 rounded-2xl overflow-hidden ${String(service.id) === highlightId
                ? 'border-primary shadow-xl ring-4 ring-primary/15 scale-[1.02]'
                : 'border-border hover:border-primary/30'
                }`}
        >
            <CardHeader className="pb-3 px-5 pt-5">
                <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                        <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                            {service.profile_image && (
                                <AvatarImage src={service.profile_image} alt={service.user_name} />
                            )}
                            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-secondary to-secondary/80 text-white">
                                {service.user_name.split(' ').map((n: string) => n[0]).slice(0, 3).join('')}
                            </AvatarFallback>
                        </Avatar>
                        {service.reviews_count && service.reviews_count > 10 && (
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg border border-white">
                                <Sparkles size={10} className="fill-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-lg font-bold truncate text-foreground group-hover:text-primary transition-colors">
                                {service.user_name}
                            </CardTitle>
                            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 shadow-sm shrink-0">
                                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                <span className="text-xs font-bold text-yellow-600">
                                    {(service.average_rating && Number(service.average_rating) > 0) ? Number(service.average_rating).toFixed(1) : '0.0'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {service.service_name && service.service_name.trim() !== '' && service.service_name.trim() !== '.' && (
                                <Badge variant="secondary" className="text-[10px] bg-muted/50 text-muted-foreground border-none font-medium">
                                    {service.service_name}
                                </Badge>
                            )}
                            <div
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-sm ${isLightColor(service.type_color || getServiceColor(service.type_name || '')) ? 'text-slate-900 border-black/5' : 'text-white border-white/10'}`}
                                style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
                            >
                                <span className="scale-75 origin-center -ml-0.5">
                                    {getServiceIcon(service.service_name || service.type_name || '', service.type_icon)}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-tight">{service.type_name?.trim() ? service.type_name : 'Servicio'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
                <div className="relative mb-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 italic leading-relaxed min-h-[2.5rem]">
                        {(!service.description || service.description.trim() === '' || service.description.trim() === '.') ? 'Sin descripción disponible.' : service.description}
                    </p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="text-xs text-primary font-bold hover:underline mt-2 focus:outline-none flex items-center transition-all bg-primary/5 px-2 py-1 rounded-md">
                                Ver detalles completos <ChevronRight className="w-3 h-3 ml-0.5" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[450px] w-[95%] rounded-3xl overflow-hidden border-none p-0 bg-transparent shadow-none">
                            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl relative">
                                {/* Background decoration */}
                                <div
                                    className="h-24 w-full absolute top-0 left-0"
                                    style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
                                >
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
                                </div>

                                <div className="pt-12 px-6 pb-8 text-center relative z-10">
                                    <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-xl -mt-0 mb-4">
                                        {service.profile_image && (
                                            <AvatarImage src={service.profile_image} alt={service.user_name} />
                                        )}
                                        <AvatarFallback className="text-3xl font-bold bg-secondary text-white">
                                            {service.user_name.split(' ').map((n: string) => n[0]).slice(0, 3).join('')}
                                        </AvatarFallback>
                                    </Avatar>

                                    <DialogTitle className="text-2xl font-black mb-1">{service.user_name}</DialogTitle>

                                    <div className="flex items-center justify-center gap-2 mb-6">
                                        <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                            <span className="text-sm font-black text-yellow-600">
                                                {(service.average_rating && Number(service.average_rating) > 0) ? Number(service.average_rating).toFixed(1) : '0.0'}
                                            </span>
                                        </div>
                                        <div
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full shadow-sm ${isLightColor(service.type_color || getServiceColor(service.type_name || '')) ? 'text-slate-900' : 'text-white'}`}
                                            style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
                                        >
                                            <span className="scale-75">
                                                {getServiceIcon(service.service_name || service.type_name || '', service.type_icon)}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{service.type_name?.trim() ? service.type_name : 'Servicio'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 text-left">
                                        <div className="bg-muted/30 p-4 rounded-2xl">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">Acerca de este servicio</h4>
                                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                {(!service.description || service.description.trim() === '' || service.description.trim() === '.') ? 'Este prestador no ha proporcionado una descripción detallada aún.' : service.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1 bg-secondary/5 p-3 rounded-xl border border-secondary/10">
                                                <div className="flex items-center gap-2 text-secondary">
                                                    <MapPin size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Base</span>
                                                </div>
                                                <span className="font-bold text-sm ml-6">{service.comuna}</span>
                                            </div>
                                            <div className="flex flex-col gap-1 bg-primary/5 p-3 rounded-xl border border-primary/10">
                                                <div className="flex items-center gap-2 text-primary">
                                                    <Sparkles size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Reseñas</span>
                                                </div>
                                                <span className="font-bold text-sm ml-6">{service.reviews_count || 0} recibidas</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block px-1">Lugares disponibles / Desplazamiento</Label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {service.coverage_communes && service.coverage_communes.filter(c => c && c.trim()).length > 0 ? (
                                                    service.coverage_communes.filter(c => c && c.trim()).map((c) => (
                                                        <Badge key={c} variant="outline" className="text-[10px] py-0.5 px-3 border-primary/20 text-primary bg-primary/5 rounded-lg">
                                                            {c}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] py-0.5 px-3 border-muted text-muted-foreground italic rounded-lg">
                                                        Solo {service.comuna}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-secondary/5 rounded-2xl border-2 border-dashed border-secondary/20">
                                            <p className="text-xs font-bold text-secondary text-center italic">
                                                * El precio se coordina por interno con el profesional
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-8">
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-2xl border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300 h-14 font-bold text-sm"
                                            onClick={() => {
                                                const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"]') as HTMLButtonElement | null;
                                                if (closeBtn) closeBtn.click();
                                                onOpenReviews(service);
                                            }}
                                        >
                                            <Star size={18} className="mr-2 fill-yellow-400 text-yellow-400" />
                                            Ver Reseñas
                                        </Button>
                                        <Button
                                            className="w-full rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white transition-all duration-300 h-14 font-extrabold text-sm shadow-lg shadow-green-500/20"
                                            onClick={() => {
                                                const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"]') as HTMLButtonElement | null;
                                                if (closeBtn) closeBtn.click();
                                                onWhatsApp(service);
                                            }}
                                            disabled={!service.phone}
                                        >
                                            <MessageCircle size={20} className="mr-2" />
                                            WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="space-y-4 pt-1">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-secondary/5 px-3 py-1.5 rounded-xl border border-secondary/10 max-w-[50%]">
                                <MapPin size={14} className="text-secondary shrink-0" />
                                <span className="text-xs font-bold truncate">{service.comuna}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 rounded-xl border border-yellow-400/20 shadow-sm">
                                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                <span className="text-xs font-black text-yellow-700">
                                    {(service.average_rating && Number(service.average_rating) > 0) ? Number(service.average_rating).toFixed(1) : '0.0'}
                                </span>
                                <span className="text-[10px] text-yellow-600 font-bold opacity-70">({service.reviews_count || 0})</span>
                            </div>
                        </div>

                        {/* Lugares Disponibles / Cobertura */}
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Zonas de servicio</span>
                            <div className="flex flex-wrap gap-1">
                                {service.coverage_communes && service.coverage_communes.filter(c => c && c.trim()).length > 0 ? (
                                    service.coverage_communes.filter(c => c && c.trim()).slice(0, 3).map((c) => (
                                        <Badge key={c} variant="outline" className="text-[9px] py-0 px-2 border-primary/20 text-primary bg-primary/5 rounded-md">
                                            {c}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="outline" className="text-[9px] py-0 px-2 border-muted text-muted-foreground italic rounded-md">
                                        Solo {service.comuna}
                                    </Badge>
                                )}
                                {service.coverage_communes && service.coverage_communes.filter(c => c && c.trim()).length > 3 && (
                                    <span className="text-[9px] text-muted-foreground font-bold ml-1">
                                        +{service.coverage_communes.filter(c => c && c.trim()).length - 3} más
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-5">
                    <Button
                        variant="outline"
                        className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300 h-10 rounded-xl font-bold text-xs"
                        onClick={() => onOpenReviews(service)}
                    >
                        <Star size={14} className="mr-1.5 fill-yellow-400 text-yellow-400" />
                        Reseñas ({service.reviews_count || 0})
                    </Button>
                    <Button
                        className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white h-10 rounded-xl font-black text-xs shadow-md shadow-green-500/10 transition-all active:scale-[0.98]"
                        onClick={() => onWhatsApp(service)}
                        disabled={!service.phone}
                    >
                        <MessageCircle size={16} className="mr-1.5" />
                        WhatsApp
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
