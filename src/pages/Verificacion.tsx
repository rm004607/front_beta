import { BadgeCheck, Camera, CreditCard, ShieldCheck, Fingerprint, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/VerifiedBadge';

const steps = [
  {
    icon: CreditCard,
    title: 'Cédula de identidad',
    description: 'El prestador fotografía su cédula chilena por ambas caras. Verificamos que sea auténtica y que los datos sean válidos ante el Registro Civil.',
  },
  {
    icon: Camera,
    title: 'Selfie en tiempo real',
    description: 'Se captura una foto del rostro del prestador. La comparamos contra la foto de su cédula para confirmar que es la misma persona.',
  },
  {
    icon: Fingerprint,
    title: 'Prueba de vida (Liveness)',
    description: 'TOC Biometrics detecta que el prestador está presente y no es una foto o video grabado. Previene suplantación de identidad.',
  },
  {
    icon: CheckCircle2,
    title: 'Aprobación y sello',
    description: 'Si todo coincide, el prestador recibe el sello "Verificado" visible en su perfil y en cada servicio que publica.',
  },
];

const faqs = [
  {
    q: '¿Por qué verificamos a todos los prestadores?',
    a: 'Para que puedas contratar con total confianza. Sabemos quién está detrás de cada servicio: nombre real, RUN válido e identidad biométrica confirmada.',
  },
  {
    q: '¿Mis datos personales están seguros?',
    a: 'Sí. TOC Biometrics está certificado bajo estándares internacionales de protección de datos (ISO 27001). Dameldato nunca almacena imágenes de cédulas.',
  },
  {
    q: '¿Qué pasa si un prestador no está verificado?',
    a: 'Solo los prestadores verificados pueden publicar servicios activos en la plataforma. Sin verificación, el perfil permanece inactivo.',
  },
  {
    q: '¿Cuánto tarda el proceso?',
    a: 'Entre 2 y 5 minutos. La revisión biométrica es automática; la aprobación final puede tomar hasta 24 horas hábiles.',
  },
];

const Verificacion = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden bg-primary/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-primary/[0.04] blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-secondary/[0.04] blur-[100px] rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6">
            <ShieldCheck size={16} />
            100% de prestadores verificados
          </div>
          <h1 className="text-3xl sm:text-5xl font-heading font-black leading-tight mb-4">
            Identidad verificada.<br />
            <span className="text-primary">Confianza garantizada.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            En Dameldato, cada prestador que ves en la plataforma pasó por un proceso de verificación biométrica con su cédula chilena.
            No hay perfiles anónimos, solo personas reales.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <VerifiedBadge size="lg" variant="icon-text" />
            <span className="text-sm text-muted-foreground">Este sello aparece en cada prestador verificado</span>
          </div>
        </div>
      </section>

      {/* Proceso paso a paso */}
      <section className="py-16 sm:py-24 container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-heading font-bold mb-3">¿Cómo funciona la verificación?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Usamos tecnología de <strong>TOC Biometrics</strong>, líder latinoamericano en verificación de identidad digital.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative bg-card rounded-2xl border border-border p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <step.icon size={20} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Paso {i + 1}</span>
              </div>
              <h3 className="text-base font-bold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Banner de confianza */}
      <section className="py-12 bg-primary/5 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
            {[
              { value: '100%', label: 'Prestadores verificados biométricamente' },
              { value: 'RUN', label: 'Validado ante el Registro Civil de Chile' },
              { value: 'ISO 27001', label: 'Estándar internacional de seguridad de datos' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <p className="text-3xl font-black text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground max-w-[180px] leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-10 text-center">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-card rounded-2xl border border-border p-6">
                <p className="font-bold text-foreground mb-2">{faq.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <BadgeCheck size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-3">¿Eres prestador y quieres verificarte?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Regístrate en Dameldato y completa el proceso en menos de 5 minutos desde tu celular.
          </p>
          <Link to="/registro">
            <Button size="lg" className="rounded-xl font-bold px-8">
              Verificar mi identidad
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Verificacion;
