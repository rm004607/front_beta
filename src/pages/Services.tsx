import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Search, MessageCircle, Loader2, Plus, TrendingUp, DollarSign, Star } from 'lucide-react';
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

const Services = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchTerm, setSearchTerm] = useState('');
  const [comunaFilter, setComunaFilter] = useState('all');
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
  }, [searchTerm, comunaFilter]);

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

  const handleOpenReviews = async (service: any) => {
    setSelectedServiceForReviews(service);
    setIsReviewsModalOpen(true);
    setLoadingReviews(true);
    setUserRating(0);
    setUserComment('');

    try {
      const response = await reviewsAPI.getServiceReviews(service.id);
      setReviews(response.reviews);
      setReviewStats(response.stats);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoadingReviews(false);
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
      const response = await reviewsAPI.getServiceReviews(selectedServiceForReviews.id);
      setReviews(response.reviews);
      setReviewStats(response.stats);
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">Servicios</h1>
          <p className="text-muted-foreground">Encuentra profesionales y servicios en tu comuna</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {(user?.roles.includes('entrepreneur') || user?.roles.includes('super-admin')) && (
            <Link to="/servicios/publicar">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground hover-gold-glow transition-all duration-300 w-full sm:w-auto">
                <Plus size={18} className="mr-2" />
                Publicar Servicio
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={comunaFilter} onValueChange={setComunaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Comuna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las comunas</SelectItem>
                <SelectItem value="santiago">Santiago Centro</SelectItem>
                <SelectItem value="providencia">Providencia</SelectItem>
                <SelectItem value="lascondes">Las Condes</SelectItem>
                <SelectItem value="maipu">Maipú</SelectItem>
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
              <Card
                key={service.id}
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
                      <AvatarFallback className="text-xl font-heading bg-secondary text-white">
                        {service.user_name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl mb-1">{service.user_name}</CardTitle>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold text-yellow-700">
                            {service.average_rating ? Number(service.average_rating).toFixed(1) : '5.0'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">{service.service_name}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-secondary" />
                        <span>{service.comuna}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-yellow-700">
                          {service.average_rating ? Number(service.average_rating).toFixed(1) : '5.0'}
                        </span>
                        <span className="text-[10px]">({service.reviews_count || 0} reseñas)</span>
                      </div>
                    </div>
                    {service.price_range && (
                      <div className="text-sm font-semibold text-primary">
                        {service.price_range}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50 transition-all duration-300"
                      onClick={() => handleOpenReviews(service)}
                    >
                      <Star size={16} className="mr-2 fill-yellow-400 text-yellow-400" />
                      Reseñas ({service.reviews_count || 0})
                    </Button>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover-gold-glow transition-all duration-300"
                      onClick={() => handleWhatsApp(service)}
                      disabled={!service.phone}
                    >
                      <MessageCircle size={16} className="mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Star className="fill-yellow-400 text-yellow-400" />
              Reseñas de {selectedServiceForReviews?.user_name}
            </DialogTitle>
            <DialogDescription>
              {selectedServiceForReviews?.service_name}
            </DialogDescription>
          </DialogHeader>

          {reviewStats && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-yellow-800 font-medium">Calificación Promedio</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-yellow-900">{Number(reviewStats.average_rating).toFixed(1)}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= Math.round(reviewStats.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-yellow-800 font-medium">Total de Reseñas</p>
                <p className="text-2xl font-bold text-yellow-900">{reviewStats.total_reviews}</p>
              </div>
            </div>
          )}

          {/* Formulario para dejar reseña */}
          {isLoggedIn && user?.id !== selectedServiceForReviews?.user_id && (
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
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="w-full"
              >
                {isSubmittingReview ? <Loader2 className="animate-spin" /> : 'Publicar Reseña'}
              </Button>
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
  );
};

export default Services;

