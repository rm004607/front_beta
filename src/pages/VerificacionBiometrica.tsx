import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { kycAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'mati-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { clientId?: string; flowId?: string; metadata?: string }, HTMLElement>;
    }
  }
}

export default function VerificacionBiometrica() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadUser } = useUser();
  const token = searchParams.get('token');
  const kycPending = searchParams.get('kyc_pending') === 'true';

  const buttonRef = useRef<HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tokenApplied, setTokenApplied] = useState(false);

  // Guardar token de la URL y limpiar params
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setTokenApplied(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('kyc_pending');
      window.history.replaceState({}, '', url.pathname + url.search);
    } else if (localStorage.getItem('token')) {
      setTokenApplied(true);
    }
  }, [token]);

  // MetaMap: script + listener para userFinishedSdk
  useEffect(() => {
    if (!tokenApplied) return;
    if (!localStorage.getItem('token')) {
      setError('No se encontró token de sesión. Vuelve a iniciar desde el enlace de registro.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://web-button.mati.io/button.js';
    script.async = true;
    document.body.appendChild(script);

    const handleFinished = async (e: CustomEvent) => {
      const identityId = e.detail?.identityId ?? e.detail?.id ?? e.detail?.userId;
      if (!identityId) {
        setError('No se recibió identificación de MetaMap. Intenta de nuevo.');
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        await kycAPI.start(identityId);
        toast.success('Verificación enviada correctamente.');
        await loadUser();
        navigate('/perfil', { replace: true });
      } catch (err: any) {
        const msg = err?.message || 'Error al completar la verificación. Intenta de nuevo.';
        setError(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    };

    const handleExited = () => {
      setError('Cerraste el proceso de verificación. Puedes intentarlo de nuevo.');
    };

    window.addEventListener('mati:userFinishedSdk', handleFinished as EventListener);
    window.addEventListener('mati:exitedSdk', handleExited);
    const btn = buttonRef.current;
    if (btn) {
      btn.addEventListener('mati:userFinishedSdk', handleFinished as EventListener);
      btn.addEventListener('mati:exitedSdk', handleExited);
    }

    return () => {
      window.removeEventListener('mati:userFinishedSdk', handleFinished as EventListener);
      window.removeEventListener('mati:exitedSdk', handleExited);
      if (btn) {
        btn.removeEventListener('mati:userFinishedSdk', handleFinished as EventListener);
        btn.removeEventListener('mati:exitedSdk', handleExited);
      }
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, [tokenApplied, loadUser, navigate]);

  if (!tokenApplied && !localStorage.getItem('token') && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sin sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No se encontró token. Vuelve a iniciar desde el enlace que te envió el registro con Google.
            </p>
            <button
              type="button"
              className="text-primary font-medium underline"
              onClick={() => navigate('/login')}
            >
              Ir a Iniciar sesión
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Verificación de identidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Para completar tu registro, necesitas verificar tu identidad con un escaneo facial.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {submitting ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="font-medium text-center">Completando verificación...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <mati-button
                ref={buttonRef as any}
                clientId={import.meta.env.VITE_METAMAP_CLIENT_ID}
                flowId={import.meta.env.VITE_METAMAP_FLOW_ID}
                metadata={JSON.stringify({ flow: 'biometric_verification' })}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            ¿Problemas con la verificación? Contacta a soporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
