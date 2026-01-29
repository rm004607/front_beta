import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { flowAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const FlowCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'cancelled'>('loading');
    const [paymentDetails, setPaymentDetails] = useState<any>(null);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('failed');
            toast.error('Token de pago no encontrado');
            return;
        }

        // Verificar estado del pago
        const checkPayment = async () => {
            try {
                const payment = await flowAPI.getPaymentStatus(token);
                setPaymentDetails(payment);

                if (payment.status === 'completed') {
                    setStatus('success');
                    toast.success('¡Pago completado exitosamente!');
                } else if (payment.status === 'cancelled') {
                    setStatus('cancelled');
                    toast.info('Pago cancelado');
                } else if (payment.status === 'failed') {
                    setStatus('failed');
                    toast.error('El pago ha fallado');
                } else {
                    // Still pending, check again in a moment
                    setTimeout(checkPayment, 2000);
                }
            } catch (error: any) {
                console.error('Error checking payment:', error);
                setStatus('failed');
                toast.error(error.message || 'Error al verificar el pago');
            }
        };

        checkPayment();
    }, [searchParams]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(price);
    };

    const handleContinue = () => {
        if (paymentDetails?.packageType === 'whatsapp_contact' && paymentDetails?.targetPhone) {
            const cleanPhone = paymentDetails.targetPhone.replace(/\D/g, '');
            const whatsappPhone = cleanPhone.startsWith('56') ? `+${cleanPhone}` : `+56${cleanPhone}`;
            const message = `Hola ${paymentDetails.targetName || ''}, contacté contigo a través de Beta.`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${whatsappPhone}?text=${encodedMessage}`, '_blank');
            navigate('/wall');
        } else if (paymentDetails?.packageType === 'services') {
            navigate('/post-service');
        } else {
            navigate('/post-job');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    {status === 'loading' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            </div>
                            <CardTitle>Verificando pago...</CardTitle>
                            <CardDescription>
                                Por favor espera mientras verificamos tu transacción
                            </CardDescription>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <CardTitle className="text-green-600">¡Pago exitoso!</CardTitle>
                            <CardDescription>
                                Tu paquete ha sido activado correctamente
                            </CardDescription>
                        </>
                    )}

                    {(status === 'failed' || status === 'cancelled') && (
                        <>
                            <div className="flex justify-center mb-4">
                                <XCircle className="h-16 w-16 text-red-500" />
                            </div>
                            <CardTitle className="text-red-600">
                                {status === 'cancelled' ? 'Pago cancelado' : 'Pago fallido'}
                            </CardTitle>
                            <CardDescription>
                                {status === 'cancelled'
                                    ? 'Has cancelado el proceso de pago'
                                    : 'Hubo un problema procesando tu pago'}
                            </CardDescription>
                        </>
                    )}
                </CardHeader>

                {paymentDetails && status === 'success' && (
                    <CardContent className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                    {paymentDetails.packageType === 'whatsapp_contact' ? 'Contacto:' : 'Paquete:'}
                                </span>
                                <span className="text-sm font-medium">
                                    {paymentDetails.packageType === 'whatsapp_contact'
                                        ? paymentDetails.targetName
                                        : paymentDetails.packageId.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Monto:</span>
                                <span className="text-sm font-medium">
                                    {formatPrice(paymentDetails.amount)}
                                </span>
                            </div>
                            {paymentDetails.packageType !== 'whatsapp_contact' && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Publicaciones:</span>
                                    <span className="text-sm font-medium">
                                        +{paymentDetails.publicationsAdded}
                                    </span>
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleContinue}
                        >
                            Continuar
                        </Button>
                    </CardContent>
                )}

                {(status === 'failed' || status === 'cancelled') && (
                    <CardContent>
                        <div className="space-y-2">
                            <Button
                                className="w-full"
                                onClick={() => navigate('/')}
                            >
                                Ir al Inicio
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export default FlowCallback;
