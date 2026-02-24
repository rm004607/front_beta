import { Star, MapPin, MessageCircle, Edit, Trash2, ChevronRight } from 'lucide-react';
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
    return (
        <Card
            id={`service-${service.id}`}
            className={`hover:shadow-lg transition-all duration-500 border-2 ${String(service.id) === highlightId
                ? 'border-destructive shadow-xl ring-4 ring-destructive/15 scale-[1.02]'
                : 'border-border'
                }`}
        >
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                        {service.profile_image && (
                            <AvatarImage src={service.profile_image} alt={service.user_name} />
                        )}
                        <AvatarFallback className="text-xl font-heading bg-secondary text-white shrink-0">
                            {service.user_name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-xl mb-1 truncate">{service.user_name}</CardTitle>
                            <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20 shadow-sm shrink-0">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm font-bold text-yellow-500">
                                    {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="truncate max-w-[150px]">{service.service_name}</Badge>
                            {isSuperAdmin && (
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => onEdit?.(service)}
                                    >
                                        <Edit size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                        onClick={() => onDelete?.(service)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4 overflow-hidden">
                    <p className="text-sm text-muted-foreground line-clamp-2 break-words">{service.description}</p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="text-sm text-primary font-medium hover:underline mt-1 focus:outline-none flex items-center">
                                Ver más <ChevronRight className="w-4 h-4 ml-0.5" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[450px] w-full max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="mb-4">
                                <div className="flex items-start gap-4">
                                    <Avatar className="w-16 h-16">
                                        {service.profile_image && (
                                            <AvatarImage src={service.profile_image} alt={service.user_name} />
                                        )}
                                        <AvatarFallback className="text-xl font-heading bg-secondary text-white">
                                            {service.user_name.split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left">
                                        <div className="flex justify-between items-start">
                                            <DialogTitle className="text-xl mb-1">{service.user_name}</DialogTitle>
                                            <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20 shadow-sm">
                                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                                <span className="text-sm font-bold text-yellow-500">
                                                    {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="mt-1">{service.service_name}</Badge>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-5">
                                <div>
                                    <h4 className="font-semibold mb-1.5 text-sm uppercase tracking-wider text-muted-foreground">Descripción del servicio</h4>
                                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{service.description}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg">
                                        <MapPin size={20} className="text-secondary flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Ubicación</p>
                                            <span className="font-medium text-sm">{service.comuna}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Lugares disponibles / Desplazamiento:</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {service.coverage_communes && service.coverage_communes.length > 0 ? (
                                                service.coverage_communes.map((c) => (
                                                    <Badge key={c} variant="outline" className="text-xs py-0.5 px-3 border-primary/20 text-primary bg-primary/5">
                                                        {c}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <Badge variant="outline" className="text-xs py-0.5 px-3 border-muted text-muted-foreground italic">
                                                    Solo {service.comuna}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2 border-t mt-4">
                                        <div className="flex items-center gap-2 p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                                            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                            <p className="text-sm font-medium text-secondary-foreground/80 italic">
                                                El precio se coordina por interno con el que ofrezca el servicio
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300 h-11"
                                        onClick={() => {
                                            const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"]') as HTMLButtonElement | null;
                                            if (closeBtn) closeBtn.click();
                                            onOpenReviews(service);
                                        }}
                                    >
                                        <Star size={16} className="mr-2 fill-yellow-400 text-yellow-400" />
                                        Reseñas ({service.reviews_count || 0})
                                    </Button>
                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover-gold-glow transition-all duration-300 h-11 shadow-md shadow-primary/20"
                                        onClick={() => {
                                            const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"]') as HTMLButtonElement | null;
                                            if (closeBtn) closeBtn.click();
                                            onWhatsApp(service);
                                        }}
                                        disabled={!service.phone}
                                    >
                                        <MessageCircle size={18} className="mr-2" />
                                        WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="space-y-2 mb-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <MapPin size={16} className="text-secondary shrink-0" />
                                <span className="font-medium truncate">{service.comuna}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                <span className="font-bold text-yellow-500">
                                    {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                                </span>
                                <span className="text-[10px]">({service.reviews_count || 0} reseñas)</span>
                            </div>
                        </div>

                        {/* Lugares Disponibles / Cobertura */}
                        <div className="space-y-1.5 pt-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Lugares disponibles / Desplazamiento:</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {service.coverage_communes && service.coverage_communes.length > 0 ? (
                                    service.coverage_communes.map((c) => (
                                        <Badge key={c} variant="outline" className="text-[10px] py-0 px-2 border-primary/20 text-primary bg-primary/5">
                                            {c}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="outline" className="text-[10px] py-0 px-2 border-muted text-muted-foreground italic">
                                        Solo {service.comuna}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Nota de coordinación de precio */}
                    <div className="mt-1">
                        <p className="text-[10px] font-medium text-secondary italic">
                            * Precio a coordinar por interno
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300 h-10 sm:h-11"
                        onClick={() => onOpenReviews(service)}
                    >
                        <Star size={16} className="mr-2 fill-yellow-400 text-yellow-400" />
                        Reseñas ({service.reviews_count || 0})
                    </Button>
                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover-gold-glow transition-all duration-300 h-10 sm:h-11"
                        onClick={() => onWhatsApp(service)}
                        disabled={!service.phone}
                    >
                        <MessageCircle size={16} className="mr-2" />
                        WhatsApp
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
