import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { chileData } from '@/lib/chile-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Search, MessageCircle, Loader2, Plus, TrendingUp, DollarSign, Star, Globe } from 'lucide-react';
import { servicesAPI, flowAPI, configAPI, reviewsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchTerm, setSearchTerm] = useState('');
  const [comunaFilter, setComunaFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState(user?.region_id ? String(user.region_id) : 'all');
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
  }, [searchTerm, comunaFilter, regionFilter, pagination.page]);

  // Cargar precio dinámico
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await configAPI.getPublicPrices();
        if (response.whatsapp_contact_price) {
          setWhatsappPrice(response.whatsapp_contact_price);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();
  }, []);

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

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await servicesAPI.getServices({
        search: searchTerm || undefined,
        comuna: comunaFilter !== 'all' ? comunaFilter : undefined,
        region_id: regionFilter !== 'all' ? regionFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setServices(response.services);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Error al cargar servicios');
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleWhatsApp = (service: any) => {
    // Verificar si el usuario está logueado
    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para contactar por WhatsApp');
      navigate('/login');
      return;
    }

    if (!service.phone) {
      toast.error('Este servicio no tiene número de teléfono disponible');
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
      toast.error('Error al cargar las reseñas');
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
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el servicio de "${service.user_name}"?`)) return;

    try {
      await servicesAPI.deleteService(service.id);
      toast.success('Servicio eliminado correctamente');
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Error al eliminar el servicio');
    }
  };

  const handleSubmitReview = async () => {
    if (!userRating) {
      toast.error('Por favor selecciona una puntuación');
      return;
    }
    if (!userComment.trim()) {
      toast.error('Por favor escribe un comentario');
      return;
    }

    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para dejar una reseña');
      return;
    }

    if (selectedServiceForReviews?.user_id === user?.id && user?.role_number !== 5) {
      toast.error('No puedes calificar tu propio servicio');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await reviewsAPI.createServiceReview(selectedServiceForReviews.id, {
        rating: userRating,
        comment: userComment,
      });
      toast.success('Reseña enviada correctamente');
      setUserRating(0);
      setUserComment('');
      // Recargar reseñas
      fetchReviews(selectedServiceForReviews.id);
      // Recargar servicios para actualizar el promedio en la lista principal
      loadServices();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Error al enviar la reseña');
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
              <h1 className="text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Servicios</h1>
              <p className="text-muted-foreground italic">Encuentra profesionales y servicios de confianza en tu comunidad</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
              {(user?.roles.includes('entrepreneur') || user?.role_number === 5) && (
                <Link to="/servicios/publicar">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hover-gold-glow transition-all duration-300 w-full sm:w-auto font-bold px-6">
                    <Plus size={18} className="mr-2" />
                    Publicar Servicio
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 glass-card border-white/5 bg-card/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar servicio..."
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
                    <SelectValue placeholder="Selecciona Región" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">📍 Todas las regiones</SelectItem>
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
                    <SelectValue placeholder="Selecciona Comuna" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">🌐 Todas las comunas</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* Service Listings */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-secondary" size={32} />
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
                <p className="text-muted-foreground text-lg">No se encontraron servicios con esos filtros</p>
              </div>
            )}
          </>
        )}

        {/* Modal de Reseñas */}
        <Dialog open={isReviewsModalOpen} onOpenChange={setIsReviewsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
            <Card className="border-t-4 border-t-primary shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-green-600" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-800">Contactar por WhatsApp</DialogTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-blue-800 font-medium mb-1">Servicio de Contacto Premium</p>
                  <div className="text-3xl font-black text-blue-900">
                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(whatsappPrice)}
                  </div>
                  <p className="text-blue-600 text-xs mt-1">Pago único por cada contacto directo</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">Acceso inmediato al número de WhatsApp verificado.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">Chat directo sin intermediarios.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsPaidContactModalOpen(false)}
                    className="h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!pendingContactService) return;
                      try {
                        setIsPaidContactModalOpen(false);
                        toast.loading('Preparando pago...', { id: 'contact-payment' });

                        const response = await flowAPI.createContactPayment(
                          pendingContactService.user_id,
                          undefined, // postId no aplica aquí
                          pendingContactService.id // serviceId
                        );

                        if (response && response.url) {
                          toast.success('Redirigiendo a Flow...', { id: 'contact-payment' });
                          window.location.href = response.url;
                        } else {
                          throw new Error('No se recibió la URL de pago del servidor');
                        }
                      } catch (error: any) {
                        console.error('Error creating contact payment:', error);
                        toast.error(error.message || 'Error al procesar el pago', { id: 'contact-payment' });
                      }
                    }}
                    className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
                  >
                    Pagar y Chatear
                  </Button>
                </div>

                <p className="text-[10px] text-center text-gray-400">
                  Al continuar, aceptas nuestras políticas de servicio y cobro.
                </p>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Services;

