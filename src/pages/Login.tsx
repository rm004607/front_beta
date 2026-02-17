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

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor ingresa un email válido');
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

