import { useEffect, useRef, useState } from 'react';
import { kycAPI } from '@/lib/api';

declare global {
  namespace JSX {
    interface IntrinsicElements { 'mati-button': any }
  }
}

interface Props {
  registrationId: string | null;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function KYCVerification({ registrationId, onSuccess, onError }: Props) {
  const buttonRef = useRef<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://web-button.mati.io/button.js';
    script.async = true;
    document.body.appendChild(script);

    const handleFinished = async (e: any) => {
      console.log('[KYC] ✅ userFinishedSdk en window:', e.detail);
      const identityId = e.detail?.identityId ?? e.detail?.id ?? e.detail?.userId;
      const regId = (registrationId || '').trim();

      if (!regId) {
        onError('No encontramos el ID de registro. Vuelve a intentar desde el inicio.');
        return;
      }

      if (!identityId) {
        console.error('[KYC] No identityId received from MetaMap', e.detail);
        onError('No se recibió identityId de MetaMap. Intenta de nuevo.');
        return;
      }

      try {
        setIsVerifying(true);
        await kycAPI.link(regId, identityId);
        const confirmRes = await kycAPI.confirm(regId);
        if (confirmRes?.token) {
          localStorage.setItem('token', confirmRes.token);
        }
        onSuccess();
      } catch (err: any) {
        console.error('[KYC] Error en /api/kyc/link:', err);
        onError(err?.message || 'Error al completar la verificación de identidad.');
      } finally {
        setIsVerifying(false);
      }
    };

    const handleExited = () => {
      console.log('[KYC] exitedSdk en window');
      onError('Cerraste el proceso de verificación');
    };

    const matiBtn = buttonRef.current;
    window.addEventListener('mati:userFinishedSdk', handleFinished);
    window.addEventListener('mati:exitedSdk', handleExited);
    if (matiBtn) {
      matiBtn.addEventListener('mati:userFinishedSdk', handleFinished);
      matiBtn.addEventListener('mati:exitedSdk', handleExited);
    }

    return () => {
      window.removeEventListener('mati:userFinishedSdk', handleFinished);
      window.removeEventListener('mati:exitedSdk', handleExited);
      if (matiBtn) {
        matiBtn.removeEventListener('mati:userFinishedSdk', handleFinished);
        matiBtn.removeEventListener('mati:exitedSdk', handleExited);
      }
      try { document.body.removeChild(script); } catch {}
    };
  }, [registrationId, onSuccess, onError]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {isVerifying ? (
        <div className="flex flex-col items-center p-6 space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold text-center mt-4">Analizando tus documentos...</p>
          <p className="text-sm text-muted-foreground text-center">Esto puede tomar unos segundos, no cierres esta ventana.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground text-center">
            Necesitamos verificar tu identidad. Tendrás que tomar una selfie y una foto de tu carnet chileno.
            Esto nos ayuda a mantener la comunidad segura y evitar suplantaciones de identidad.
          </p>
          <mati-button
            ref={buttonRef}
            clientId={import.meta.env.VITE_METAMAP_CLIENT_ID}
            flowId={import.meta.env.VITE_METAMAP_FLOW_ID}
            metadata={JSON.stringify({ registration_id: registrationId?.trim() || '' })}
          />
        </>
      )}
      <button
        className="text-xs text-muted-foreground underline"
        onClick={() => onError('Problemas con la verificación')}
      >
        ¿Problemas con la verificación?
      </button>
    </div>
  );
}