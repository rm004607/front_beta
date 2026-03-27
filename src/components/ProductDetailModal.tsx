import { useEffect, useMemo, useState } from 'react';
import { DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, MapPin, Package2, Star } from 'lucide-react';
import { formatProductPrice, getProductCoverImage, getProductStatusLabel } from '@/lib/productUtils';

export interface ProductForDetail {
  id: string;
  title: string;
  description: string;
  product_status: 'new' | 'used' | 'refurbished';
  price?: number | null;
  currency?: string;
  comuna: string;
  region_id?: string;
  region_name?: string;
  phone?: string;
  user_id: string;
  user_name: string;
  cover_image_url?: string | null;
  images?: Array<{ id?: string; image_url: string; sort_order?: number }>;
  average_rating?: number;
  reviews_count?: number;
}

interface ProductDetailModalProps {
  product: ProductForDetail;
  onClose: () => void;
  onOpenReviews: (product: ProductForDetail) => void;
  onWhatsApp: (product: ProductForDetail) => void;
}

export function ProductDetailModalContent({
  product,
  onClose,
  onOpenReviews,
  onWhatsApp,
}: ProductDetailModalProps) {
  const orderedImages = useMemo(() => {
    const source = product.images && product.images.length > 0
      ? [...product.images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      : getProductCoverImage(product)
        ? [{ image_url: getProductCoverImage(product)! }]
        : [];
    return source;
  }, [product]);

  const [selectedImage, setSelectedImage] = useState(orderedImages[0]?.image_url || null);

  useEffect(() => {
    setSelectedImage(orderedImages[0]?.image_url || null);
  }, [orderedImages]);

  return (
    <div className="bg-white dark:bg-card rounded-[2.5rem] overflow-hidden shadow-2xl text-foreground">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-border/40">
          <div className="aspect-[4/3] sm:aspect-[16/10] min-h-[200px] max-h-[min(70vh,520px)] rounded-[2rem] overflow-hidden bg-gradient-to-b from-muted/50 to-muted/30 flex items-center justify-center p-2 sm:p-3">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.title}
                className="max-h-full max-w-full h-auto w-auto object-contain object-center"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                Sin imágenes
              </div>
            )}
          </div>
          {orderedImages.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {orderedImages.map((image, index) => (
                <button
                  key={`${image.image_url}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image.image_url)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 ${
                    selectedImage === image.image_url ? 'border-primary' : 'border-border/40'
                  }`}
                >
                  <img src={image.image_url} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full">{getProductStatusLabel(product.product_status)}</Badge>
              <Badge variant="secondary" className="rounded-full">
                <Star className="w-3.5 h-3.5 mr-1 fill-yellow-500 text-yellow-500" />
                {(product.average_rating && Number(product.average_rating) > 0)
                  ? Number(product.average_rating).toFixed(1)
                  : '0.0'} ({product.reviews_count || 0})
              </Badge>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black">{product.title}</DialogTitle>
            <p className="text-2xl font-black text-primary">
              {formatProductPrice(product.price, product.currency || 'CLP')}
            </p>
            <p className="text-sm text-muted-foreground">Publicado por {product.user_name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Ubicación</span>
              </div>
              <p className="text-sm font-semibold">
                {[product.comuna, product.region_name].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package2 size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Estado</span>
              </div>
              <p className="text-sm font-semibold">{getProductStatusLabel(product.product_status)}</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/40 bg-muted/30 p-5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Descripción del producto
            </h4>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {product.description || 'Este producto aún no tiene descripción.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="rounded-[1.25rem] border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
              onClick={() => {
                onOpenReviews(product);
                onClose();
              }}
            >
              <Star size={16} className="mr-2 fill-yellow-400 text-yellow-400" />
              Reseñas
            </Button>
            <Button
              className="rounded-[1.25rem] bg-[#25D366] hover:bg-[#20ba59] text-white"
              onClick={() => {
                onWhatsApp(product);
                onClose();
              }}
              disabled={!product.phone}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
