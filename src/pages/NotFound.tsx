import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="glass-card border-white/5 shadow-2xl overflow-hidden p-8">
          <div className="text-center space-y-6">
            <h1 className="text-8xl font-heading font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              404
            </h1>
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-foreground">Página no encontrada</p>
              <p className="text-muted-foreground italic">
                Parece que te has perdido en el espacio de Dameldato.
              </p>
            </div>
            <a href="/">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 mt-4">
                Volver al Inicio
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
