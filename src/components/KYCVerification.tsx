import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, QrCode, Scan, Camera, UserCheck, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface KYCVerificationProps {
    onComplete: () => void;
    onBack: () => void;
}

const KYCVerification: React.FC<KYCVerificationProps> = ({ onComplete, onBack }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [kycStep, setKycStep] = useState<'info' | 'doc-front' | 'doc-back' | 'liveness' | 'success'>('info');
    const [registrationUrl, setRegistrationUrl] = useState('');

    useEffect(() => {
        const checkDevice = () => {
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(mobile || window.innerWidth < 1024);
        };

        checkDevice();
        const baseUrl = window.location.origin + window.location.pathname;
        setRegistrationUrl(`${baseUrl}?step=2`);
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    const handleNextKycStep = () => {
        if (kycStep === 'info') setKycStep('doc-front');
        else if (kycStep === 'doc-front') setKycStep('doc-back');
        else if (kycStep === 'doc-back') setKycStep('liveness');
        else if (kycStep === 'liveness') setKycStep('success');
    };

    const renderMobileFlow = () => {
        switch (kycStep) {
            case 'info':
                return (
                    <div className="space-y-6 text-center">
                        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserCheck className="text-primary w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Verificación de Identidad</h3>
                            <p className="text-muted-foreground">
                                Para garantizar la seguridad de nuestra comunidad, necesitamos verificar tu identidad.
                            </p>
                        </div>
                        <ul className="text-left space-y-3 max-w-xs mx-auto">
                            <li className="flex items-center gap-3">
                                <div className="bg-green-500/10 p-1 rounded-full text-green-600">
                                    <CheckCircle2 size={16} />
                                </div>
                                <span className="text-sm">Foto de tu carnet (frente)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="bg-green-500/10 p-1 rounded-full text-green-600">
                                    <CheckCircle2 size={16} />
                                </div>
                                <span className="text-sm">Foto de tu carnet (dorso)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="bg-green-500/10 p-1 rounded-full text-green-600">
                                    <CheckCircle2 size={16} />
                                </div>
                                <span className="text-sm">Prueba de vida (selfie)</span>
                            </li>
                        </ul>
                        <Button onClick={handleNextKycStep} className="w-full">
                            Comenzar Verificación
                        </Button>
                    </div>
                );
            case 'doc-front':
                return (
                    <div className="space-y-6 text-center">
                        <h3 className="text-lg font-semibold">Frente del Carnet</h3>
                        <p className="text-sm text-muted-foreground">
                            Coloca la parte frontal de tu documento dentro del recuadro.
                        </p>
                        <div className="aspect-[1.6/1] w-full border-2 border-dashed border-primary/50 rounded-xl flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
                            <Scan className="w-12 h-12 text-primary/40 mb-2" />
                            <span className="text-xs font-medium text-primary/60">Esperando cámara...</span>
                            <div className="absolute inset-4 border-2 border-primary rounded-lg opacity-20"></div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setKycStep('info')} className="flex-1">
                                Atrás
                            </Button>
                            <Button onClick={handleNextKycStep} className="flex-1">
                                Capturar
                            </Button>
                        </div>
                    </div>
                );
            case 'doc-back':
                return (
                    <div className="space-y-6 text-center">
                        <h3 className="text-lg font-semibold">Dorso del Carnet</h3>
                        <p className="text-sm text-muted-foreground">
                            Ahora captura la parte trasera de tu documento.
                        </p>
                        <div className="aspect-[1.6/1] w-full border-2 border-dashed border-primary/50 rounded-xl flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
                            <Scan className="w-12 h-12 text-primary/40 mb-2" />
                            <span className="text-xs font-medium text-primary/60">Esperando cámara...</span>
                            <div className="absolute inset-4 border-2 border-primary rounded-lg opacity-20"></div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setKycStep('doc-front')} className="flex-1">
                                Atrás
                            </Button>
                            <Button onClick={handleNextKycStep} className="flex-1">
                                Capturar
                            </Button>
                        </div>
                    </div>
                );
            case 'liveness':
                return (
                    <div className="space-y-6 text-center">
                        <h3 className="text-lg font-semibold">Prueba de Vida</h3>
                        <p className="text-sm text-muted-foreground">
                            Mira a la cámara y sigue las instrucciones en pantalla.
                        </p>
                        <div className="aspect-square max-w-[280px] mx-auto w-full border-4 border-primary rounded-full flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
                            <Camera className="w-12 h-12 text-primary/40 mb-2" />
                            <span className="text-xs font-medium text-primary/60">Centra tu rostro</span>
                            <div className="absolute inset-0 rounded-full border-[10px] border-background"></div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setKycStep('doc-back')} className="flex-1">
                                Atrás
                            </Button>
                            <Button onClick={handleNextKycStep} className="flex-1">
                                Iniciar Escaneo
                            </Button>
                        </div>
                    </div>
                );
            case 'success':
                return (
                    <div className="space-y-6 text-center py-4">
                        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="text-green-600 w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">¡Verificación Completa!</h3>
                            <p className="text-muted-foreground">
                                Tus datos han sido procesados correctamente. Puedes continuar con el registro.
                            </p>
                        </div>
                        <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700">
                            Continuar al Paso 3
                        </Button>
                    </div>
                );
        }
    };

    const renderDesktopMessage = () => {
        return (
            <div className="space-y-8 text-center py-6">
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Smartphone className="text-primary" />
                        Continuar en tu Celular
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Por seguridad, la verificación de identidad y biometría facial debe realizarse desde un dispositivo móvil con cámara.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl inline-block border-2 border-primary/20 shadow-xl">
                    <QRCodeSVG value={registrationUrl} size={200} />
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium">1. Escanea el código QR con tu cámara</p>
                        <p className="text-sm font-medium">2. Completa la verificación en tu celular</p>
                        <p className="text-sm font-medium">3. Esta ventana se actualizará automáticamente</p>
                    </div>

                    <div className="pt-4 flex justify-center gap-4">
                        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
                            <ArrowLeft className="mr-2" size={16} />
                            Volver al Paso 1
                        </Button>
                        <Button variant="outline" onClick={() => setIsMobile(true)}>
                            Ya lo hice en mi celular (Simular)
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isMobile ? renderMobileFlow() : renderDesktopMessage()}
        </div>
    );
};

export default KYCVerification;
