import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { chileData } from '@/lib/chile-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Search, MessageCircle, Loader2, Plus, TrendingUp, DollarSign, Star, Globe, Wrench } from 'lucide-react';
import { servicesAPI, flowAPI, configAPI, reviewsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceCard } from '@/components/ServiceCard';
import { ServiceDetail } from '@/components/ServiceDetail';

const Services = () => {
  const { user, isLoggedIn } = useUser();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchTerm, setSearchTerm] = useState('');
  const [comunaFilter, setComunaFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState(user?.region_id ? String(user.region_id) : 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type_id') || 'all');
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Pago por contacto
  const [isPaidContactModalOpen, setIsPaidContactModalOpen] = useState(false);
  const [pendingContactService, setPendingContactService] = useState<any>(null);
  const [whatsappPrice, setWhatsappPrice] = useState<number>(2990);
  const [pricingEnabled, setPricingEnabled] = useState<boolean>(true);

  // Reseñas
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [selectedServiceForReviews, setSelectedServiceForReviews] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ average_rating: number; total_reviews: number } | null>(null);

  useEffect(() => {
    loadServices();
  }, [searchTerm, comunaFilter, regionFilter, typeFilter, pagination.page]);

  // Cargar precio dinámico y estado de pricing
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await configAPI.getPublicPrices();
        if (response.whatsapp_contact_price) {
          setWhatsappPrice(response.whatsapp_contact_price);
        }
        if (response.pricing_enabled !== undefined) {
          setPricingEnabled(response.pricing_enabled);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();
  }, []);

  // Efecto para actualizar typeFilter si cambia la URL
  useEffect(() => {
    const typeId = searchParams.get('type_id');
    if (typeId) {
      setTypeFilter(typeId);
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      setTypeFilter('all');
    }
  }, [searchParams]);

  // Efecto para scroll al elemento resaltado
  useEffect(() => {
    if (highlightId && !loading && services.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`service-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [highlightId, loading, services]);

  useEffect(() => {
    loadServices();
  }, [searchTerm, comunaFilter, regionFilter, typeFilter, pagination.page]);

  // Cargar tipos de servicios para mostrar nombres en filtros/badge
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const response = await servicesAPI.getServiceTypes();
        setServiceTypes(response.types);
      } catch (error) {
        console.error('Error loading types:', error);
      }
    };
    loadTypes();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await servicesAPI.getServices({
        search: searchTerm || undefined,
        comuna: comunaFilter !== 'all' ? comunaFilter : undefined,
        // Si hay una comuna seleccionada, no filtramos por región para permitir ver servicios de otras regiones que cubren esa comuna
        region_id: comunaFilter === 'all' && regionFilter !== 'all' ? regionFilter : undefined,
        service_type_id: typeFilter !== 'all' ? typeFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setServices(response.services);
      setPagination(response.pagination);
    } catch (error) {
      toast.error(t('services.loading_error'));
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleWhatsApp = (service: any) => {
    // Verificar si el usuario está logueado
    if (!isLoggedIn) {
      toast.error(t('services.contact_login_msg'));
      navigate('/login');
      return;
    }

    if (!service.phone) {
      toast.error(t('services.no_phone_msg'));
      return;
    }

    // Si pricing está desactivado, contactar gratis
    if (!pricingEnabled) {
      const cleanPhone = service.phone.replace(/\D/g, '');
      const message = `Hola, te contacto por tu servicio "${service.service_name}" en Dameldato.`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }

    setPendingContactService(service);
    setIsPaidContactModalOpen(true);
  };

  const fetchReviews = async (serviceId: string) => {
    setLoadingReviews(true);
    try {
      const response = await reviewsAPI.getServiceReviews(serviceId);
      setReviews(response.reviews);
      setReviewStats(response.stats);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error(t('services.reviews_error'));
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenReviews = async (service: any) => {
    setSelectedServiceForReviews(service);
    setIsReviewsModalOpen(true);
    setUserRating(0);
    setUserComment('');
    fetchReviews(service.id);
  };

  const handleDeleteService = async (service: any) => {
    if (!window.confirm(t('services.delete_confirm'))) return;

    try {
      await servicesAPI.deleteService(service.id);
      toast.success(t('services.delete_success'));
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || t('services.delete_error'));
    }
  };

  const handleSubmitReview = async () => {
    if (!userRating) {
      toast.error(t('services.select_rating_msg'));
      return;
    }
    if (!userComment.trim()) {
      toast.error(t('services.write_comment_msg'));
      return;
    }

    if (!isLoggedIn) {
      toast.error(t('services.login_to_review_msg'));
      return;
    }

    if (selectedServiceForReviews?.user_id === user?.id && user?.role_number !== 5) {
      toast.error(t('services.own_service_review_msg'));
      return;
    }

    try {
      setIsSubmittingReview(true);
      await reviewsAPI.createServiceReview(selectedServiceForReviews.id, {
        rating: userRating,
        comment: userComment,
      });
      toast.success(t('services.review_success'));
      setUserRating(0);
      setUserComment('');
      // Recargar reseñas
      fetchReviews(selectedServiceForReviews.id);
      // Recargar servicios para actualizar el promedio en la lista principal
      loadServices();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || t('services.review_error'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 p-6 glass-card rounded-3xl border-primary/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{t('services.title')}</h1>
              <p className="text-sm sm:text-base text-muted-foreground italic">{t('services.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
              {(user?.roles.includes('entrepreneur') || user?.role_number === 5) && (
                <Link to="/servicios/publicar">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hover-gold-glow transition-all duration-300 w-full sm:w-auto font-bold px-6">
                    <Plus size={18} className="mr-2" />
                    {t('services.publish_btn')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 glass-card border-white/5 bg-card/30">
          <CardContent className="p-4 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder={t('services.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              <Select value={regionFilter} onValueChange={(val) => {
                setRegionFilter(val);
                setComunaFilter('all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger className="glass-card border-white/10 h-11">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-secondary" />
                    <SelectValue placeholder={t('services.region_placeholder')} />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">{t('services.all_regions')}</SelectItem>
                  {chileData.map((reg) => (
                    <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={comunaFilter} onValueChange={(val) => {
                setComunaFilter(val);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger className="glass-card border-white/10 h-11">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <SelectValue placeholder={t('services.comuna_placeholder')} />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">{t('services.all_comunas')}</SelectItem>
                  {regionFilter !== 'all' ? (
                    chileData.find(r => String(r.id) === String(regionFilter))?.communes.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="santiago">Santiago Centro</SelectItem>
                      <SelectItem value="providencia">Providencia</SelectItem>
                      <SelectItem value="lascondes">Las Condes</SelectItem>
                      <SelectItem value="maipu">Maipú</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(val) => {
                setTypeFilter(val);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger className="glass-card border-white/10 h-11">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-accent" />
                    <SelectValue placeholder="Categoría" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtros Activos (Badges) */}
            {(typeFilter !== 'all' || searchTerm || comunaFilter !== 'all' || regionFilter !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                {typeFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/20 px-3 py-1 flex items-center gap-2">
                    Categoría: {serviceTypes.find(t => t.id === typeFilter)?.name || 'Cargando...'}
                    <button onClick={() => setTypeFilter('all')} className="hover:text-primary transition-colors">x</button>
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 px-3 py-1 flex items-center gap-2">
                    Búsqueda: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="hover:text-primary transition-colors">x</button>
                  </Badge>
                )}
                {(comunaFilter !== 'all' || regionFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComunaFilter('all');
                      setRegionFilter('all');
                      setSearchTerm('');
                      setTypeFilter('all');
                    }}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Limpiar todos los filtros
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Listings */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 gap-2">
            <Loader2 className="animate-spin text-secondary" size={32} />
            <p className="text-muted-foreground text-sm">{t('services.loading')}</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  highlightId={highlightId}
                  isSuperAdmin={user?.role_number === 5}
                  onOpenReviews={handleOpenReviews}
                  onWhatsApp={handleWhatsApp}
                  onDelete={handleDeleteService}
                  onEdit={(s) => navigate(`/admin?tab=services&search=${s.user_name}`)}
                />
              ))}
            </div>

            {services.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">{t('services.not_found')}</p>
              </div>
            )}
          </>
        )}

        {/* Modal de Reseñas */}
        <Dialog open={isReviewsModalOpen} onOpenChange={setIsReviewsModalOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
            <ServiceDetail
              service={selectedServiceForReviews}
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
              onReviewDeleted={(id) => {
                setReviews(prev => prev.filter(r => r.id !== id));
                if (selectedServiceForReviews) {
                  // También refrescar estadísticas para actualizar el promedio
                  fetchReviews(selectedServiceForReviews.id);
                }
              }}
            />
          </DialogContent>
        </Dialog>
        {/* Dialog de cobro por contacto WhatsApp */}
        <Dialog open={isPaidContactModalOpen} onOpenChange={setIsPaidContactModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none rounded-2xl">
            <Card className="border-t-4 border-t-primary shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-green-600" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-800">{t('services.contact_whatsapp')}</DialogTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-blue-800 font-medium mb-1">{t('services.premium_service')}</p>
                  <div className="text-3xl font-black text-blue-900">
                    {new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'es-CL', { style: 'currency', currency: 'CLP' }).format(whatsappPrice)}
                  </div>
                  <p className="text-blue-600 text-xs mt-1">{t('services.one_time_payment')}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">{t('services.immediate_access')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">{t('services.direct_chat')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsPaidContactModalOpen(false)}
                    className="h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!pendingContactService) return;
                      try {
                        setIsPaidContactModalOpen(false);
                        toast.loading(t('wall.preparing_payment'), { id: 'contact-payment' });

                        const response = await flowAPI.createContactPayment(
                          pendingContactService.user_id,
                          undefined, // postId no aplica aquí
                          pendingContactService.id // serviceId
                        );

                        if (response && response.url) {
                          toast.success(t('wall.redirecting_flow'), { id: 'contact-payment' });
                          window.location.href = response.url;
                        } else {
                          throw new Error('No se recibió la URL de pago del servidor');
                        }
                      } catch (error: any) {
                        console.error('Error creating contact payment:', error);
                        toast.error(error.message || t('wall.payment_error'), { id: 'contact-payment' });
                      }
                    }}
                    className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
                  >
                    Pagar y Chatear
                  </Button>
                </div>

                <p className="text-[10px] text-center text-gray-400">
                  {t('services.accept_policies')}
                </p>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
};

export default Services;

