import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, QrCode, Scan, Camera, UserCheck, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { kycAPI } from '@/lib/api';

interface KYCVerificationProps {
    email?: string;
    onComplete: () => void;
    onBack: () => void;
}

const KYCVerification: React.FC<KYCVerificationProps> = ({ email, onComplete, onBack }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [kycStatus, setKycStatus] = useState<'not_started' | 'pending' | 'verified' | 'rejected'>('not_started');
    const [kycStep, setKycStep] = useState<'info' | 'doc-front' | 'doc-back' | 'liveness' | 'submitting'>('info');
    const [registrationUrl, setRegistrationUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState<{ front?: File; back?: File; face?: File }>({});

    useEffect(() => {
        const checkDevice = () => {
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            setIsMobile(mobile || window.innerWidth < 1024);
        };

        checkDevice();
        const baseUrl = window.location.origin + window.location.pathname;
        const urlWithParams = new URL(baseUrl);
        urlWithParams.searchParams.set('step', '2');
        if (email) urlWithParams.searchParams.set('email', email);

        setRegistrationUrl(urlWithParams.toString());
        window.addEventListener('resize', checkDevice);

        // Fetch initial status
        fetchStatus();

        return () => window.removeEventListener('resize', checkDevice);
    }, [email]);

    const fetchStatus = async () => {
        try {
            const response = await kycAPI.getKYCStatus();
            setKycStatus(response.kyc.kyc_status);
            if (response.kyc.kyc_status === 'verified') {
                onComplete();
            }
        } catch (error) {
            console.error('Error fetching KYC status:', error);
            // Default to not_started if not logged in or error
            setKycStatus('not_started');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (step: 'front' | 'back' | 'face', file: File) => {
        setFiles(prev => ({ ...prev, [step]: file }));
        if (step === 'front') setKycStep('doc-back');
        else if (step === 'back') setKycStep('liveness');
        else if (step === 'face') handleSubmitKYC(file);
    };

    const handleSubmitKYC = async (faceFile: File) => {
        setKycStep('submitting');
        const formData = new FormData();
        if (files.front) formData.append('id_front', files.front);
        if (files.back) formData.append('id_back', files.back);
        formData.append('face_photo', faceFile);
        if (email) formData.append('email', email);

        try {
            await kycAPI.uploadKYC(formData);
            setKycStatus('pending');
            toast.success('Documentos subidos correctamente. En revisión.');
        } catch (error: any) {
            const msg = error.message || 'Error desconocido';
            toast.error(`Error al subir: ${msg}. Inténtalo de nuevo.`);
            setKycStep('info');
            setKycStatus('rejected');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Cargando estado de verificación...</p>
            </div>
        );
    }

    if (kycStatus === 'pending') {
        return (
            <div className="space-y-6 text-center py-8">
                <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Loader2 className="text-yellow-600 w-10 h-10 animate-spin" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Verificación en Proceso</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Estamos revisando tus documentos. Esto suele tardar unos minutos.
                        Te avisaremos cuando esté listo.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchStatus} className="mt-4">
                    Actualizar Estado
                </Button>
            </div>
        );
    }

    if (kycStatus === 'verified') {
        return (
            <div className="space-y-6 text-center py-8">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-green-600 w-12 h-12" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Identidad Verificada</h3>
                    <p className="text-muted-foreground">Tu cuenta está protegida y verificada.</p>
                </div>
                <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700">
                    Continuar al Paso 3
                </Button>
            </div>
        );
    }

    if (!isMobile) {
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
                        <Button variant="outline" onClick={fetchStatus}>
                            Ya lo completé
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Mobile Flow
    const renderStep = () => {
        switch (kycStep) {
            case 'info':
                return (
                    <div className="space-y-6 text-center">
                        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserCheck className="text-primary w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Verificación de Identidad</h3>
                            {kycStatus === 'rejected' && (
                                <div className="bg-destructive/10 p-3 rounded-lg flex items-center gap-2 text-destructive text-sm mb-4">
                                    <AlertCircle size={16} />
                                    <span>Tu verificación previa fue rechazada. Por favor, reintenta con fotos más claras.</span>
                                </div>
                            )}
                            <p className="text-muted-foreground">
                                Necesitamos validar tu identidad antes de completar el registro.
                            </p>
                        </div>
                        <ul className="text-left space-y-3 max-w-xs mx-auto mb-6">
                            <li className="flex items-center gap-3">
                                <CheckCircle2 size={18} className="text-primary" />
                                <span className="text-sm font-medium">Foto frontal carnet</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 size={18} className="text-primary" />
                                <span className="text-sm font-medium">Foto posterior carnet</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 size={18} className="text-primary" />
                                <span className="text-sm font-medium">Verificación facial</span>
                            </li>
                        </ul>
                        <Button onClick={() => setKycStep('doc-front')} className="w-full">
                            Comenzar ahora
                        </Button>
                    </div>
                );
            case 'doc-front':
            case 'doc-back':
                const isFront = kycStep === 'doc-front';
                return (
                    <div className="space-y-6 text-center">
                        <h3 className="text-lg font-semibold">{isFront ? 'Frente' : 'Dorso'} del Carnet</h3>
                        <p className="text-sm text-muted-foreground">
                            Carga una foto clara del {isFront ? 'frente' : 'dorso'} de tu cédula.
                        </p>
                        <div className="aspect-[1.6/1] w-full border-2 border-dashed border-primary/50 rounded-xl flex flex-col items-center justify-center bg-muted/30 relative">
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files?.[0] && handleFileChange(isFront ? 'front' : 'back', e.target.files[0])}
                            />
                            <Upload className="w-12 h-12 text-primary/40 mb-2" />
                            <span className="text-sm font-medium text-primary/60">Haz clic para tomar foto</span>
                        </div>
                        <Button variant="ghost" onClick={() => setKycStep(isFront ? 'info' : 'doc-front')}>
                            Volver
                        </Button>
                    </div>
                );
            case 'liveness':
                return (
                    <div className="space-y-6 text-center">
                        <h3 className="text-lg font-semibold">Selfie de Verificación</h3>
                        <p className="text-sm text-muted-foreground">
                            Tómate una selfie para confirmar tu identidad.
                        </p>
                        <div className="aspect-square max-w-[280px] mx-auto w-full border-4 border-primary rounded-full flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
                            <input
                                type="file"
                                accept="image/*"
                                capture="user"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={(e) => e.target.files?.[0] && handleFileChange('face', e.target.files[0])}
                            />
                            <Camera className="w-12 h-12 text-primary/40 mb-2" />
                            <span className="text-sm font-medium text-primary/60">Tomar Selfie</span>
                        </div>
                        <Button variant="ghost" onClick={() => setKycStep('doc-back')}>
                            Volver
                        </Button>
                    </div>
                );
            case 'submitting':
                return (
                    <div className="space-y-6 text-center py-12">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                        <h3 className="text-xl font-bold">Subiendo Documentos</h3>
                        <p className="text-muted-foreground">Estamos procesando tu información, por favor no cierres esta ventana.</p>
                    </div>
                );
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderStep()}
        </div>
    );
};

export default KYCVerification;
