import { Star, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { reviewsAPI } from '@/lib/api';
import { toast } from 'sonner';

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
    onReviewDeleted?: (reviewId: string) => void;
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
    onSubmitReview,
    onReviewDeleted
}: ServiceDetailProps) => {
    if (!service) return null;

    const handleDeleteReview = async (reviewId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta reseña?')) return;

        try {
            await reviewsAPI.deleteServiceReview(reviewId);
            toast.success('Reseña eliminada correctamente');
            if (onReviewDeleted) onReviewDeleted(reviewId);
        } catch (error: any) {
            console.error('Error deleting review:', error);
            toast.error(error.message || 'Error al eliminar la reseña');
        }
    };

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
                <div className="glass-card bg-yellow-400/10 p-5 rounded-2xl border border-yellow-400/20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div className="text-center sm:text-left">
                        <p className="text-xs uppercase tracking-widest text-yellow-500 font-bold mb-1">Calificación Promedio</p>
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                            <span className="text-4xl font-black text-yellow-400 text-glow">{(stats.average_rating && Number(stats.average_rating) > 0) ? Number(stats.average_rating).toFixed(1) : '0.0'}</span>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                        key={s}
                                        className={`w-4 h-4 ${s <= Math.round(stats.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-400/20'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-yellow-400/10 pt-4 sm:pt-0 sm:pl-8">
                        <p className="text-xs uppercase tracking-widest text-yellow-500 font-bold mb-1">Total Reseñas</p>
                        <p className="text-3xl font-black text-yellow-400">{stats.total_reviews}</p>
                    </div>
                </div>
            )}

            {/* Formulario para dejar reseña */}
            {(isLoggedIn && (user?.id !== service.user_id || user?.role_number === 5)) ? (
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
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    {(user?.role_number === 5) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteReview(review.id)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed pl-10 mt-1">{review.comment}</p>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};
