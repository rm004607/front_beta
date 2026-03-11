import { useEffect, useRef } from 'react';
import { kycAPI } from '@/lib/api';

declare global {
  namespace JSX {
    interface IntrinsicElements { 'mati-button': any }
  }
}

interface Props {
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function KYCVerification({ onSuccess, onError }: Props) {
  const buttonRef = useRef<any>(null);

  useEffect(() => {
    // Cargar script SDK
    const script = document.createElement('script');
    script.src = 'https://web-button.mati.io/button.js';
    script.async = true;
    document.body.appendChild(script);

    // ✅ CLAVE: listeners en WINDOW, no en buttonRef
    const handleFinished = async (e: any) => {
      console.log('[KYC] ✅ userFinishedSdk en window:', e.detail);
      const identityId = e.detail?.identityId;
      try {
        if (identityId) await kycAPI.start(identityId);
      } catch (err) {
        console.error('[KYC] Error en /api/kyc/start (continuando igual):', err);
      } finally {
        console.log('[KYC] Llamando onSuccess...');
        onSuccess();
      }
    };

    const handleExited = () => {
      console.log('[KYC] exitedSdk en window');
      onError('Cerraste el proceso de verificación');
    };

    window.addEventListener('mati:userFinishedSdk', handleFinished);
    window.addEventListener('mati:exitedSdk', handleExited);

    return () => {
      window.removeEventListener('mati:userFinishedSdk', handleFinished);
      window.removeEventListener('mati:exitedSdk', handleExited);
      try { document.body.removeChild(script); } catch {}
    };
  }, []); // sin dependencias para que no se re-registre

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <p className="text-sm text-muted-foreground text-center">
        Necesitamos verificar tu identidad. Tendrás que tomar una selfie y una foto de tu carnet chileno.
        Esto nos ayuda a mantener la comunidad segura y evitar suplantaciones de identidad.
      </p>
      <mati-button
        ref={buttonRef}
        clientid={import.meta.env.VITE_METAMAP_CLIENT_ID}
        flowId={import.meta.env.VITE_METAMAP_FLOW_ID}
      />
      <button
        className="text-xs text-muted-foreground underline mt-2"
        onClick={() => onError('Problemas con la verificación')}
      >
        ¿Problemas con la verificación?
      </button>
    </div>
  );
}