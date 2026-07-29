import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { communitiesAPI } from '@/lib/api';

type Preview = { valid: boolean; community?: { id: string; name: string }; reason?: string };

const reasonText: Record<string, string> = {
  expired: 'Este link de invitación venció.',
  max_uses: 'Este link ya alcanzó su número máximo de usos.',
  revoked: 'Este link fue desactivado por el administrador.',
};

const UnirseComunidad = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useUser();

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await communitiesAPI.getInvitePreview(token);
        if (!cancelled) setPreview(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No pudimos validar la invitación.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await communitiesAPI.acceptInvite(token);
      toast.success('¡Te uniste a la comunidad!');
      navigate('/comunidades', { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos completar la acción.');
    } finally {
      setJoining(false);
    }
  };

  const goRegister = () => {
    // Guardamos el invite para volver aquí tras ingresar con teléfono.
    localStorage.setItem('pending_invite', `/comunidades/invitacion/${token}`);
    navigate('/registro?tipo=vecino');
  };

  const invalid = !loading && (error || (preview && !preview.valid));

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${invalid ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {loading ? <Loader2 size={26} className="animate-spin" /> : invalid ? <XCircle size={26} /> : <Users size={26} />}
          </div>
          <CardTitle className="text-2xl font-heading">
            {loading ? 'Validando invitación...' : invalid ? 'Invitación no válida' : 'Te invitaron a una comunidad'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Un momento...</p>}

          {invalid && (
            <>
              <p className="text-sm text-muted-foreground">
                {error || reasonText[preview?.reason ?? ''] || 'Esta invitación ya no está disponible. Pídele al administrador un link nuevo.'}
              </p>
              <Button asChild variant="outline" className="w-full"><Link to="/comunidades">Ir a mis comunidades</Link></Button>
            </>
          )}

          {!loading && !invalid && preview?.community && (
            <>
              <p className="text-base">
                Únete a <span className="font-bold text-primary">{preview.community.name}</span> y recomienda o encuentra servicios de confianza.
              </p>
              {isLoggedIn ? (
                <Button onClick={handleJoin} disabled={joining} className="w-full font-bold h-11">
                  {joining ? <><Loader2 size={16} className="mr-2 animate-spin" /> Uniéndote...</> : <><CheckCircle2 size={18} className="mr-2" /> Unirme a la comunidad</>}
                </Button>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Primero ingresa con tu teléfono (toma 30 segundos, sin contraseñas).</p>
                  <Button onClick={goRegister} disabled={authLoading} className="w-full font-bold h-11">
                    Ingresar con mi teléfono
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnirseComunidad;
