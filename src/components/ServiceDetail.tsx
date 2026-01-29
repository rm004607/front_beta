import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Review {
    id: string;
    user_name: string;
    profile_image?: string | null;
    rating: number;
    comment: string;
    created_at: string;
}

interface ReviewStats {
    average_rating: number;
    total_reviews: number;
}

interface ServiceDetailProps {
    service: {
        id: string;
        service_name: string;
        user_id: string;
        user_name: string;
    } | null;
    reviews: Review[];
    stats: ReviewStats | null;
    isLoggedIn: boolean;
    user: any;
    userRating: number;
    userComment: string;
    isSubmittingReview: boolean;
    loadingReviews: boolean;
    setUserRating: (rating: number) => void;
    setUserComment: (comment: string) => void;
    onSubmitReview: () => void;
}

export const ServiceDetail = ({
    service,
    reviews,
    stats,
    isLoggedIn,
    user,
    userRating,
    userComment,
    isSubmittingReview,
    loadingReviews,
    setUserRating,
    setUserComment,
    onSubmitReview
}: ServiceDetailProps) => {
    if (!service) return null;

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Star className="fill-yellow-400 text-yellow-400" />
                    Reseñas de {service.user_name}
                </DialogTitle>
                <DialogDescription>
                    {service.service_name}
                </DialogDescription>
            </DialogHeader>

            {stats && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm text-yellow-800 font-medium">Calificación Promedio</p>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-yellow-900">{Number(stats.average_rating).toFixed(1)}</span>
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        className={`w-4 h-4 ${s <= Math.round(stats.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-200'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-yellow-800 font-medium">Total de Reseñas</p>
                        <p className="text-2xl font-bold text-yellow-900">{stats.total_reviews}</p>
                    </div>
                </div>
            )}

            {/* Formulario para dejar reseña */}
            {isLoggedIn && user?.id !== service.user_id ? (
                <div className="border rounded-xl p-4 mb-8 bg-muted/30">
                    <h4 className="font-bold mb-3">Deja tu reseña</h4>
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                onClick={() => setUserRating(s)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-8 h-8 ${s <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                            </button>
                        ))}
                    </div>
                    <Label htmlFor="review-comment" className="mb-2 block">Tu comentario</Label>
                    <Input
                        id="review-comment"
                        placeholder="Cuéntanos tu experiencia con este servicio..."
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        className="mb-4"
                    />
                    <Button
                        onClick={onSubmitReview}
                        disabled={isSubmittingReview}
                        className="w-full"
                    >
                        {isSubmittingReview ? <Loader2 className="animate-spin" /> : 'Publicar Reseña'}
                    </Button>
                </div>
            ) : (
                <div className="border border-dashed rounded-xl p-6 mb-8 bg-muted/10 text-center">
                    {!isLoggedIn ? (
                        <p className="text-sm text-muted-foreground">
                            Debes <span className="font-bold text-primary">iniciar sesión</span> para dejar una reseña.
                        </p>
                    ) : user?.id === service.user_id ? (
                        <p className="text-sm text-yellow-700 font-medium">
                            No puedes calificar tu propio servicio.
                        </p>
                    ) : null}
                </div>
            )}

            {/* Lista de reseñas */}
            <div className="space-y-4">
                <h4 className="font-bold border-b pb-2">Opiniones de clientes</h4>
                {loadingReviews ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : reviews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 italic">No hay reseñas aún. ¡Sé el primero en calificar!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-8 h-8">
                                        {review.profile_image && <AvatarImage src={review.profile_image} />}
                                        <AvatarFallback className="bg-primary text-white text-xs">
                                            {review.user_name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold">{review.user_name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed pl-10">{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};
