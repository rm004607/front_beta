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

            <div className="mt-6 flex flex-col gap-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-semibold">O continúa con</span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                onClick={() => authAPI.googleLogin()}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
            </div>


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

