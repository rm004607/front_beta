import { useTranslation } from "react-i18next";
import { Globe, Sparkles, Lightbulb, Users, Smile } from "lucide-react";
import logoFull from '/logo_nombre.webp';

const ComingSoon = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-start p-6 md:p-12 overflow-y-auto">
      <div className="max-w-4xl w-full space-y-12 py-12 animate-reveal">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <img
            src={logoFull}
            alt="Dameldato"
            className="h-28 md:h-40 object-contain drop-shadow-2xl animate-float"
          />
        </div>

        {/* Hero Block */}
        <div className="glass-card p-8 md:p-16 rounded-[3.5rem] border-primary/20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 blur-3xl"></div>
          
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-8 animate-pulse-subtle">
            <Globe size={48} />
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-tight tracking-tighter mb-6">
             {t('home.coming_soon_title')}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
            {t('home.coming_soon_desc', { country: 'tu zona' })}
          </p>
        </div>

        {/* Our Story Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-card p-10 rounded-[3rem] space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-primary rounded-full"></div>
              <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs">Nuestra Historia</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 italic">“Toma, aquí está el dato.”</h2>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              En <span className="text-primary font-bold">Dameldato</span>, creemos que el conocimiento no sirve de mucho si no se comparte. 
              Nacimos para transformar la curiosidad en soluciones reales, creando un espacio donde el "dato" de uno ayuda a todos.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
              Somos la red donde cada pregunta encuentra su respuesta y cada recomendación cuenta. 
              Porque cuando compartimos lo que sabemos, construimos una comunidad más fuerte.
            </p>
          </div>

          <div className="space-y-8 flex flex-col justify-center">
            <div className="flex items-center gap-6 group">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                <Users size={36} />
              </div>
              <div>
                <h4 className="font-black text-2xl text-slate-900 leading-none">Comunidad</h4>
                <p className="text-sm text-muted-foreground font-bold mt-1 uppercase tracking-widest">Gente Real Ayudando</p>
              </div>
            </div>

            <div className="flex items-center gap-6 group">
              <div className="w-20 h-20 rounded-3xl bg-secondary/5 flex items-center justify-center text-secondary shadow-inner group-hover:scale-110 transition-transform">
                <Lightbulb size={36} />
              </div>
              <div>
                <h4 className="font-black text-2xl text-slate-900 leading-none">Soluciones</h4>
                <p className="text-sm text-muted-foreground font-bold mt-1 uppercase tracking-widest">Claridad y Confianza</p>
              </div>
            </div>

            <div className="flex items-center gap-6 group">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/5 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform">
                <Smile size={36} />
              </div>
              <div>
                <h4 className="font-black text-2xl text-slate-900 leading-none">Cercanía</h4>
                <p className="text-sm text-muted-foreground font-bold mt-1 uppercase tracking-widest">Talento de tu Barrio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Goal Section */}
        <div className="bg-gradient-to-br from-primary to-indigo-700 p-12 md:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-bl-full translate-x-20 -translate-y-20 blur-3xl"></div>
          <Sparkles className="w-16 h-16 mb-8 mx-auto text-white/90" />
          <h2 className="text-3xl md:text-5xl font-black mb-6">Nuestro Gran Objetivo</h2>
          <p className="text-xl md:text-2xl text-white/80 font-medium leading-relaxed max-w-3xl mx-auto">
            Nacimos para que los <span className="text-secondary font-bold italic">buenos datos</span> no se pierdan. 
            Queremos ser el puente global que conecte a personas laboriosas con quienes necesitan soluciones urgentes y de calidad. 
            Pronto, tu país será parte de esta gran red.
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-12 text-center pb-12">
          <p className="text-muted-foreground font-bold uppercase tracking-[0.4em] text-[12px] mb-4">
            Damel Dato • Próximamente Nivel Global
          </p>
          <div className="h-1 w-24 bg-primary/20 mx-auto rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
