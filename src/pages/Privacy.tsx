import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl">Política de Privacidad</CardTitle>
            <CardDescription>
              Cómo protegemos y utilizamos tu información en Dameldato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm md:text-base text-muted-foreground">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">1. Información que recopilamos</h2>
              <p>
                Recopilamos la información que nos entregas al crear tu cuenta, completar tu perfil, publicar servicios
                o interactuar con otros usuarios en la plataforma.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">2. Uso de la información</h2>
              <p>
                Utilizamos tus datos para operar y mejorar Dameldato, personalizar tu experiencia, conectar talentos con
                oportunidades y para fines de seguridad y prevención de fraude.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">3. Compartir datos con terceros</h2>
              <p>
                No vendemos tu información personal. Solo la compartimos con proveedores de servicios que nos ayudan a
                operar la plataforma o cuando la ley lo requiere.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">4. Tus derechos</h2>
              <p>
                Puedes acceder, actualizar o solicitar la eliminación de tus datos personales conforme a la normativa
                aplicable. Si deseas ejercer estos derechos, contáctanos a través de nuestro centro de ayuda.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">5. Seguridad</h2>
              <p>
                Implementamos medidas razonables para proteger tu información, aunque ningún sistema es completamente
                seguro. Te recomendamos usar contraseñas fuertes y mantener tus credenciales en privado.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;

