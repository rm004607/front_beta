import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase, Wrench, Building2, MessageSquare, ArrowRight, MapPin,
  Calendar, DollarSign, Clock, Star, Users, ShoppingBag,
  ChefHat, Truck, HeartPulse, Lightbulb, ShieldCheck
} from 'lucide-react';
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
    <div className="min-h-screen bg-mesh">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse-subtle"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold animate-reveal">
                <ShieldCheck size={16} />
                Comunidad 100% Verificada
              </div>

              <h1 className="text-5xl md:text-7xl font-sans font-extrabold leading-[1.1] tracking-tight animate-reveal delay-100">
                Tu Vecindario, <br />
                <span className="text-primary text-glow">Mejor Conectado</span>
              </h1>

              <p className="text-muted-foreground text-lg md:text-xl animate-reveal delay-200 leading-relaxed">
                Únete a la plataforma donde los vecinos ofrecen sus talentos y encuentran soluciones cercanas, rápidas y confiables.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-reveal delay-300">
                {!isLoggedIn ? (
                  <>
                    <Link to="/registro">
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-7 text-lg rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto h-auto">
                        Únete Ahora
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="outline" size="lg" className="border-2 font-bold px-8 py-7 text-lg rounded-xl w-full sm:w-auto h-auto">
                        Iniciar Sesión
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/servicios">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-7 text-lg rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto h-auto">
                      Explorar Servicios
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Right Content - Visual */}
            <div className="flex-1 relative animate-reveal delay-500">
              <div className="relative z-10 w-full max-w-[500px] mx-auto">
                <div className="relative aspect-square rounded-[3rem] bg-gradient-to-br from-primary/20 to-secondary/20 p-1 animate-float">
                  <div className="absolute inset-0 bg-mesh opacity-50 rounded-[3rem]"></div>
                  <div className="w-full h-full glass-card rounded-[3rem] flex items-center justify-center p-8 overflow-hidden group border-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <img
                      src={logoDameldato}
                      alt="Dameldato"
                      className="w-full h-full object-contain drop-shadow-2xl scale-110 group-hover:scale-125 transition-transform duration-700"
                    />
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 glass-card p-4 rounded-2xl animate-float shadow-xl flex items-center gap-3 border-primary/20" style={{ animationDelay: '1s' }}>
                  <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-white">
                    <Star size={20} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Calidad</p>
                    <p className="font-bold text-sm">Vecinos 5⭐</p>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl animate-float shadow-xl flex items-center gap-3 border-secondary/20" style={{ animationDelay: '2s' }}>
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ubicuidad</p>
                    <p className="font-bold text-sm">Tu Comuna</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-heading font-extrabold animate-reveal">Explora por Categoría</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-reveal delay-100">
            Encuentra exactamente lo que necesitas, desde servicios para el hogar hasta consultoría profesional.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: <ShoppingBag />, label: 'Comercio', color: 'bg-rose-500' },
            { icon: <Wrench />, label: 'Reparaciones', color: 'bg-amber-500' },
            { icon: <ChefHat />, label: 'Gastronomía', color: 'bg-orange-500' },
            { icon: <Users />, label: 'Clases', color: 'bg-blue-500' },
            { icon: <HeartPulse />, label: 'Salud', color: 'bg-emerald-500' },
            { icon: <Truck />, label: 'Fletes', color: 'bg-purple-500' },
            { icon: <Building2 />, label: 'Empresas', color: 'bg-indigo-500' },
            { icon: <Lightbulb />, label: 'Consultoría', color: 'bg-teal-500' },
          ].map((cat, i) => (
            <div key={i} className="group glass-card p-6 rounded-3xl hover:scale-105 transition-all duration-300 border-transparent hover:border-primary/30 animate-reveal" style={{ animationDelay: `${100 * (i + 1)}ms` }}>
              <div className={`${cat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                {cat.icon}
              </div>
              <h3 className="font-bold text-lg">{cat.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">Ver servicios</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Actions - Re-styled as Feature Highlights */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pared de Pegas */}
            <Link to="/muro" className="group animate-reveal">
              <div className="relative overflow-hidden bg-white dark:bg-card border-none rounded-[3.5rem] p-10 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col items-center lg:items-start text-center lg:text-left shadow-xl shadow-primary/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] -z-0"></div>
                <div className="bg-primary w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-primary/20 group-hover:rotate-12 transition-transform relative z-10">
                  <MessageSquare className="text-white" size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-heading font-extrabold mb-4 relative z-10">Muro de Datos</h3>
                <p className="text-muted-foreground text-lg relative z-10 mb-6">¿Necesitas algo rápido? Publica tu anuncio o revisa lo que tus vecinos necesitan hoy mismo.</p>
                <div className="text-primary font-bold p-0 text-lg group-hover:translate-x-2 transition-transform flex items-center">
                  Entrar al Muro <ArrowRight className="ml-2" />
                </div>
              </div>
            </Link>

            {/* Ofrecer Servicio */}
            <Link to="/servicios/publicar" className="group animate-reveal delay-200">
              <div className="relative overflow-hidden bg-white dark:bg-card border-none rounded-[3.5rem] p-10 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col items-center lg:items-start text-center lg:text-left shadow-xl shadow-secondary/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-[100px] -z-0"></div>
                <div className="bg-secondary w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-secondary/20 group-hover:-rotate-12 transition-transform relative z-10">
                  <Briefcase className="text-white" size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-3xl font-heading font-extrabold mb-4 relative z-10">Ofrecer Servicios</h3>
                <p className="text-muted-foreground text-lg relative z-10 mb-6">Pon tu talento a disposición de tu comuna. Crea tu perfil profesional y empieza a recibir pedidos ahora.</p>
                <div className="text-secondary font-bold p-0 text-lg group-hover:translate-x-2 transition-transform flex items-center">
                  Empezar a Ofrecer <ArrowRight className="ml-2" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Últimos Anuncios */}
      <section className="py-24 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-heading font-extrabold flex items-center justify-center md:justify-start gap-4 animate-reveal">
                <div className="bg-primary/15 p-3 rounded-2xl">
                  <Star className="text-primary" size={32} fill="currentColor" />
                </div>
                Nuevos Talentos
              </h2>
              <p className="text-muted-foreground mt-2">Descubre los servicios más recientes en tu área.</p>
            </div>
            <Link to="/servicios" className="animate-reveal delay-200">
              <Button variant="outline" className="border-2 rounded-xl h-14 px-8 font-bold hover:bg-primary hover:text-white hover:border-primary transition-all">
                Ver Todo el Directorio
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[300px] rounded-[2.5rem] bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : latestServices.length === 0 ? (
            <div className="glass-card p-12 rounded-[3.5rem] text-center border-dashed border-2">
              <p className="text-xl text-muted-foreground">Estamos creciendo... ¡Sé el primero en ofrecer un servicio!</p>
              <Link to="/servicios/publicar">
                <Button className="mt-6 bg-primary">Publicar Ahora</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestServices.map((service, i) => (
                <Link key={service.id} to={`/servicios`} className="animate-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                  <Card className="group h-full bg-card/40 backdrop-blur-sm border-2 border-transparent hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="w-14 h-14 border-2 border-primary/20 ring-4 ring-primary/5">
                          {service.profile_image && (
                            <AvatarImage src={service.profile_image} alt={service.user_name} />
                          )}
                          <AvatarFallback className="bg-primary text-white font-bold text-xl">
                            {service.user_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-lg line-clamp-1">{service.user_name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin size={14} className="text-primary" />
                            <span>{service.comuna}</span>
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-extrabold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {service.service_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex-1 flex flex-col">
                      <p className="text-muted-foreground text-lg line-clamp-2 mb-6 flex-1">
                        {service.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-primary/10">
                        <div className="flex items-center gap-2">
                          <Star size={18} className="fill-accent text-accent" />
                          <span className="font-bold text-lg">
                            {service.average_rating ? Number(service.average_rating).toFixed(1) : '5.0'}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Calendar size={14} />
                          <span>{formatDate(service.created_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works - Re-styled as Steps */}
      <section className="bg-mesh border-y border-primary/10 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-heading font-extrabold animate-reveal">¿Cómo funciona?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-reveal delay-100">
              Es muy sencillo conectar con tu comunidad en solo tres pasos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-1 border-t-2 border-dashed border-primary/20 -translate-y-[80px]"></div>

            <div className="text-center animate-reveal relative group">
              <div className="bg-primary text-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 text-3xl font-bold rotate-6 group-hover:rotate-0 transition-transform">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Crea tu Cuenta</h3>
              <p className="text-muted-foreground text-lg">Regístrate como vecino o emprendedor en menos de 2 minutos.</p>
            </div>

            <div className="text-center animate-reveal delay-200 relative group">
              <div className="bg-secondary text-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-secondary/30 text-3xl font-bold -rotate-6 group-hover:rotate-0 transition-transform">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Publica o Busca</h3>
              <p className="text-muted-foreground text-lg">Muestra tu talento o encuentra el servicio que necesitas cerca de ti.</p>
            </div>

            <div className="text-center animate-reveal delay-500 relative group">
              <div className="bg-accent text-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-accent/30 text-3xl font-bold rotate-12 group-hover:rotate-0 transition-transform">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">¡Listo!</h3>
              <p className="text-muted-foreground text-lg">Conecta directamente por chat o teléfono y resuelve tus necesidades.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden bg-white dark:bg-transparent">
        <div className="absolute inset-0 bg-primary opacity-[0.03]"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="glass-card max-w-4xl mx-auto p-12 md:p-20 rounded-[4rem] border-primary/10 shadow-primary/10">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-8">Empieza a trabajar con tus vecinos hoy</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Únete a miles de personas que ya están transformando su economía local.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/registro">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-8 text-xl rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-105 w-full sm:w-auto">
                  Crear Mi Cuenta Gratis
                </Button>
              </Link>
              <Link to="/muro">
                <Button variant="outline" size="lg" className="border-2 font-bold px-10 py-8 text-xl rounded-2xl w-full sm:w-auto h-auto">
                  Ver Muro de Pegas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
