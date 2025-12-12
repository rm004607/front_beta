import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Search, MessageCircle, Loader2, Plus, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { servicesAPI, aiAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { Label } from '@/components/ui/label';
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
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; cards?: any[] }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    loadServices();
  }, [searchTerm, comunaFilter]);

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

  const handleSendChatMessage = async () => {
    if (!currentMessage.trim()) {
      return;
    }

    const userMessage = currentMessage.trim();
    setCurrentMessage('');

    // Agregar mensaje del usuario al chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSendingMessage(true);

    try {
      const response = await aiAPI.chatAboutServices(userMessage);

      // Agregar respuesta de la IA al chat
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        cards: response.recommendations || []
      }]);
    } catch (error: any) {
      console.error('Error chatting with AI:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.'
      }]);
      toast.error(error.message || 'Error al procesar tu mensaje');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleOpenChatModal = () => {
    setShowChatModal(true);
    // Mensaje inicial de la IA
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'assistant',
        content: '¡Hola! 👋 Cuéntame, ¿qué servicio necesitas? Puedo ayudarte a encontrar los proveedores más capacitados para lo que buscas.'
      }]);
    }
  };

  const handleWhatsApp = (phone: string, name: string, service: string) => {
    // Verificar si el usuario está logueado
    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para contactar por WhatsApp');
      navigate('/login');
      return;
    }

    if (!phone) {
      toast.error('Este servicio no tiene número de teléfono disponible');
      return;
    }
    const message = encodeURIComponent(`Hola ${name}, te contacto desde Beta por tu servicio de ${service}`);
    const phoneNumber = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">Servicios y Emprendedores</h1>
          <p className="text-muted-foreground">Encuentra profesionales y servicios en tu comuna</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {isLoggedIn && (
            <Button
              variant="outline"
              onClick={handleOpenChatModal}
              disabled={isSendingMessage}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 w-full sm:w-auto"
            >
              {isSendingMessage ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <MessageCircle size={18} className="mr-2" />
                  Chatear con IA
                </>
              )}
            </Button>
          )}
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
                      <CardTitle className="text-xl mb-1">{service.user_name}</CardTitle>
                      <Badge variant="secondary">{service.service_name}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-secondary" />
                      <span>{service.comuna}</span>
                    </div>
                    {service.price_range && (
                      <div className="text-sm font-semibold text-primary">
                        {service.price_range}
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hover-gold-glow transition-all duration-300"
                    onClick={() => handleWhatsApp(service.phone || '', service.user_name, service.service_name)}
                    disabled={!service.phone}
                  >
                    <MessageCircle size={16} className="mr-2" />
                    {!isLoggedIn
                      ? 'Inicia sesión para contactar'
                      : service.phone
                        ? 'Contactar por WhatsApp'
                        : 'Sin teléfono'}
                  </Button>
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

      {/* Modal de Recomendaciones de IA */}
      <Dialog open={showAIRecommendations} onOpenChange={setShowAIRecommendations}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-accent" />
              Recomendaciones de IA para Ti
            </DialogTitle>
            <DialogDescription>
              Servicios recomendados basados en tu CV con alta compatibilidad (90%+)
            </DialogDescription>
          </DialogHeader>

          {aiRecommendations && (
            <div className="space-y-4">
              {/* Resumen del análisis */}
              {aiRecommendations.cv_analysis && (
                <Card className="bg-gradient-to-r from-accent/10 to-accent/20 dark:from-accent/10 dark:to-accent/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Análisis de tu CV</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiRecommendations.cv_analysis.rubro && (
                      <p className="mb-2"><strong>Rubro:</strong> {aiRecommendations.cv_analysis.rubro}</p>
                    )}
                    {aiRecommendations.cv_analysis.habilidades && aiRecommendations.cv_analysis.habilidades.length > 0 && (
                      <div>
                        <strong>Habilidades detectadas:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {aiRecommendations.cv_analysis.habilidades.slice(0, 10).map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Estadísticas */}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Total analizado: {aiRecommendations.total_analyzed}</span>
                <span>•</span>
                <span className="text-green-600 font-semibold">Alta compatibilidad: {aiRecommendations.high_matches}</span>
              </div>

              {/* Lista de recomendaciones */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiRecommendations.recommendations.map((rec: any) => (
                  <Card key={rec.service.id} className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          {rec.service.user_name && (
                            <AvatarFallback className="text-lg font-heading bg-secondary text-white">
                              {rec.service.user_name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{rec.service.service_name}</CardTitle>
                            <Badge
                              variant={rec.match_score >= 90 ? "default" : rec.match_score >= 80 ? "secondary" : "outline"}
                              className="bg-green-500 text-white text-xs"
                            >
                              {rec.match_score}%
                            </Badge>
                          </div>
                          <CardDescription>{rec.service.user_name}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{rec.service.description.substring(0, 100)}...</p>

                      {/* Detalles del match */}
                      {rec.match_details && (
                        <div className="space-y-2 pt-2 border-t">
                          {rec.match_details.tipo && (
                            <Badge variant="outline" className="text-xs">
                              {rec.match_details.tipo === 'puede_ofrecer' ? 'Puedes ofrecer' :
                                rec.match_details.tipo === 'necesita' ? 'Necesitas' : 'No relacionado'}
                            </Badge>
                          )}
                          {rec.match_details.razones && rec.match_details.razones.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-green-600 mb-1">Razones:</p>
                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                {rec.match_details.razones.slice(0, 2).map((razon: string, i: number) => (
                                  <li key={i}>{razon}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-secondary" />
                          <span>{rec.service.comuna}</span>
                        </div>
                        {rec.service.price_range && (
                          <div className="text-sm font-semibold text-primary">
                            {rec.service.price_range}
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full mt-4 bg-secondary hover:bg-secondary/90"
                        onClick={() => handleWhatsApp(rec.service.phone || '', rec.service.user_name, rec.service.service_name)}
                        disabled={!rec.service.phone}
                      >
                        <MessageCircle size={16} className="mr-2" />
                        {rec.service.phone ? 'Contactar por WhatsApp' : 'Sin teléfono'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {aiRecommendations.recommendations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No se encontraron servicios con alta compatibilidad. Intenta actualizar tu CV o busca manualmente.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Chat con IA para Servicios */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="text-accent" />
              Chat con IA - Encuentra tu Servicio
            </DialogTitle>
            <DialogDescription>
              Cuéntame qué servicio necesitas y te ayudaré a encontrar los proveedores más capacitados
            </DialogDescription>
          </DialogHeader>

          {/* Area de mensajes */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {/* Tarjetas de servicios recomendados */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.cards.map((service: any) => (
                        <Card key={service.id} className="bg-background">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{service.service_name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {service.user_name} • {service.comuna}
                                </p>
                                {service.price_range && (
                                  <p className="text-xs font-medium text-primary mt-1">{service.price_range}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhatsApp(service.phone, service.user_name, service.service_name)}
                                className="text-xs"
                              >
                                <MessageCircle size={12} className="mr-1" />
                                Contactar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSendingMessage && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input para enviar mensajes */}
          <div className="px-6 py-4 border-t">
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
                placeholder="Describe qué servicio necesitas..."
                disabled={isSendingMessage}
                className="flex-1"
              />
              <Button
                onClick={handleSendChatMessage}
                disabled={isSendingMessage || !currentMessage.trim()}
                className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground"
              >
                {isSendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
