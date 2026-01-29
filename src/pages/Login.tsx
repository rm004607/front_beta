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

  // Manejar errores de Google OAuth
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      if (error === 'google_auth_failed') {
        toast.error('Error al autenticar con Google. Por favor intenta de nuevo.');
      } else if (error === 'user_inactive') {
        toast.error('Tu cuenta está inactiva. Contacta al soporte.');
      } else if (error === 'user_banned') {
        toast.error('Tu cuenta ha sido bloqueada.');
      }
    }

    // Si hay éxito de Google login, recargar usuario
    const googleSuccess = searchParams.get('google_login');
    if (googleSuccess === 'success') {
      loadUser().then(() => {
        toast.success('¡Bienvenido con Google!');
        navigate('/');
      });
    }
  }, [searchParams, loadUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
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
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-3xl font-heading">Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa a tu cuenta de Dameldato</CardDescription>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => authAPI.googleLogin()}
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </Button>

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
  );
};

export default Login;

