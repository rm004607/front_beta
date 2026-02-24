import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { AlertTriangle, Ban } from 'lucide-react';
import { authAPI } from '@/lib/api';

interface BanInfo {
  reason: string;
  time_remaining: string | null;
  is_permanent: boolean;
  ban_count: number;
  banned_until: string | null;
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loadUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Validar formato de email o usuario (permitir 'admin', 'superadmin' etc)
    if (email.includes(' ') || email.length < 3) {
      toast.error('Por favor ingresa un email o usuario válido');
      return;
    }

    setIsSubmitting(true);
    setBanInfo(null); // Limpiar información de ban previa

    try {
      await login(email, password);
      toast.success('¡Bienvenido de nuevo!');
      navigate('/');
    } catch (error: any) {
      // Verificar si el error contiene información de ban
      if (error.ban_info) {
        setBanInfo(error.ban_info);
        // No mostrar toast genérico, el alert mostrará el mensaje
      } else {
        toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
        setBanInfo(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-12 px-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
              ¡Hola de nuevo!
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">Ingresa a tu cuenta de Dameldato</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mensaje de ban */}
            {banInfo && (
              <Alert variant="destructive" className="mb-6">
                <Ban className="h-4 w-4" />
                <AlertTitle>Cuenta Bloqueada</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p className="font-semibold">Tu cuenta ha sido bloqueada.</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-semibold">Motivo:</span> {banInfo.reason}
                    </p>
                    {banInfo.is_permanent ? (
                      <p className="font-semibold text-red-600">
                        ⚠️ Esta cuenta está bloqueada permanentemente.
                      </p>
                    ) : banInfo.time_remaining ? (
                      <p>
                        <span className="font-semibold">Tiempo restante:</span>{' '}
                        <span className="font-semibold text-red-600">{banInfo.time_remaining}</span>
                      </p>
                    ) : null}
                    {banInfo.ban_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Infracciones: {banInfo.ban_count} {banInfo.ban_count >= 2 && '(Ban permanente por segunda infracción)'}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Si crees que esto es un error, contacta al soporte de Dameldato.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email o Usuario</Label>
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com o usuario admin"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>


            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link to="/registro" className="text-primary hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

