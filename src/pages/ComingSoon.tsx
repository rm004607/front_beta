import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, ArrowLeft, Sparkles, MapPin } from "lucide-react";
import logoFull from '/logo_nombre.webp';

const ComingSoon = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-2xl w-full space-y-12 animate-reveal">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src={logoFull}
            alt="Dameldato"
            className="h-24 md:h-32 object-contain drop-shadow-xl"
          />
        </div>

        {/* Content Card */}
        <div className="glass-card p-8 md:p-16 rounded-[3.5rem] border-primary/20 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
          
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6 animate-float">
            <Globe size={40} />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
            {t('home.coming_soon_title').replace('¡Hola! 👋 ', '')}
          </h1>

          <p className="text-xl text-muted-foreground font-medium leading-relaxed">
            {t('home.coming_soon_desc', { country: 'tu país' })}
            <br />
            Estamos trabajando arduamente para expandir nuestra red de talentos locales a nuevas fronteras.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
            <div className="bg-white/50 p-6 rounded-3xl border border-primary/5 flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                <Sparkles size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800">Calidad</p>
                <p className="text-xs text-muted-foreground font-bold">Datos Verificados</p>
              </div>
            </div>
            <div className="bg-white/50 p-6 rounded-3xl border border-primary/5 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                <MapPin size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800">Cercanía</p>
                <p className="text-xs text-muted-foreground font-bold">Talento en tu zona</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-black px-10 py-7 text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 w-full sm:w-auto">
                <ArrowLeft size={20} className="mr-2" />
                Regresar al Inicio
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px]">
          Damel Dato • Próximamente Nivel Global
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
