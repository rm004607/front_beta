import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase, Wrench, Building2, MessageSquare, ArrowRight, MapPin,
  Calendar, DollarSign, Clock, Star, Users, ShoppingBag,
  ChefHat, Truck, HeartPulse, Lightbulb, ShieldCheck, Sparkles,
  Paintbrush, Camera, Scissors, Laptop, Hammer, Music,
  Car, Home as HomeIcon, Phone
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { servicesAPI } from '@/lib/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import logoFull from '/logo nombre.png';

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
  type_name?: string;
  type_icon?: string;
}

const Home = () => {
  const { isLoggedIn, user } = useUser();
  const { t, i18n } = useTranslation();
  const [latestServices, setLatestServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    loadLatestServices();
    loadServiceTypes();
  }, [isLoggedIn, user?.region_id]);

  const loadServiceTypes = async () => {
    try {
      setLoadingTypes(true);
      const response = await servicesAPI.getServiceTypes();
      // Tomamos solo los primeros 8 para mantener el diseño
      setServiceTypes(response.types.slice(0, 8));
    } catch (error) {
      console.error('Error loading service types:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadLatestServices = async () => {
    try {
      setLoadingServices(true);
      const response = await servicesAPI.getServices({
        page: 1,
        limit: 6,
        region_id: user?.region_id ? String(user.region_id) : undefined
      });
      setLatestServices(response.services);
    } catch (error) {
      console.error('Error loading latest services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const getServiceIcon = (name: string, iconName?: string) => {
    // Si viene un nombre de icono desde la API, intentamos usarlo
    if (iconName) {
      const n = iconName;
      if (n === 'Wrench') return <Wrench />;
      if (n === 'Lightbulb') return <Lightbulb />;
      if (n === 'ShieldCheck') return <ShieldCheck />;
      if (n === 'Sparkles') return <Sparkles />;
      if (n === 'Building2') return <Building2 />;
      if (n === 'Truck') return <Truck />;
      if (n === 'HeartPulse') return <HeartPulse />;
      if (n === 'Briefcase') return <Briefcase />;
      if (n === 'Paintbrush') return <Paintbrush />;
      if (n === 'Hammer') return <Hammer />;
      if (n === 'Scissors') return <Scissors />;
      if (n === 'Camera') return <Camera />;
      if (n === 'Laptop') return <Laptop />;
      if (n === 'ShoppingBag') return <ShoppingBag />;
      if (n === 'ChefHat') return <ChefHat />;
      if (n === 'Music') return <Music />;
      if (n === 'Car') return <Car />;
      if (n === 'Home') return <HomeIcon />;
      if (n === 'Phone') return <Phone />;
    }

    // Fallback: Mapeo basado en nombre (como estaba antes)
    const n = name.toLowerCase();
    if (n.includes('gasfiter') || n.includes('plomero')) return <Wrench />;
    if (n.includes('electri')) return <Lightbulb />;
    if (n.includes('cerrajer')) return <ShieldCheck />;
    if (n.includes('limpieza') || n.includes('aseo')) return <Sparkles />;
    if (n.includes('construc') || n.includes('albañil')) return <Building2 />;
    if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return <Truck />;
    if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return <HeartPulse />;
    if (n.includes('mecanic')) return <Briefcase />;
    return <Wrench />; // Default icon
  };

  const getServiceColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('gasfiter') || n.includes('plomero')) return 'bg-blue-500';
    if (n.includes('electri')) return 'bg-amber-500';
    if (n.includes('cerrajer')) return 'bg-slate-700';
    if (n.includes('limpieza') || n.includes('aseo')) return 'bg-emerald-500';
    if (n.includes('construc') || n.includes('albañil')) return 'bg-orange-600';
    if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return 'bg-purple-500';
    if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return 'bg-rose-500';
    if (n.includes('mecanic')) return 'bg-indigo-600';
    return 'bg-primary'; // Default color
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return t('common.today');
      if (diffDays === 1) return t('common.yesterday');
      if (diffDays < 7) return `${t('common.ago')} ${diffDays} ${t('common.days')}`;

      const locale = i18n.language === 'en' ? 'en-US' : 'es-CL';
      return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-mesh">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Animated Background Elements - More subtle for Light Mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-primary/[0.03] blur-[80px] md:blur-[120px] rounded-full animate-pulse-subtle"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-secondary/[0.03] blur-[80px] md:blur-[120px] rounded-full animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl mx-auto lg:mx-0">
              {/* Logo de Marca - Visible en todo dispositivo */}
              <div className="flex justify-center lg:justify-start mb-8 sm:mb-12">
                <img
                  src={logoFull}
                  alt="Dameldato"
                  className="h-32 sm:h-48 lg:h-64 w-auto object-contain animate-reveal drop-shadow-lg"
                />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold animate-reveal">
                <ShieldCheck size={16} />
                {t('hero.verified_community')}
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-extrabold leading-[1.1] tracking-tight animate-reveal delay-100 break-words">
                {t('hero.title_part1')} <span className="inline sm:hidden"><br /></span>
                <span className="text-primary text-glow">{t('hero.title_part2')}</span>
              </h1>

              <p className="text-muted-foreground font-medium text-lg md:text-xl animate-reveal delay-200 leading-relaxed">
                {t('hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-reveal delay-300">
                {!isLoggedIn ? (
                  <>
                    <Link to="/registro">
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-7 text-lg rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto h-auto">
                        {t('hero.join_now')}
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="outline" size="lg" className="border-2 border-primary/30 bg-background/50 hover:bg-primary/5 hover:border-primary/50 font-bold px-8 py-7 text-lg rounded-xl w-full sm:w-auto h-auto transition-all">
                        {t('nav.login')}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/servicios">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-7 text-lg rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto h-auto">
                      {t('hero.explore_services')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Right Content - Visual */}
            <div className="flex-1 relative animate-reveal delay-500">
              <div className="relative z-10 w-full max-w-[650px] mx-auto">
                <div className="relative aspect-square rounded-[3rem] bg-gradient-to-br from-primary/5 to-secondary/5 p-1 animate-float">
                  <div className="absolute inset-0 bg-mesh opacity-20 rounded-[3rem]"></div>
                  <div className="w-full h-full glass-card rounded-[3rem] flex items-center justify-center p-8 overflow-hidden group border-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <img
                      src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop"
                      alt="Dameldato Comunidad"
                      className="w-full h-full object-cover drop-shadow-xl scale-110 group-hover:scale-125 transition-transform duration-700"
                    />
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 glass-card p-3 sm:p-4 rounded-2xl animate-float shadow-xl flex items-center gap-2 sm:gap-3 border-primary/20" style={{ animationDelay: '1s' }}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success rounded-full flex items-center justify-center text-white">
                    <Star size={16} fill="currentColor" className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Calidad</p>
                    <p className="font-bold text-xs sm:text-sm">Expertos 5⭐</p>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 glass-card p-3 sm:p-4 rounded-2xl animate-float shadow-xl flex items-center gap-2 sm:gap-3 border-secondary/20" style={{ animationDelay: '2s' }}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-full flex items-center justify-center text-white">
                    <MapPin size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Ubicuidad</p>
                    <p className="font-bold text-xs sm:text-sm">Tu Comuna</p>
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
          <h2 className="text-4xl font-heading font-extrabold animate-reveal">{t('home.categories_title')}</h2>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto animate-reveal delay-100">
            {t('home.categories_desc')}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {loadingTypes ? (
            // Skeleton for categories
            [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-40 rounded-3xl bg-muted animate-pulse"></div>
            ))
          ) : (
            serviceTypes.map((type, i) => (
              <Link
                key={type.id}
                to={`/servicios?type_id=${type.id}`}
                className="group glass-card p-6 rounded-3xl hover:scale-105 transition-all duration-300 border-transparent hover:border-primary/30 animate-reveal"
                style={{ animationDelay: `${100 * (i + 1)}ms` }}
              >
                <div className={`${getServiceColor(type.name)} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  {getServiceIcon(type.name, type.icon)}
                </div>
                <h3 className="font-bold text-lg">{type.name}</h3>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Main Actions - Re-styled as Feature Highlights */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pared de Pegas */}
            <Link to="/muro" className="group animate-reveal">
              <div className="relative overflow-hidden bg-white dark:bg-card border-none rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-10 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col items-center lg:items-start text-center lg:text-left shadow-xl shadow-primary/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] -z-0"></div>
                <div className="bg-primary w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 sm:mb-8 shadow-xl shadow-primary/20 group-hover:rotate-12 transition-transform relative z-10">
                  <MessageSquare className="text-white w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-extrabold mb-4 relative z-10">{t('home.wall_title')}</h3>
                <p className="text-muted-foreground text-base sm:text-lg relative z-10 mb-6">{t('home.wall_desc')}</p>
                <div className="text-primary font-bold p-0 text-lg group-hover:translate-x-2 transition-transform flex items-center mt-auto">
                  {t('home.wall_cta')} <ArrowRight className="ml-2" />
                </div>
              </div>
            </Link>

            {/* Ofrecer Servicio */}
            <Link to={isLoggedIn ? "/servicios/publicar" : "/servicios"} className="group animate-reveal delay-200">
              <div className="relative overflow-hidden bg-white dark:bg-card border-none rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-10 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col items-center lg:items-start text-center lg:text-left shadow-xl shadow-secondary/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-[100px] -z-0"></div>
                <div className="bg-secondary w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 sm:mb-8 shadow-xl shadow-secondary/20 group-hover:-rotate-12 transition-transform relative z-10">
                  <Briefcase className="text-white w-8 h-8 sm:w-9 sm:h-9" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-extrabold mb-4 relative z-10">{t('home.offer_title')}</h3>
                <p className="text-muted-foreground text-base sm:text-lg relative z-10 mb-6">{t('home.offer_desc')}</p>
                <div className="text-secondary font-bold p-0 text-lg group-hover:translate-x-2 transition-transform flex items-center mt-auto">
                  {t('home.offer_cta')} <ArrowRight className="ml-2" />
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
                {t('home.new_talents')}
              </h2>
              <p className="text-muted-foreground mt-2">{t('home.new_talents_desc')}</p>
            </div>
            <Link to="/servicios" className="animate-reveal delay-200">
              <Button variant="outline" className="border-2 rounded-xl h-14 px-8 font-bold hover:bg-primary hover:text-white hover:border-primary transition-all">
                {t('home.view_all')}
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
                      <CardTitle className="text-2xl font-extrabold mb-2 line-clamp-1 group-hover:text-primary transition-colors flex items-center gap-2">
                        <div className="shrink-0 p-1 bg-primary/10 rounded-lg text-primary">
                          {getServiceIcon(service.service_name || service.type_name || '', service.type_icon)}
                        </div>
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
            <h2 className="text-4xl font-heading font-extrabold animate-reveal">{t('home.how_it_works')}</h2>
            <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto animate-reveal delay-100">
              {t('home.how_it_works_desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-1 border-t-2 border-dashed border-primary/20 -translate-y-[80px]"></div>

            <div className="text-center animate-reveal relative group">
              <div className="bg-primary text-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30 text-3xl font-bold rotate-6 group-hover:rotate-0 transition-transform">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">{t('home.step1_title')}</h3>
              <p className="text-muted-foreground text-lg">{t('home.step1_desc')}</p>
            </div>

            <div className="text-center animate-reveal delay-200 relative group">
              <div className="bg-secondary text-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-secondary/30 text-3xl font-bold -rotate-6 group-hover:rotate-0 transition-transform">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">{t('home.step2_title')}</h3>
              <p className="text-muted-foreground text-lg">{t('home.step2_desc')}</p>
            </div>

            <div className="text-center animate-reveal delay-500 relative group">
              <div className="bg-accent text-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-accent/30 text-3xl font-bold rotate-12 group-hover:rotate-0 transition-transform">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">{t('home.step3_title')}</h3>
              <p className="text-muted-foreground text-lg">{t('home.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden bg-white dark:bg-transparent">
        <div className="absolute inset-0 bg-primary opacity-[0.03]"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="glass-card max-w-4xl mx-auto p-12 md:p-20 rounded-[4rem] border-primary/10 shadow-primary/10">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-8">{t('home.final_cta_title')}</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              {t('home.final_cta_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to={isLoggedIn ? "/servicios" : "/registro"}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-8 text-xl rounded-2xl shadow-2xl shadow-primary/20 transition-all hover:scale-105 w-full sm:w-auto">
                  {isLoggedIn ? t('hero.explore_services') : t('home.final_cta_btn')}
                </Button>
              </Link>
              <Link to="/muro">
                <Button variant="outline" size="lg" className="border-2 border-primary/20 bg-background/50 hover:bg-primary/5 hover:border-primary/40 font-bold px-10 py-8 text-xl rounded-2xl w-full sm:w-auto h-auto transition-all">
                  {t('wall.title')}
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
