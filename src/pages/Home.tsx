import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Wrench, Building2, MessageSquare, ArrowRight, MapPin, Calendar, DollarSign, Clock, Star } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { servicesAPI } from '@/lib/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import logoDameldato from '/logoicono.png';


interface Service {
  id: string;
  service_name: string;
  description: string;
  comuna: string;
  price_range?: string;
  created_at: string;
  user_name: string;
  profile_image?: string;
  average_rating?: number;
  reviews_count?: number;
}

const Home = () => {
  const { isLoggedIn } = useUser();
  const [latestServices, setLatestServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    loadLatestServices();
  }, []);


  const loadLatestServices = async () => {
    try {
      setLoadingServices(true);
      const response = await servicesAPI.getServices({ page: 1, limit: 6 });
      setLatestServices(response.services);
    } catch (error) {
      console.error('Error loading latest services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-beta-black py-16 md:py-24 overflow-hidden">
        {/* Background Abstract Lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-beta-black/80 to-beta-black"></div>
          <svg className="absolute w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.2" className="animate-pulse" />
            <path d="M0,70 Q25,50 50,70 T100,70" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.1" />
            <path d="M50,0 Q70,50 50,100" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.2" className="opacity-50" />
            <circle cx="80" cy="50" r="30" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.1" className="opacity-20" />
          </svg>
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            {/* Left Content */}
            <div className="animate-fade-in-up text-left space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-bold leading-tight tracking-tight bg-gradient-to-r from-primary via-primary/90 to-accent text-transparent bg-clip-text">
                Conectamos <br />
                Talento y <br />
                Oportunidades
              </h1>
              <p className="text-beta-gray-light/80 text-base sm:text-lg md:text-xl max-w-xl font-light leading-relaxed">
                La plataforma que une a personas que buscan trabajo, empresas que contratan y emprendedores que ofrecen servicios.
              </p>
              {!isLoggedIn ? (
                <Link to="/registro">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
                  >
                    Explorar servicios
                  </Button>
                </Link>
              ) : (
                <Link to="/servicios">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
                  >
                    Explorar servicios
                  </Button>
                </Link>
              )}
            </div>

            {/* Right Content - Brand Logo */}
            <div className="relative animate-fade-in delay-200 flex justify-center items-center h-full">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-[26rem] md:h-[26rem]">
                {/* Outer Circles */}
                <div className="absolute inset-0 rounded-full border border-primary/30 animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-4 rounded-full border border-primary/20 animate-[spin_15s_linear_infinite_reverse]"></div>

                {/* Glowing Backdrop */}
                <div className="absolute inset-0 bg-primary/12 blur-3xl rounded-full"></div>

                {/* Logo Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-60 h-60 sm:w-72 sm:h-72 md:w-[22rem] md:h-[22rem] rounded-full border-2 border-primary flex items-center justify-center bg-beta-black shadow-2xl ring-1 ring-primary/15 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <img
                      src={logoDameldato}
                      alt="Dameldato"
                      className="w-48 h-48 sm:w-56 sm:h-56 md:w-[18rem] md:h-[18rem] object-contain drop-shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Actions */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold text-center mb-12 animate-fade-in">¿Qué estás buscando?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Pared de Pegas */}
          <Link to="/muro" className="group animate-fade-in-up delay-200">
            <div className="bg-card border-2 border-border rounded-2xl p-8 text-center hover:border-primary hover:shadow-xl transition-all group-hover:-translate-y-2 duration-300 h-full flex flex-col items-center justify-center">
              <div className="bg-primary/15 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shadow-sm ring-1 ring-primary/20">
                <MessageSquare className="text-primary group-hover:text-white transition-colors" size={42} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-3">Pared de Pegas</h3>
              <p className="text-muted-foreground">Avisos rápidos de trabajo</p>
            </div>
          </Link>

          {/* Ofrecer Servicio/Pymes */}
          <Link to="/servicios/publicar" className="group animate-fade-in-up delay-300">
            <div className="bg-card border-2 border-border rounded-2xl p-8 text-center hover:border-primary hover:shadow-xl transition-all group-hover:-translate-y-2 duration-300 h-full flex flex-col items-center justify-center">
              <div className="bg-primary/15 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shadow-sm ring-1 ring-primary/20">
                <Wrench className="text-primary group-hover:text-white transition-colors" size={42} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-3">Ofrecer Servicio</h3>
              <p className="text-muted-foreground">Promociona tu servicio</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Últimos Anuncios */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">

          {/* Últimos Servicios/Pymes */}
          <div className="animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-heading font-bold flex items-center gap-3">
                <Wrench className="text-primary" size={32} />
                Últimos Servicios
              </h2>
              <Link to="/servicios">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Ver todos
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>

            {loadingServices ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando servicios...</p>
              </div>
            ) : latestServices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No hay servicios disponibles aún</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {latestServices.map((service) => (
                  <Link key={service.id} to={`/servicios`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{service.service_name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  {service.profile_image && (
                                    <AvatarImage src={service.profile_image} alt={service.user_name} />
                                  )}
                                  <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                                    {service.user_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{service.user_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>{service.comuna}</span>
                              </div>
                              {service.price_range && (
                                <div className="flex items-center gap-1">
                                  <DollarSign size={14} />
                                  <span>{service.price_range}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 border-l pl-3 ml-2 border-muted-foreground/30">
                                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-yellow-700">
                                  {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  ({service.reviews_count || 0} reseñas)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            <span>{formatDate(service.created_at)}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            Ver detalles
                            <ArrowRight size={14} className="ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-12 animate-fade-in">¿Por qué Dameldato?</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center animate-fade-in-up delay-100">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ring-1 ring-primary/20">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">Local y Cercano</h3>
              <p className="text-muted-foreground">Encuentra oportunidades en tu propia comuna</p>
            </div>

            <div className="text-center animate-fade-in-up delay-200">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ring-1 ring-primary/20">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">Rápido y Fácil</h3>
              <p className="text-muted-foreground">Regístrate y comienza en minutos</p>
            </div>

            <div className="text-center animate-fade-in-up delay-300">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ring-1 ring-primary/20">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-lg font-heading font-semibold mb-2">Comunidad Activa</h3>
              <p className="text-muted-foreground">Conecta directamente con empresas y personas</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
