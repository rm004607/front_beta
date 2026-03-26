import { useState, useEffect, useRef, useLayoutEffect, useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase, Wrench, Building2, MessageSquare, ArrowRight, MapPin,
  Calendar, DollarSign, Clock, Star, Users, ShoppingBag,
  ChefHat, Truck, Lightbulb, ShieldCheck, Sparkles,
  Paintbrush, Camera, Scissors, Laptop, Hammer, Music,
  Car, Home as HomeIcon, Phone,
  Plug, PaintRoller, Flame, Utensils, Dumbbell, GraduationCap,
  Baby, Stethoscope, Globe, Database, Smartphone, Plane,
  Gift, Trophy, Coffee, Wallet, Trees, PawPrint, Flower2,
  Sun, Moon, Bike, Cpu, Mouse, Monitor, Cloud, Code,
  Languages, Book, School, HardHat, Construction, Drill,
  PlugZap, Waves, Zap, Ticket, Video, Mic, Smile, Gamepad2,
  Brush, Wind, Pill, Activity, Apple, Bone, Gem, Key,
  Anchor, Search, Settings, Bell, Navigation
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { servicesAPI, supportAPI } from '@/lib/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import logoFull from '/logo_nombre.webp';
import { getServiceIcon, getServiceColor, isLightColor, getServiceLocationDisplay } from '@/lib/serviceUtils';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  service_name: string;
  description: string;
  comuna: string;
  region_id?: string;
  region_name?: string;
  offer_region?: { id: string; name: string } | null;
  price_range?: string;
  created_at: string;
  user_name: string;
  profile_image?: string;
  average_rating?: number;
  reviews_count?: number;
  type_name?: string;
  type_icon?: string;
  type_color?: string;
  idicon?: string;
}

