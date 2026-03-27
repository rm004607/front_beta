import { Info, Loader2, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

type ReviewUserRef = {
  id?: string;
  role_number?: number;
};

interface ProductReviewsDialogProps {
  product: {
    id: string;
    title: string;
    user_id: string;
    user_name: string;
  } | null;
  reviews: Review[];
  stats: ReviewStats | null;
  isLoggedIn: boolean;
  user: ReviewUserRef | null | undefined;
  userRating: number;
  userComment: string;
  isSubmittingReview: boolean;
  loadingReviews: boolean;
  setUserRating: (rating: number) => void;
  setUserComment: (comment: string) => void;
  onSubmitReview: () => void;
  onReviewDeleted?: (reviewId: string) => void;
}

export function ProductReviewsDialog({
  product,
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
  onReviewDeleted,
}: ProductReviewsDialogProps) {
  if (!product) return null;

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta reseña?')) return;
    try {
      await reviewsAPI.deleteProductReview(reviewId);
      toast.success('Reseña eliminada correctamente');
      onReviewDeleted?.(reviewId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la reseña');
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
          <Star className="fill-yellow-400 text-yellow-400" />
          Reseñas de {product.user_name}
        </DialogTitle>
        <DialogDescription>{product.title}</DialogDescription>
      </DialogHeader>

      {stats && (
        <div className="bg-yellow-400/10 p-5 rounded-2xl border border-yellow-400/20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-yellow-500 font-bold mb-1">Calificación Promedio</p>
            <p className="text-4xl font-black text-yellow-400">
              {(stats.average_rating && Number(stats.average_rating) > 0) ? Number(stats.average_rating).toFixed(1) : '0.0'}
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs uppercase tracking-widest text-yellow-500 font-bold mb-1">Total reseñas</p>
            <p className="text-3xl font-black text-yellow-400">{stats.total_reviews}</p>
          </div>
        </div>
      )}

      {(!isLoggedIn || (user?.id !== product.user_id || user?.role_number === 5)) ? (
        JSON.parse(localStorage.getItem('contacted_products') || '[]').includes(product.id) ? (
          <div className="border rounded-xl p-4 mb-6 bg-muted/30">
            <h4 className="font-bold mb-3">Deja tu reseña</h4>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setUserRating(s)} className="transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 ${s <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <Label htmlFor="product-review-comment" className="mb-2 block">Tu comentario</Label>
            <Input
              id="product-review-comment"
              placeholder="Cuéntanos tu experiencia con este producto..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              className="mb-4"
            />
            <Button onClick={onSubmitReview} disabled={isSubmittingReview} className="w-full">
              {isSubmittingReview ? <Loader2 className="animate-spin" /> : 'Publicar reseña'}
            </Button>
          </div>
        ) : (
          <div className="bg-primary/5 p-4 rounded-xl border border-dashed border-primary/20 mb-6 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Info size={16} />
              Para dejar una reseña, primero debes contactar al vendedor por WhatsApp.
            </p>
          </div>
        )
      ) : (
        <div className="border border-dashed rounded-xl p-6 mb-6 bg-muted/10 text-center">
          <p className="text-sm text-yellow-700 font-medium">No puedes calificar tu propio producto.</p>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-bold border-b pb-2">Opiniones de compradores</h4>
        {loadingReviews ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 italic">No hay reseñas aún.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  {user?.role_number === 5 && (
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
              <p className="text-sm text-foreground/90 leading-relaxed mt-1">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
