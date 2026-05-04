import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Star, ChevronRight } from 'lucide-react';
import { formatProductPrice, getProductCoverImage, getProductStatusLabel, resolveProductDescription } from '@/lib/productUtils';
import { VerifiedBadge } from '@/components/VerifiedBadge';

export interface ProductCardItem {
  id: string;
  title: string;
  description: string;
  product_status: 'new' | 'used' | 'refurbished';
  price?: number | null;
  currency?: string;
  phone?: string;
  user_id: string;
  user_name: string;
  cover_image_url?: string | null;
  images?: Array<{ image_url: string; sort_order?: number }>;
  average_rating?: number;
  reviews_count?: number;
  provider_kyc_status?: string;
}

interface ProductCardProps {
  product: ProductCardItem;
  onOpenDetail: (product: ProductCardItem) => void;
  onOpenReviews: (product: ProductCardItem) => void;
  onWhatsApp: (product: ProductCardItem) => void;
}

export const ProductCard = memo(function ProductCard({
  product,
  onOpenDetail,
  onOpenReviews,
  onWhatsApp,
}: ProductCardProps) {
  const cover = getProductCoverImage(product);
  const descriptionPreview = resolveProductDescription(product);

  return (
    <Card className="group overflow-hidden rounded-[2rem] border-2 border-border hover:border-primary/25 hover:shadow-2xl transition-all duration-300">
      <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-gradient-to-b from-muted/50 to-muted/30 flex items-center justify-center p-2 sm:p-3">
        {cover ? (
          <img
            src={cover}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="max-h-full max-w-full h-auto w-auto object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
        <Badge className="absolute top-3 right-3 rounded-full bg-background/90 text-foreground border border-border">
          {getProductStatusLabel(product.product_status)}
        </Badge>
      </div>

      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-lg font-black line-clamp-1">{product.title}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm text-muted-foreground">Por {product.user_name}</p>
              {product.provider_kyc_status === 'verified' && <VerifiedBadge size="sm" />}
            </div>
            <p
              className="text-sm text-foreground/85 leading-snug line-clamp-3 min-h-[3.25rem]"
              title={descriptionPreview || undefined}
            >
              {descriptionPreview || 'Sin descripción disponible.'}
            </p>
            <p className="text-sm font-bold text-primary">
              {formatProductPrice(product.price, product.currency || 'CLP')}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 rounded-xl bg-yellow-400/5 border border-yellow-400/10 px-3 py-2">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-black">
                {(product.average_rating && Number(product.average_rating) > 0)
                  ? Number(product.average_rating).toFixed(1)
                  : '0.0'}
              </span>
              <span className="text-xs text-muted-foreground">({product.reviews_count || 0})</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl px-3"
              onClick={() => onOpenDetail(product)}
            >
              Detalles
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="rounded-[1.25rem] border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
              onClick={() => onOpenReviews(product)}
            >
              <Star size={16} className="mr-2 fill-yellow-400 text-yellow-400" />
              Reseñas
            </Button>
            <Button
              className="rounded-[1.25rem] bg-[#25D366] hover:bg-[#20ba59] text-white"
              onClick={() => onWhatsApp(product)}
              disabled={!product.phone}
            >
              <MessageCircle size={18} className="mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
