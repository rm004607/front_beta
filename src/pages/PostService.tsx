import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { Wrench, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { servicesAPI, packagesAPI } from '@/lib/api';
import PackagesModal from '@/components/PackagesModal';

const PostService = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [comuna, setComuna] = useState(user?.comuna || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packagesModalOpen, setPackagesModalOpen] = useState(false);
  const [userLimits, setUserLimits] = useState<{
    services: {
      free_limit: number;
      used: number;
      remaining: number;
      requires_payment: boolean;
    };
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [canPublish, setCanPublish] = useState(false);

  if (!isLoggedIn) {
    navigate('/registro');
    return null;
  }

  useEffect(() => {
    if (isLoggedIn && (user?.roles.includes('entrepreneur') || user?.roles.includes('super-admin'))) {
      loadUserLimits();
    }
  }, [isLoggedIn, user]);

  const loadUserLimits = async () => {
    try {
      setLoadingLimits(true);
      const limits = await packagesAPI.getUserLimits();
      setUserLimits(limits);
      
      // Si es super-admin, siempre puede publicar
      if (user?.roles.includes('super-admin')) {
        setCanPublish(true);
      } else if (limits.services.requires_payment) {
        // Si requiere pago, mostrar modal y no permitir publicar
        setCanPublish(false);
        setPackagesModalOpen(true);
      } else {
        // Si tiene publicaciones gratis disponibles, permitir publicar
        setCanPublish(true);
      }
    } catch (error) {
      console.error('Error loading user limits:', error);
      setCanPublish(true); // En caso de error, permitir intentar publicar
    } finally {
      setLoadingLimits(false);
    }
  };

  // Verificar que el usuario sea emprendedor o super-admin (opcional, el backend también lo valida)
  if (!user?.roles.includes('entrepreneur') && !user?.roles.includes('super-admin')) {
    toast.error('Solo los emprendedores pueden publicar servicios');
    navigate('/servicios');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !description || !comuna) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await servicesAPI.createService({
        service_name: service,
        description,
        price_range: priceRange || undefined,
        comuna,
        phone: phone || undefined,
      });

      toast.success(response.message);
      await loadUserLimits(); // Actualizar límites
      navigate('/servicios');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error al publicar servicio';
      
      // Si el error indica que requiere pago, abrir modal de paquetes
      if (error.requires_payment || error.status === 403) {
        setPackagesModalOpen(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si está cargando límites, mostrar loading
  if (loadingLimits) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-2">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Verificando límites de publicaciones...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si requiere pago, solo mostrar el modal (el formulario no se muestra)
  if (!canPublish) {
    return (
      <>
        <PackagesModal
          open={packagesModalOpen}
          onOpenChange={(open) => {
            setPackagesModalOpen(open);
            if (!open) {
              // Si cierra el modal sin seleccionar, volver a servicios
              navigate('/servicios');
            }
          }}
          type="services"
          onPackageSelect={(packageId) => {
            console.log('Paquete seleccionado:', packageId);
            // Aquí se integraría con el sistema de pago
            // Después del pago, se actualizarían los límites y se podría publicar
          }}
        />
      </>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-secondary/10 p-3 rounded-full">
              <Wrench className="text-secondary" size={24} />
            </div>
            <div>
              <CardTitle className="text-3xl font-heading">Ofrecer Servicio</CardTitle>
              <CardDescription>Promociona tu oficio o emprendimiento</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Información de límites */}
          {userLimits && !user?.roles.includes('super-admin') && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>
                    Publicaciones gratis: {userLimits.services.used} / {userLimits.services.free_limit}
                  </span>
                </div>
                {userLimits.services.remaining > 0 && (
                  <p className="text-sm mt-1">
                    Te quedan {userLimits.services.remaining} publicación(es) gratis
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="service">Servicio que Ofreces *</Label>
              <Input
                id="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Ej: Gasfitería, Peluquería, Diseño Web"
                required
              />
            </div>

            <div>
              <Label htmlFor="comuna">Comuna *</Label>
              <Input
                id="comuna"
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
                placeholder="Comuna donde ofreces el servicio"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción de tu Servicio *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu experiencia, qué servicios específicos ofreces, etc."
                rows={5}
                required
              />
            </div>

            <div>
              <Label htmlFor="priceRange">Rango de Precio (Opcional)</Label>
              <Input
                id="priceRange"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="Ej: $15.000 - $30.000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Indica un rango aproximado para que los clientes tengan una referencia
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Teléfono de Contacto (Opcional)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={user?.phone || 'Ej: +56 9 1234 5678'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Si no proporcionas un teléfono, se usará el de tu perfil
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/servicios')} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-secondary hover:bg-secondary/90" 
                disabled={isSubmitting || !canPublish}
              >
                {isSubmitting ? 'Publicando...' : 'Publicar Servicio'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de paquetes (solo se muestra si hay error al publicar) */}
      <PackagesModal
        open={packagesModalOpen && canPublish}
        onOpenChange={setPackagesModalOpen}
        type="services"
        onPackageSelect={(packageId) => {
          console.log('Paquete seleccionado:', packageId);
          // Aquí se integraría con el sistema de pago
        }}
      />
    </div>
  );
};

export default PostService;
