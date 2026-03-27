import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Loader2, MapPin, Package2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { normalizeSearchQuery } from '@/lib/searchQuery';
import { productsAPI, reviewsAPI, regionsAPI } from '@/lib/api';
import { ProductCard, type ProductCardItem } from '@/components/ProductCard';
import { ProductDetailModalContent, type ProductForDetail } from '@/components/ProductDetailModal';
import { ProductReviewsDialog } from '@/components/ProductReviewsDialog';
import { loadRegionOptionsSorted, type RegionOption } from '@/lib/regions-catalog';
import { catalogFetchUserMessage } from '@/lib/catalog-fetch-errors';
import { PRODUCT_STATUS_OPTIONS, resolveProductDescription } from '@/lib/productUtils';

function communesNamesFromApiResponse(
  rid: string,
  r: { region_id: number; communes: { name: string; region_id: number }[] }
): string[] | null {
  if (Number(r.region_id) !== Number(rid)) return null;
  const names = r.communes
    .filter((c) => Number(c.region_id) === Number(rid))
    .map((c) => c.name);
  return names.length > 0 ? names : null;
}

type ProductListItem = ProductCardItem & {
  comuna: string;
  region_id?: string;
  region_name?: string;
  status: string;
  created_at: string;
};

type ProductReview = {
  id: string;
  user_name: string;
  profile_image?: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

const Products = () => {
  const { user, isLoggedIn } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = normalizeSearchQuery(useDebouncedValue(searchTerm, 320)) ?? '';
  const [regionFilter, setRegionFilter] = useState('all');
  const [comunaFilter, setComunaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 0 });
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [communes, setCommunes] = useState<string[]>([]);
  const [communesLoading, setCommunesLoading] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductForDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<ProductForDetail | null>(null);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewStats, setReviewStats] = useState<{ average_rating: number; total_reviews: number } | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [listRefreshTick, setListRefreshTick] = useState(0);
  const latestLoadRequestId = useRef(0);

  const canPublishProducts = !!user && (user.roles.includes('entrepreneur') || user.role_number === 5);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRegionsLoading(true);
      setRegionsError(null);
      try {
        const list = await loadRegionOptionsSorted();
        if (!cancelled) setRegions(list);
      } catch (e) {
        if (!cancelled) setRegionsError(catalogFetchUserMessage(e));
      } finally {
        if (!cancelled) setRegionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (regionFilter === 'all') {
      setCommunes([]);
      setCommunesLoading(false);
      return;
    }
    let cancelled = false;
    setCommunes([]);
    setCommunesLoading(true);
    (async () => {
      try {
        const r = await regionsAPI.getCommunesByRegion(String(regionFilter));
        if (cancelled) return;
        setCommunes(communesNamesFromApiResponse(String(regionFilter), r) || []);
      } catch {
        if (!cancelled) setCommunes([]);
      } finally {
        if (!cancelled) setCommunesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regionFilter]);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++latestLoadRequestId.current;
    setLoading(true);
    (async () => {
      try {
        const response = await productsAPI.getProducts({
          search: debouncedSearch || undefined,
          comuna: comunaFilter !== 'all' ? comunaFilter : undefined,
          region_id: comunaFilter === 'all' && regionFilter !== 'all' ? regionFilter : undefined,
          product_status: statusFilter !== 'all' ? statusFilter : undefined,
          page: pagination.page,
          limit: pagination.limit,
        });
        if (cancelled || requestId !== latestLoadRequestId.current) return;
        const list = (response.products || []).map((p) => ({
          ...p,
          description: resolveProductDescription(p),
        }));
        setProducts(list);
        setPagination((prev) => ({
          ...prev,
          page: response.pagination.page,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        }));
      } catch (error) {
        if (cancelled || requestId !== latestLoadRequestId.current) return;
        toast.error('Error al cargar productos');
        console.error('Error loading products:', error);
      } finally {
        if (!cancelled && requestId === latestLoadRequestId.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, comunaFilter, regionFilter, statusFilter, pagination.page, pagination.limit, listRefreshTick]);

  useEffect(() => {
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [debouncedSearch, comunaFilter, regionFilter, statusFilter]);

  const fetchProductDetail = async (productId: string) => {
    setDetailLoading(true);
    try {
      const response = await productsAPI.getProductById(productId);
      setDetailProduct(response.product);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar el detalle del producto');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDetail = async (product: ProductListItem) => {
    setDetailProduct(product as ProductForDetail);
    fetchProductDetail(product.id);
  };

  const fetchReviews = async (productId: string) => {
    setLoadingReviews(true);
    try {
      const response = await reviewsAPI.getProductReviews(productId);
      setReviews(response.reviews);
      setReviewStats(response.stats);
    } catch (error) {
      console.error('Error loading product reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenReviews = (product: ProductForDetail) => {
    setSelectedProductForReviews(product);
    setIsReviewsModalOpen(true);
    setUserRating(0);
    setUserComment('');
    fetchReviews(product.id);
  };

  const handleWhatsApp = (product: ProductForDetail | ProductListItem) => {
    if (!product.phone) {
      toast.error('Este producto no tiene número de teléfono disponible');
      return;
    }
    const contactedStr = localStorage.getItem('contacted_products') || '[]';
    const contacted = JSON.parse(contactedStr);
    if (!contacted.includes(product.id)) {
      contacted.push(product.id);
      localStorage.setItem('contacted_products', JSON.stringify(contacted));
    }
    const cleanPhone = product.phone.replace(/\D/g, '');
    const message = `Hola, te contacto por tu producto "${product.title}" en Dameldato.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmitReview = async () => {
    if (!selectedProductForReviews) return;
    if (!userRating) {
      toast.error('Selecciona una puntuación');
      return;
    }
    if (!userComment.trim()) {
      toast.error('Escribe un comentario');
      return;
    }
    if (selectedProductForReviews.user_id === user?.id && user?.role_number !== 5) {
      toast.error('No puedes calificar tu propio producto');
      return;
    }
    try {
      setIsSubmittingReview(true);
      await reviewsAPI.createProductReview(selectedProductForReviews.id, {
        rating: userRating,
        comment: userComment,
      });
      toast.success('Reseña enviada correctamente');
      setUserRating(0);
      setUserComment('');
      fetchReviews(selectedProductForReviews.id);
      setListRefreshTick((n) => n + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar la reseña');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const activeFilter = useMemo(
    () => searchTerm || comunaFilter !== 'all' || regionFilter !== 'all' || statusFilter !== 'all',
    [searchTerm, comunaFilter, regionFilter, statusFilter]
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8 p-6 glass-card rounded-[2rem] border-primary/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-2xl sm:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Productos
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-medium italic">
                Compra y vende productos en tu comunidad al estilo marketplace.
              </p>
            </div>
            {canPublishProducts && (
              <Link to="/productos/publicar" className="w-full md:w-auto">
                <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 rounded-xl font-bold h-12">
                  <Plus size={18} className="mr-2" />
                  Publicar producto
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Card className="mb-6 sm:mb-8 glass-card border-white/5 bg-card/30 rounded-[1.5rem] sm:rounded-[2rem]">
          <CardContent className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar producto..."
                  className="pl-9 h-11 text-sm bg-white/50"
                />
              </div>

              <Select value={regionFilter} onValueChange={(value) => {
                setRegionFilter(value);
                setComunaFilter('all');
              }}>
                <SelectTrigger className="glass-card border-white/10 h-11 text-sm bg-white/50">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-secondary" />
                    <SelectValue placeholder={regionsLoading ? 'Cargando regiones…' : 'Región'} />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">📍 Todas las regiones</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {regionFilter !== 'all' && (
                <Select value={comunaFilter} onValueChange={setComunaFilter}>
                  <SelectTrigger className="glass-card border-white/10 h-11 text-sm bg-white/50">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      <SelectValue placeholder={communesLoading ? 'Cargando comunas…' : 'Comuna'} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                    <SelectItem value="all">🌐 Todas las comunas</SelectItem>
                    {communes.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass-card border-white/10 h-11 text-sm bg-white/50">
                  <div className="flex items-center gap-2">
                    <Package2 size={14} className="text-accent" />
                    <SelectValue placeholder="Estado del producto" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {PRODUCT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFilter && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                {searchTerm && <Badge variant="secondary">Búsqueda: {searchTerm}</Badge>}
                {statusFilter !== 'all' && <Badge variant="secondary">Estado: {PRODUCT_STATUS_OPTIONS.find((item) => item.value === statusFilter)?.label}</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setRegionFilter('all');
                    setComunaFilter('all');
                    setStatusFilter('all');
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}

            {regionsError && (
              <div className="mt-4 text-sm text-red-500">{regionsError}</div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 gap-2">
            <Loader2 className="animate-spin text-secondary" size={32} />
            <p className="text-muted-foreground text-sm">Cargando productos...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={handleOpenDetail}
                  onOpenReviews={(item) => handleOpenReviews(item as ProductForDetail)}
                  onWhatsApp={handleWhatsApp}
                />
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No se encontraron productos con esos filtros</p>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                    className="min-w-9"
                  >
                    {pageNum}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}

        <Dialog open={!!detailProduct} onOpenChange={(open) => !open && setDetailProduct(null)}>
          <DialogContent
            disableAnimation
            aria-describedby={undefined}
            className="max-w-[1040px] w-[95%] max-h-[92vh] overflow-y-auto rounded-[2rem] border border-border p-0 bg-card shadow-2xl"
          >
            <DialogTitle className="sr-only">Detalle del producto</DialogTitle>
            <DialogClose className="absolute top-4 right-4 z-[70] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all border-0">
              <X size={20} />
              <span className="sr-only">Cerrar</span>
            </DialogClose>
            {detailLoading && !detailProduct?.description ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : detailProduct ? (
              <ProductDetailModalContent
                product={detailProduct}
                onClose={() => setDetailProduct(null)}
                onOpenReviews={handleOpenReviews}
                onWhatsApp={handleWhatsApp}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={isReviewsModalOpen} onOpenChange={setIsReviewsModalOpen}>
          <DialogContent aria-describedby={undefined} className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
            <DialogTitle className="sr-only">Reseñas del producto</DialogTitle>
            <ProductReviewsDialog
              product={selectedProductForReviews}
              reviews={reviews}
              stats={reviewStats}
              isLoggedIn={isLoggedIn}
              user={user}
              userRating={userRating}
              userComment={userComment}
              isSubmittingReview={isSubmittingReview}
              loadingReviews={loadingReviews}
              setUserRating={setUserRating}
              setUserComment={setUserComment}
              onSubmitReview={handleSubmitReview}
              onReviewDeleted={(reviewId) => {
                setReviews((prev) => prev.filter((review) => review.id !== reviewId));
                if (selectedProductForReviews) fetchReviews(selectedProductForReviews.id);
              }}
            />
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Products;