const Home = () => {
  const { isLoggedIn, user, isLoading: authLoading } = useUser();
  const { t, i18n } = useTranslation();
  const [latestServices, setLatestServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [latestCarouselIndex, setLatestCarouselIndex] = useState(0);
  const [latestItemsPerView, setLatestItemsPerView] = useState(3);

  const categoriesViewportRef = useRef<HTMLDivElement>(null);
  const categoriesTrackRef = useRef<HTMLDivElement>(null);
  const latestServicesRequestId = useRef(0);
  /** Pixels de scroll horizontal disponibles; 0 = no cabe carrusel, no animar */
  const [categoriesOverflowPx, setCategoriesOverflowPx] = useState(0);

  const categoriesScrollDuration = useMemo(() => {
    if (categoriesOverflowPx <= 0) return 32;
    return Math.min(55, Math.max(18, categoriesOverflowPx / 28));
  }, [categoriesOverflowPx]);

  useLayoutEffect(() => {
    if (loadingTypes || serviceTypes.length === 0) {
      setCategoriesOverflowPx(0);
      return;
    }

    const measure = () => {
      const vp = categoriesViewportRef.current;
      const track = categoriesTrackRef.current;
      if (!vp || !track) return;
      const dist = track.scrollWidth - vp.clientWidth;
      setCategoriesOverflowPx(dist > 8 ? dist : 0);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    if (categoriesViewportRef.current) ro.observe(categoriesViewportRef.current);
    if (categoriesTrackRef.current) ro.observe(categoriesTrackRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [loadingTypes, serviceTypes]);

  useEffect(() => {
    loadServiceTypes();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const requestId = ++latestServicesRequestId.current;
    setLoadingServices(true);

    (async () => {
      try {
        const response = await servicesAPI.getServices({
          page: 1,
          limit: 6,
          region_id: undefined,
        });
        if (cancelled || requestId !== latestServicesRequestId.current) return;
        setLatestServices(response.services);
      } catch (error) {
        if (cancelled || requestId !== latestServicesRequestId.current) return;
        console.error('Error loading latest services:', error);
      } finally {
        if (!cancelled && requestId === latestServicesRequestId.current) {
          setLoadingServices(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, user?.id, user?.region_id, user?.offer_region?.id, user?.role_number]);

  useEffect(() => {
    const computeItemsPerView = () => {
      if (typeof window === 'undefined') return 3;
      const w = window.innerWidth;
      if (w >= 1024) return 3; // lg
      if (w >= 768) return 2; // md
      return 1; // mobile
    };

    const update = () => setLatestItemsPerView(computeItemsPerView());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (loadingServices) return;
    const maxIndex = Math.max(0, latestServices.length - latestItemsPerView);
    if (maxIndex === 0) {
      setLatestCarouselIndex(0);
      return;
    }

    // Keep index in bounds when list or viewport changes
    setLatestCarouselIndex((prev) => Math.min(prev, maxIndex));

    const id = window.setInterval(() => {
      setLatestCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3000);

    return () => window.clearInterval(id);
  }, [latestServices.length, latestItemsPerView, loadingServices]);

  const loadServiceTypes = async () => {
    try {
      setLoadingTypes(true);
      const response = await servicesAPI.getServiceTypes({ onlyActive: true });
      setServiceTypes(response.types);
    } catch (error) {
      console.error('Error loading service types:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Estado para el formulario "Tienes un dato"
  const [tipForm, setTipForm] = useState({ title: '', description: '', phone: '' });
  const [isSubmittingTip, setIsSubmittingTip] = useState(false);

  const handleTipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipForm.title || !tipForm.phone) {
      toast.error('Por favor completa los campos obligatorios (Título y Teléfono)');
      return;
    }

    try {
      setIsSubmittingTip(true);
      
      const message = `
        Servicio: ${tipForm.title}
        Descripción: ${tipForm.description || 'Sin descripción'}
        Contacto: ${tipForm.phone}
      `.trim();

      await supportAPI.createTicket({
        subject: `Nuevo Dato: ${tipForm.title}`,
        message: message,
        category: 'recommendation'
      });
      
      toast.success('¡Gracias por tu dato! Lo revisaremos pronto.');
      setTipForm({ title: '', description: '', phone: '' });
    } catch (error) {
      console.error('Error submitting tip:', error);
      toast.error('Hubo un error al enviar el dato. Intenta más tarde.');
    } finally {
      setIsSubmittingTip(false);
    }
  };

  /** Tarjeta para el carrusel horizontal (1 fila, estilo limpio) */
  const CategoryCarouselCard = ({ type }: { type: any }) => (
    <Link
      to={`/servicios?type_id=${type.id}`}
      className="group/cat shrink-0 flex w-[132px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-white px-3 py-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md sm:w-[152px] sm:py-5"
    >
      <div
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover/cat:scale-105 sm:h-14 sm:w-14 sm:rounded-2xl ${isLightColor(type.color || getServiceColor(type.name)) ? 'text-slate-900' : 'text-white'}`}
        style={{ backgroundColor: type.color || getServiceColor(type.name) }}
      >
        {getServiceIcon(type.name, type.icon, type.idicon)}
      </div>
      <h3 className="text-center text-xs font-semibold leading-tight text-foreground transition-colors group-hover/cat:text-primary sm:text-sm">
        {type.name}
      </h3>
    </Link>
  );

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
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-mesh">
      {/* Hero Section */}
      <section className="relative py-8 sm:py-12 md:py-24 lg:py-32 overflow-hidden">
        {/* Animated Background Elements - More subtle for Light Mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-primary/[0.03] blur-[80px] md:blur-[120px] rounded-full animate-pulse-subtle"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] bg-secondary/[0.03] blur-[80px] md:blur-[120px] rounded-full animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-3 xs:px-4 sm:px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-20">
            {/* Left Content */}
            <div className="flex-1 min-w-0 w-full text-center lg:text-left space-y-5 sm:space-y-8 max-w-2xl mx-auto lg:mx-0">
              {/* Logo - escala por resolución */}
              <div className="flex justify-center lg:justify-start mb-2 sm:mb-8">
                <img
                  src={logoFull}
                  alt="Dameldato"
                  className="h-14 xs:h-20 sm:h-32 md:h-40 lg:h-56 xl:h-64 w-auto max-w-[85vw] object-contain animate-reveal drop-shadow-lg"
                />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-2 xs:px-4 xs:py-2.5 rounded-xl bg-sky-100 border border-sky-200/80 text-primary text-xs xs:text-sm font-semibold animate-reveal">
                <ShieldCheck size={14} className="xs:w-4 xs:h-4 shrink-0" />
                <span className="truncate">{t('hero.verified_community')}</span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sans font-extrabold leading-[1.2] tracking-tight animate-reveal delay-100 break-words">
                {t('hero.title_part1')} <span className="inline sm:hidden"><br /></span>
                <span className="text-primary text-glow">{t('hero.title_part2')}</span>
              </h1>

              <p className="text-muted-foreground font-medium text-sm xs:text-base sm:text-lg md:text-xl animate-reveal delay-200 leading-relaxed max-w-lg mx-auto lg:mx-0">
                La mejor plataforma para contactar talentos independientes en tu zona.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start animate-reveal delay-300">
                {!isLoggedIn ? (
                  <Button 
                    onClick={() => document.getElementById('entrepreneur-section')?.scrollIntoView({ behavior: 'smooth' })}
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-5 xs:px-6 sm:px-8 sm:py-7 text-base sm:text-lg rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto h-auto min-h-12"
                  >
                    {t('hero.offer_services_btn')}
                  </Button>
                ) : (
                  <Link to="/servicios/publicar">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-5 xs:px-6 sm:px-8 sm:py-7 text-base sm:text-lg rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto h-auto min-h-12">
                      {t('home.final_cta_btn')}
                    </Button>
                  </Link>
                )}
                <Link to="/servicios" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="border-2 border-primary/30 bg-background/50 hover:bg-primary/5 hover:border-primary/50 font-bold px-5 py-5 xs:px-6 sm:px-8 sm:py-7 text-base sm:text-lg rounded-xl w-full h-auto min-h-12 transition-all">
                    {t('hero.explore_services')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Visual: se adapta al ancho */}
            <div className="flex-1 w-full min-w-0 relative animate-reveal delay-500">
              <div className="relative z-10 w-full max-w-full lg:max-w-[650px] mx-auto">
                <div className="relative aspect-square rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-primary/5 to-secondary/5 p-1 animate-float">
                  <div className="absolute inset-0 bg-mesh opacity-20 rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem]"></div>
                  <div className="w-full h-full glass-card rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden group border-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <img
                      src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop"
                      alt="Dameldato Comunidad"
                      className="w-full h-full object-cover drop-shadow-xl scale-110 group-hover:scale-125 transition-transform duration-700"
                    />
                  </div>
                </div>

                {/* Badge Calidad - dentro del contenedor en móvil */}
                <div className="absolute top-2 right-2 sm:top-2 sm:right-2 md:-top-2 md:-right-2 lg:-top-6 lg:-right-6 glass-card px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl animate-float shadow-xl flex items-center gap-1.5 sm:gap-3 border-primary/20 z-20" style={{ animationDelay: '1s' }}>
                  <div className="w-6 h-6 sm:w-9 sm:h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                    <Star size={12} fill="currentColor" className="sm:w-4 sm:h-4" />
                  </div>
                  <p className="font-black text-[9px] xs:text-[10px] sm:text-sm text-foreground whitespace-nowrap">Calidad Expertos 5⭐</p>
                </div>

                <div className="absolute bottom-2 left-2 sm:bottom-2 sm:left-2 md:-bottom-2 md:-left-2 lg:-bottom-6 lg:-left-6 glass-card p-1.5 sm:p-4 rounded-xl sm:rounded-2xl animate-float shadow-xl flex items-center gap-1.5 sm:gap-3 border-secondary/20 z-20" style={{ animationDelay: '2s' }}>
                  <div className="w-6 h-6 sm:w-10 sm:h-10 bg-secondary rounded-full flex items-center justify-center text-white shrink-0">
                    <MapPin size={12} className="sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] xs:text-[9px] sm:text-xs text-muted-foreground font-bold">Ubicuidad</p>
                    <p className="font-black text-[9px] xs:text-[10px] sm:text-sm truncate">Tu Comuna</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      {serviceTypes.length > 0 || loadingTypes ? (
        <section className="py-8 sm:py-12 md:py-20 container mx-auto px-3 xs:px-4 overflow-hidden">
          <div className="text-center mb-12 sm:mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold animate-reveal">{t('home.categories_title')}</h2>
            <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto animate-reveal delay-100">
              {t('home.categories_desc')}
            </p>
          </div>

          <div className={cn('relative', categoriesOverflowPx > 0 && 'pause-home-categories')}>
            {loadingTypes ? (
              <div className="flex justify-center gap-4 overflow-hidden px-4 py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-[120px] w-[132px] shrink-0 rounded-2xl border border-border/50 bg-muted/50 animate-pulse sm:h-[136px] sm:w-[152px]"
                  />
                ))}
              </div>
            ) : (
              <div ref={categoriesViewportRef} className="relative overflow-hidden py-2">
                {categoriesOverflowPx > 0 && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-background to-transparent sm:w-16"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-background to-transparent sm:w-16"
                      aria-hidden
                    />
                  </>
                )}

                <div
                  ref={categoriesTrackRef}
                  className={cn(
                    'flex gap-4 sm:gap-5 md:gap-6',
                    categoriesOverflowPx > 0
                      ? 'home-categories-track--scroll w-max'
                      : 'w-full flex-wrap justify-center'
                  )}
                  style={
                    categoriesOverflowPx > 0
                      ? ({
                          ['--categories-shift' as string]: `-${categoriesOverflowPx}px`,
                          ['--categories-duration' as string]: `${categoriesScrollDuration}s`,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  {serviceTypes.map((type) => (
                    <CategoryCarouselCard key={type.id} type={type} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <div className="rounded-full border border-border/60 bg-white/80 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground shadow-sm backdrop-blur-sm sm:text-[11px]">
                Catálogo interactivo · Explora por categorías
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Main Actions - Re-styled as Feature Highlights */}
      <section className="py-12 md:py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Ofrecer Servicio */}
            <Link to={isLoggedIn ? "/servicios/publicar" : "/servicios"} className="group animate-reveal delay-200">
              <div className="relative overflow-hidden bg-white dark:bg-card border-none rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-10 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col items-center lg:items-start text-center lg:text-left shadow-xl shadow-secondary/5">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-secondary/10 rounded-bl-[80px] sm:rounded-bl-[100px] -z-0"></div>
                <div className="bg-secondary w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl flex items-center justify-center mb-5 sm:mb-8 shadow-xl shadow-secondary/20 group-hover:-rotate-12 transition-transform relative z-10">
                  <Briefcase className="text-white w-7 h-7 sm:w-9 sm:h-9" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl sm:text-3xl font-heading font-extrabold mb-3 sm:mb-4 relative z-10">{t('home.offer_title')}</h3>
                <p className="text-sm sm:text-lg text-muted-foreground relative z-10 mb-5 sm:mb-6">{t('home.offer_desc')}</p>
                <div className="text-secondary font-bold p-0 text-lg group-hover:translate-x-2 transition-transform flex items-center mt-auto">
                  {t('home.offer_cta')} <ArrowRight className="ml-2" />
                </div>
              </div>
            </Link>

            {/* Explorar Servicios */}
            <Link to="/servicios" className="group animate-reveal delay-300">
              <div className="relative overflow-hidden bg-white dark:bg-card border-none rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-10 hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col items-center lg:items-start text-center lg:text-left shadow-xl shadow-primary/5">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/10 rounded-bl-[80px] sm:rounded-bl-[100px] -z-0"></div>
                <div className="bg-primary w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl flex items-center justify-center mb-5 sm:mb-8 shadow-xl shadow-primary/20 group-hover:-rotate-12 transition-transform relative z-10">
                  <Search className="text-white w-7 h-7 sm:w-9 sm:h-9" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl sm:text-3xl font-heading font-extrabold mb-3 sm:mb-4 relative z-10">{t('hero.explore_services')}</h3>
                <p className="text-sm sm:text-lg text-muted-foreground relative z-10 mb-5 sm:mb-6 leading-tight">{t('home.categories_desc')}</p>
                <div className="text-primary font-bold p-0 text-base sm:text-lg group-hover:translate-x-2 transition-transform flex items-center mt-auto">
                  {t('hero.explore_services')} <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Últimos Anuncios */}
      <section className="py-12 md:py-24 container mx-auto px-4">
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
            <div className="relative">
              <div className="overflow-hidden">
                <div
                  className="flex items-stretch gap-4 md:gap-8 transition-transform duration-700 ease-in-out will-change-transform"
                  style={{
                    transform: `translateX(-${latestCarouselIndex * (100 / Math.max(1, latestItemsPerView))}%)`,
                  }}
                >
                  {latestServices.map((service, i) => (
                    <div
                      key={service.id}
                      className="min-w-0 flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.3333%] px-1 md:px-0"
                    >
                      <Link to={`/servicios`} className="animate-reveal block h-full w-full max-w-xl mx-auto" style={{ animationDelay: `${i * 50}ms` }}>
                        <Card className="group h-full bg-white dark:bg-card/40 backdrop-blur-sm border-2 border-transparent hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm hover:-translate-y-1">
                          <CardHeader className="p-8 pb-5">
                            <div className="flex flex-col items-center text-center gap-4 mb-6">
                              <Avatar className="w-14 h-14 border-2 border-white shadow-md ring-4 ring-primary/5 shrink-0 mt-1">
                                <AvatarFallback className="bg-primary text-white flex items-center justify-center">
                                    <div className="scale-110 opacity-90">
                                      {getServiceIcon(service.service_name || service.type_name || '', service.type_icon, service.idicon)}
                                    </div>
                                  </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 w-full">
                                <CardTitle className="text-2xl font-black mb-1 line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                                  {(!service.service_name || service.service_name.trim() === '' || service.service_name.trim() === '.') ? 'Servicio Destacado' : service.service_name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground font-bold truncate">Por {service.user_name}</p>

                                <div className="flex items-center justify-center gap-2 mt-3">
                                  <div
                                    className={`shrink-0 p-1.5 rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${isLightColor(service.type_color || getServiceColor(service.type_name || '')) ? 'text-slate-900 border-black/5' : 'text-white border-white/10'}`}
                                    style={{ backgroundColor: service.type_color || getServiceColor(service.type_name || '') }}
                                  >
                                    <div className="[&>svg]:w-5 [&>svg]:h-5 scale-90">
                                      {getServiceIcon(service.service_name || service.type_name || '', service.type_icon, service.idicon)}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{service.type_name?.trim() ? service.type_name : 'Servicio'}</span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-8 pt-0 flex-1 flex flex-col">
                            <p className="text-muted-foreground text-base line-clamp-2 mb-8 flex-1 italic leading-relaxed">
                              {(!service.description || service.description.trim() === '' || service.description.trim() === '.') ? 'Sin descripción disponible.' : service.description}
                            </p>

                            <div className="flex items-center justify-center gap-4 pt-6 border-t border-primary/5">
                              <div className="flex items-center gap-2 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20">
                                <Star size={18} className="fill-yellow-500 text-yellow-500" />
                                <span className="font-black text-lg text-yellow-700">
                                  {(service.average_rating && Number(service.average_rating) > 0) ? Number(service.average_rating).toFixed(1) : '0.0'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-primary/60 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                                <MapPin size={16} />
                                <span className="text-xs font-bold">{getServiceLocationDisplay(service)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                {Array.from({ length: Math.max(1, latestServices.length - latestItemsPerView + 1) }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Ir al slide ${idx + 1}`}
                    onClick={() => setLatestCarouselIndex(idx)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      idx === latestCarouselIndex ? 'bg-primary w-6' : 'bg-primary/20 hover:bg-primary/35'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sección Nosotros / Nuestra Historia - Rediseño de Marca */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto relative">
            {/* Elemento Decorativo Gigante (Marca) */}
            <div className="absolute -top-20 -left-10 text-[20rem] font-black text-primary/[0.03] select-none pointer-events-none italic">
              D
            </div>
            
            <div className="grid lg:grid-cols-5 gap-12 items-center">
              <div className="lg:col-span-3 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-primary rounded-full"></div>
                  <span className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Nuestro ADN</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[1.15] tracking-tighter">
                  Nacimos para que los <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">buenos datos</span> no se pierdan.
                </h2>
                
                <div className="space-y-6 text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed animate-reveal delay-100">
                  <p className="font-medium">
                    En Dameldato, creemos que el conocimiento no sirve de mucho si no se comparte. 
                    Nacimos para transformar la curiosidad en soluciones reales, creando un espacio donde el "dato" de uno ayuda a todos.
                  </p>
                  <p className="font-medium">
                    Somos la red donde cada pregunta encuentra su respuesta y cada recomendación cuenta. 
                    Porque cuando compartimos lo que sabemos, construimos una comunidad más fuerte.
                  </p>
                </div>

                <div className="pt-8 flex flex-wrap gap-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                      <Users size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-2xl leading-none">Comunidad</h4>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Gente Real</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary shadow-inner">
                      <Lightbulb size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-2xl leading-none">Soluciones</h4>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Claridad Total</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="relative group">
                  {/* Card Central de "Toma el Dato" */}
                  <div className="bg-gradient-to-br from-primary to-indigo-700 p-10 sm:p-12 rounded-[3.5rem] text-white shadow-2xl shadow-primary/30 relative z-10 transform -rotate-2 group-hover:rotate-0 transition-transform duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full translate-x-10 -translate-y-10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-tr-full -translate-x-10 translate-y-10 blur-2xl"></div>
                    
                    <Smile className="w-16 h-16 mb-8 text-white/90" strokeWidth={1.5} />
                    <h3 className="text-3xl font-black mb-6 italic leading-tight">
                      “Toma, aquí está el dato.”
                    </h3>
                    <p className="text-white/80 font-medium text-lg leading-relaxed mb-8">
                      Nuestra frase favorita resume todo lo que hacemos: estar listos para ayudar cuando más se necesita.
                    </p>
                    
                    <div className="h-1 w-20 bg-secondary rounded-full"></div>
                  </div>
                  
                  {/* Decorative Elements around current card */}
                  <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-primary/10 rounded-[3.5rem] -z-10 translate-x-4 translate-y-4"></div>
                  <div className="absolute -top-10 -left-10 w-24 h-24 bg-secondary/5 rounded-full blur-3xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestro Equipo - Video Section */}
      <section className="py-12 md:py-24 relative overflow-hidden bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-bold text-sm uppercase tracking-wider animate-reveal">
                <Users size={16} />
                Nuestros Valores
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 animate-reveal delay-100">
                Nuestro <span className="text-secondary">Equipo</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-reveal delay-200">
                Conoce a las personas apasionadas que trabajan día a día para que Dameldato sea la red de confianza más grande de la región.
              </p>
            </div>

            <div className="relative animate-reveal delay-300" style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
              {/* Video Player Container - Removed glass-card (backdrop-blur) for performance */}
              <div className="relative z-10 p-2 md:p-4 rounded-[2.5rem] md:rounded-[4rem] border border-primary/10 shadow-xl overflow-hidden bg-white group">
                <div className="aspect-video rounded-[2rem] md:rounded-[3.2rem] overflow-hidden bg-slate-900 relative">
                  <video 
                    className="w-full h-full object-cover pointer-events-none"
                    poster="/logo_nombre.webp"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src="/Pink-and-Purple-Simple-Animated-Team-Profile-Introduction-Video.webm" type="video/webm" />
                    <source src="/Pink and Purple Simple Animated Team Profile Introduction Video.mp4" type="video/mp4" />
                    Tu navegador no soporta el video.
                  </video>
                  
                  {/* Overlay decoration */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>

              {/* Decorative Background Elements - Removed pulse animation for performance */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -z-10"></div>
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10"></div>
            </div>

          </div>
        </div>
      </section>

      {/* Entrepreneur Choice Section (for logged out) */}
      {!isLoggedIn && (
        <section id="entrepreneur-section" className="py-8 sm:py-12 md:py-24 bg-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-10"></div>
          <div className="container mx-auto px-3 xs:px-4 relative z-10">
            <div className="max-w-4xl mx-auto glass-card p-5 xs:p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3.5rem] text-center border-primary/20">
              <h2 className="text-lg xs:text-xl sm:text-2xl md:text-4xl font-extrabold text-foreground mb-2 px-1">Personas que ofrecen servicios.</h2>
              <p className="text-sm xs:text-base sm:text-lg text-muted-foreground mb-6 sm:mb-10 max-w-2xl mx-auto px-1">
                {t('home.entrepreneur_choice_desc')}{' '}
                <span className="block mt-2 font-bold text-primary italic">{t('home.entrepreneur_only_note')}</span>
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Link to="/registro">
                  <div className="group bg-white/90 dark:bg-card p-5 xs:p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer h-full flex flex-col items-center text-center">
                    <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-violet-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-violet-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform shrink-0">
                      <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-foreground">{t('home.want_to_offer_services')}</h3>
                    <p className="text-xs xs:text-sm text-muted-foreground mb-4 sm:mb-6">Regístrate en Dameldato y comienza a recibir contactos hoy mismo.</p>
                    <Button className="w-full bg-primary hover:bg-primary/90 mt-auto rounded-xl font-semibold text-sm sm:text-base min-h-11">{t('home.register_talent_cta')}</Button>
                  </div>
                </Link>
                
                <Link to="/login">
                  <div className="group bg-white/90 dark:bg-card p-5 xs:p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border/50 hover:border-green-500/30 hover:shadow-xl transition-all cursor-pointer h-full flex flex-col items-center text-center">
                    <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 mb-3 sm:mb-4 group-hover:scale-110 transition-transform shrink-0">
                      <Search className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base xs:text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-foreground">{t('home.already_offer_services')}</h3>
                    <p className="text-xs xs:text-sm text-muted-foreground mb-4 sm:mb-6">{t('home.already_part_description')}</p>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-auto font-black border-none min-h-11 h-auto py-3 rounded-xl shadow-lg shadow-emerald-500/20 uppercase tracking-wider text-[10px] xs:text-xs">
                      {t('home.login_panel_cta')}
                    </Button>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* "¿Tienes un buen dato?" Form Section */}
      <section className="py-12 md:py-24 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-sm uppercase tracking-wider">
                <Sparkles size={16} />
                Comunidad Dameldato
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-slate-900">
                ¿Tienes un <span className="text-indigo-600 italic">buen dato</span> que quieras compartir?
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Si conoces a un gasfiter, costurera o electricista que sea excelente, envíanos su contacto para invitarlo a la plataforma.
              </p>
              <div className="flex items-center gap-4 text-slate-500 font-medium">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-100">
                  <Mail className="text-indigo-500" />
                </div>
                <span>Ayúdanos a crecer nuestra red de talentos locales.</span>
              </div>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="bg-white dark:bg-card/80 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] shadow-2xl shadow-indigo-500/10 border-2 border-indigo-500/10 relative">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <form onSubmit={handleTipSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">¿Qué servicio ofrece? *</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Sra. Carmen Costuras" 
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white outline-none transition-all font-medium"
                      value={tipForm.title}
                      onChange={(e) => setTipForm({...tipForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Cuéntanos más (Opcional)</label>
                    <textarea 
                      placeholder="Ej: Es muy puntual y cobra justo..." 
                      className="w-full h-32 p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white outline-none transition-all font-medium resize-none"
                      value={tipForm.description}
                      onChange={(e) => setTipForm({...tipForm, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Teléfono o contacto *</label>
                    <input 
                      type="tel" 
                      placeholder="+56 9 1234 5678" 
                      className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white outline-none transition-all font-medium"
                      value={tipForm.phone}
                      onChange={(e) => setTipForm({...tipForm, phone: e.target.value})}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingTip}
                    className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    {isSubmittingTip ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Enviar dato <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground font-medium pt-2 italic">
                    * El número de teléfono que nos provees solo lo usaremos para contactar el dato que nos das.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
