import { useEffect, useRef, useState } from 'react';
import { kycAPI } from '@/lib/api';

declare global {
  namespace JSX {
    interface IntrinsicElements { 'mati-button': any }
  }
}

interface Props {
  /** En flujo email/contraseña viene del backend; en flujo Google es null */
  registrationId: string | null;
  onSuccess: () => void;
  onError: (msg: string) => void;
  /** Si el backend no soporta KYC para este flujo (ej. 404), se llama para mostrar "Continuar sin verificación" */
  onKYCUnavailable?: () => void;
}

const isGoogleFlow = (regId: string | null) => !regId || !String(regId).trim();

export default function KYCVerification({ registrationId, onSuccess, onError, onKYCUnavailable }: Props) {
  const buttonRef = useRef<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  /** En flujo Google, el regId se obtiene al terminar MetaMap y se usa para polling */
  const [pendingRegIdFromBackend, setPendingRegIdFromBackend] = useState<string | null>(null);
  const useGoogleFlow = isGoogleFlow(registrationId);
  const effectiveRegId = (registrationId || '').trim() || pendingRegIdFromBackend;

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
        // Flujo Google: intentar obtener registration_id del backend para el usuario autenticado y usar link()
        try {
          const { registration_id: regId } = await kycAPI.getRegistrationIdForUser();
          if (!regId?.trim()) {
            onKYCUnavailable?.() ?? onError('La verificación no está disponible para este flujo. Puedes continuar sin verificación.');
            return;
          }
          const regIdTrim = regId.trim();
          await kycAPI.link(regIdTrim, identityId);
          console.log('[KYC] ✅ Vinculación exitosa (flujo Google), esperando webhook...');
          setPendingRegIdFromBackend(regIdTrim);
          setIsVerifying(true);
          try {
            const res = await kycAPI.checkPendingStatus(regIdTrim);
            if (res.ok && res.status === 'verified') {
              onSuccess();
            }
          } catch (e) {}
        } catch (err: any) {
          const is404 = err?.status === 404;
          if (is404 || err?.message?.toLowerCase().includes('no encontrada') || err?.message?.toLowerCase().includes('not found')) {
            console.warn('[KYC] Backend no expone registration_id para usuario (flujo Google). Mostrando opción de continuar sin verificación.');
            onKYCUnavailable?.() ?? onError('La verificación no está disponible para registro con Google. Puedes continuar sin verificación.');
          } else {
            console.error('[KYC] Error en flujo Google:', err);
            onError('Error al vincular tu identidad. Intenta de nuevo.');
          }
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

  // Poller: verificación por registration_id (email/password o Google cuando el backend devuelve regId)
  useEffect(() => {
    if (!effectiveRegId || !isVerifying) return;

    let poller: NodeJS.Timeout;
    const checkStatus = async () => {
      try {
        const res = await kycAPI.checkPendingStatus(effectiveRegId);
        if (res.ok && res.status === 'verified') {
          console.log('[KYC] ✅ Webhook detectado! Status verified.');
          clearInterval(poller);
          onSuccess();
        } else if (res.ok && res.status === 'rejected') {
          console.log('[KYC] ❌ Webhook detectado! Status rejected.');
          clearInterval(poller);
          onError('Verificación rechazada. Por favor intenta de nuevo.');
        }
      } catch (err) {}
    };
    poller = setInterval(checkStatus, 2000);
    return () => clearInterval(poller);
  }, [effectiveRegId, isVerifying, onSuccess, onError]);

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