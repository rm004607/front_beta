import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl">Términos y Condiciones</CardTitle>
            <CardDescription>
              Última actualización: {new Date().toLocaleDateString('es-CL')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm md:text-base text-muted-foreground">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">1. Aceptación de los términos</h2>
              <p>
                Al acceder o utilizar Dameldato, aceptas cumplir y quedar sujeto a estos Términos y Condiciones.
                Si no estás de acuerdo con alguna de sus partes, no debes utilizar la plataforma.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">2. Uso de la plataforma</h2>
              <p>
                Dameldato es una plataforma que conecta talentos, oportunidades laborales y emprendimientos locales.
                Te comprometes a utilizarla de forma responsable, respetando a otros usuarios y la legislación vigente.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">3. Cuentas de usuario</h2>
              <p>
                Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que
                ocurran bajo tu cuenta. Debes notificarnos ante cualquier uso no autorizado.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">4. Contenido</h2>
              <p>
                Eres responsable del contenido que publiques en la plataforma. Nos reservamos el derecho de eliminar
                contenido que consideremos inapropiado o que infrinja estos términos.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">5. Modificaciones</h2>
              <p>
                Podemos actualizar estos Términos y Condiciones cuando sea necesario. Los cambios se publicarán en esta
                página y el uso continuado de la plataforma implica la aceptación de los nuevos términos.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;

