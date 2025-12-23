import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { packagesAPI } from '@/lib/api';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface Package {
  id: string;
  name: string;
  description: string;
  publications: number;
  price: number;
  type: string;
}

interface PackagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'services' | 'jobs';
  onPackageSelect?: (packageId: string) => void;
}

const PackagesModal = ({ open, onOpenChange, type, onPackageSelect }: PackagesModalProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadPackages();
    }
  }, [open, type]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = type === 'services'
        ? await packagesAPI.getServicePackages()
        : await packagesAPI.getJobPackages();
      setPackages(response.packages);
    } catch (error: any) {
      console.error('Error loading packages:', error);
      toast.error(error.message || 'Error al cargar paquetes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = async (packageId: string) => {
    setSelectedPackage(packageId);
    if (onPackageSelect) {
      onPackageSelect(packageId);
    }

    try {
      setLoading(true);
      toast.loading('Preparando pago...');

      // Crear pago en Flow
      const { flowAPI } = await import('@/lib/api');
      const response = await flowAPI.createPayment(packageId, type);

      // Redirigir a Flow para completar el pago
      window.location.href = response.url;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.dismiss();
      toast.error(error.message || 'Error al iniciar el pago. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Paquetes de {type === 'services' ? 'Servicios/Pymes' : 'Empleos'}
          </DialogTitle>
          <DialogDescription>
            Has alcanzado el límite de publicaciones gratis. Elige un paquete para continuar publicando.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando paquetes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${selectedPackage === pkg.id ? 'ring-2 ring-primary' : ''
                  }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    {pkg.name.includes('Premium') && (
                      <Badge variant="default" className="ml-2">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-primary">
                        {formatPrice(pkg.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pkg.publications} publicaciones
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{pkg.publications} publicaciones adicionales</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Publicaciones ilimitadas en el tiempo</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Soporte prioritario</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPackage(pkg.id);
                      }}
                      variant={selectedPackage === pkg.id ? 'default' : 'outline'}
                    >
                      Seleccionar Paquete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Nota:</strong> Serás redirigido a Flow para completar el pago de forma segura.
            Una vez completado, tus publicaciones adicionales se activarán automáticamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackagesModal;
