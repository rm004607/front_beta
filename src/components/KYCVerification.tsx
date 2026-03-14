import { useEffect, useRef, useState } from 'react';
import { kycAPI } from '@/lib/api';

declare global {
  namespace JSX {
    interface IntrinsicElements { 'mati-button': any }
  }
}

interface Props {
  /** En flujo email/contraseña viene del backend; en flujo Google es null y se usa kycAPI.start con token */
  registrationId: string | null;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

const isGoogleFlow = (regId: string | null) => !regId || !String(regId).trim();

export default function KYCVerification({ registrationId, onSuccess, onError }: Props) {
  const buttonRef = useRef<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const useGoogleFlow = isGoogleFlow(registrationId);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://web-button.mati.io/button.js';
    script.async = true;
    document.body.appendChild(script);

    const handleFinished = async (e: any) => {
      console.log('[KYC] ✅ userFinishedSdk en window:', e.detail);
      const identityId = e.detail?.identityId ?? e.detail?.id ?? e.detail?.userId;
      if (!identityId) {
        console.error('[KYC] No identityId received from MetaMap', e.detail);
        onError('No se recibió identityId de MetaMap. Intenta de nuevo.');
        return;
      }

      if (useGoogleFlow) {
        // Flujo Google: usuario ya autenticado, vincular identityId con el usuario por token
        try {
          await kycAPI.start(identityId);
          console.log('[KYC] ✅ KYC start exitoso (flujo Google), esperando webhook...');
          setIsVerifying(true);
          const res = await kycAPI.getKYCStatus();
          if (res?.kyc?.kyc_status === 'verified') {
            onSuccess();
          }
        } catch (err) {
          console.error('[KYC] Error en /api/kyc/start (flujo Google):', err);
          onError('Error al vincular tu identidad. Intenta de nuevo.');
        }
        return;
      }

      const regId = (registrationId || '').trim();
      try {
        await kycAPI.link(regId, identityId);
        console.log('[KYC] ✅ Vinculación exitosa en frontend, esperando webhook...');
        setIsVerifying(true);
        try {
          const res = await kycAPI.checkPendingStatus(regId);
          if (res.ok && res.status === 'verified') {
            onSuccess();
          }
        } catch (e) {}
      } catch (err) {
        console.error('[KYC] Error en /api/kyc/link:', err);
        onError('Error al vincular tu identidad. Intenta de nuevo.');
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
  }, [registrationId, useGoogleFlow, onSuccess, onError]);

  // Poller: flujo con registration_id (pendiente de registro)
  useEffect(() => {
    if (useGoogleFlow || !registrationId?.trim()) return;

    let poller: NodeJS.Timeout;
    const checkStatus = async () => {
      try {
        const res = await kycAPI.checkPendingStatus(registrationId);
        if (res.ok && res.status === 'verified') {
          console.log('[KYC] ✅ Webhook detectado! Status de base de datos es verified.');
          clearInterval(poller);
          onSuccess();
        } else if (res.ok && res.status === 'rejected') {
          console.log('[KYC] ❌ Webhook detectado! Status de base de datos es rejected.');
          clearInterval(poller);
          onError('Verificación rechazada. Por favor intenta de nuevo.');
        }
      } catch (err) {}
    };
    poller = setInterval(checkStatus, 2000);
    return () => clearInterval(poller);
  }, [registrationId, useGoogleFlow, onSuccess, onError]);

  // Poller: flujo Google (usuario autenticado, estado por getKYCStatus)
  useEffect(() => {
    if (!useGoogleFlow || !isVerifying) return;

    let poller: NodeJS.Timeout;
    const checkStatus = async () => {
      try {
        const res = await kycAPI.getKYCStatus();
        const status = res?.kyc?.kyc_status;
        if (status === 'verified') {
          console.log('[KYC] ✅ KYC verified (flujo Google).');
          clearInterval(poller);
          onSuccess();
        } else if (status === 'rejected') {
          console.log('[KYC] ❌ KYC rejected (flujo Google).');
          clearInterval(poller);
          onError('Verificación rechazada. Por favor intenta de nuevo.');
        }
      } catch (err) {}
    };
    poller = setInterval(checkStatus, 2000);
    return () => clearInterval(poller);
  }, [useGoogleFlow, isVerifying, onSuccess, onError]);

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
            metadata={JSON.stringify(registrationId?.trim() ? { registration_id: registrationId.trim() } : { flow: 'google' })}
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