import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Search, MessageCircle, Loader2, Plus, TrendingUp, DollarSign } from 'lucide-react';
import { servicesAPI } from '@/lib/api';
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
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">Servicios/Pymes y Emprendedores</h1>
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
    </div>
  );
};

export default Services;

