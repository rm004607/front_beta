import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface EmailVerificationModalProps {
    open: boolean;
    email: string;
    onVerify: (code: string) => void;
    onResend: () => void;
    onClose: () => void;
    isVerifying: boolean;
}

const EmailVerificationModal = ({
    open,
    email,
    onVerify,
    onResend,
    onClose,
    isVerifying,
}: EmailVerificationModalProps) => {
    const [code, setCode] = useState('');
    const [isResending, setIsResending] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            toast.error('El código debe tener 6 dígitos');
            return;
        }
        onVerify(code);
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            await onResend();
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-2xl">
                        Verifica tu email
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Hemos enviado un código de 6 dígitos a:
                        <br />
                        <strong className="text-foreground">{email}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Input
                            type="text"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setCode(value);
                            }}
                            className="text-center text-2xl tracking-widest font-mono"
                            maxLength={6}
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            El código expira en 10 minutos
                        </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={code.length !== 6 || isVerifying}>
                        {isVerifying ? 'Verificando...' : 'Verificar y Continuar'}
                    </Button>

                    <div className="text-center">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleResend}
                            disabled={isResending}
                            className="text-sm"
                        >
                            {isResending ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                '¿No recibiste el código? Reenviar'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EmailVerificationModal;
