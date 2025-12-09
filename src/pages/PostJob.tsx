import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { Building2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { jobsAPI, packagesAPI } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import PackagesModal from '@/components/PackagesModal';

const PostJob = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [salary, setSalary] = useState('');
  const [comuna, setComuna] = useState('');
  const [jobType, setJobType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packagesModalOpen, setPackagesModalOpen] = useState(false);
  const [userLimits, setUserLimits] = useState<{
    jobs: {
      free_limit: number;
      used: number;
      remaining: number;
      requires_payment: boolean;
    } | null;
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [canPublish, setCanPublish] = useState(false);
  const [jobStats, setJobStats] = useState<{
    free_jobs_used?: number;
    free_jobs_limit?: number;
    free_jobs_remaining?: number;
    requires_payment?: boolean;
    is_admin?: boolean;
    unlimited?: boolean;
    total_jobs?: number;
    active_jobs?: number;
    inactive_jobs?: number;
    total_companies?: number;
  } | null>(null);

  useEffect(() => {
    if (isLoggedIn && (user?.roles.includes('company') || user?.roles.includes('super-admin'))) {
      loadJobStats();
      loadUserLimits();
    }
  }, [isLoggedIn, user]);

  const loadJobStats = async () => {
    try {
      const stats = await jobsAPI.getJobStats();
      setJobStats(stats);
    } catch (error) {
      console.error('Error loading job stats:', error);
    }
  };

  const loadUserLimits = async () => {
    try {
      setLoadingLimits(true);
      const limits = await packagesAPI.getUserLimits();
      setUserLimits(limits);
      
      // Si es super-admin, siempre puede publicar
      if (user?.roles.includes('super-admin')) {
        setCanPublish(true);
      } else if (limits.jobs && limits.jobs.requires_payment) {
        // Si requiere pago, mostrar modal y no permitir publicar
        setCanPublish(false);
        setPackagesModalOpen(true);
      } else if (limits.jobs) {
        // Si tiene publicaciones gratis disponibles, permitir publicar
        setCanPublish(true);
      } else {
        // Si no es empresa, no debería estar aquí, pero por seguridad
        setCanPublish(false);
      }
    } catch (error) {
      console.error('Error loading user limits:', error);
      setCanPublish(true); // En caso de error, permitir intentar publicar
    } finally {
      setLoadingLimits(false);
    }
  };

  if (!isLoggedIn || (!user?.roles.includes('company') && !user?.roles.includes('super-admin'))) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !comuna || !jobType) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await jobsAPI.createJob({
        title,
        description,
        requirements: requirements || undefined,
        salary: salary || undefined,
        comuna,
        job_type: jobType as 'fulltime' | 'parttime' | 'shifts' | 'freelance',
      });

      toast.success(response.message);
      await loadJobStats(); // Actualizar estadísticas
      await loadUserLimits(); // Actualizar límites
      navigate('/empleos');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error al publicar empleo';
      
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
              // Si cierra el modal sin seleccionar, volver a empleos
              navigate('/empleos');
            }
          }}
          type="jobs"
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
            <div className="bg-primary/10 p-3 rounded-full">
              <Building2 className="text-primary" size={24} />
            </div>
            <div>
              <CardTitle className="text-3xl font-heading">Publicar Empleo</CardTitle>
              <CardDescription>Encuentra el talento que tu empresa necesita</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Información de límites */}
          {userLimits && userLimits.jobs && !user?.roles.includes('super-admin') && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>
                    Publicaciones gratis: {userLimits.jobs.used} / {userLimits.jobs.free_limit}
                  </span>
                </div>
                {userLimits.jobs.remaining > 0 && (
                  <p className="text-sm mt-1">
                    Te quedan {userLimits.jobs.remaining} publicación(es) gratis
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
          {user?.roles.includes('super-admin') && (
            <Alert className="mb-6 border-blue-500 bg-blue-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Super Administrador:</strong> Puedes crear empleos ilimitados para cualquier empresa.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Título del Cargo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Vendedor/a, Administrativo/a, etc."
                required
              />
            </div>

            <div>
              <Label htmlFor="jobType">Tipo de Jornada *</Label>
              <Select value={jobType} onValueChange={setJobType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de jornada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fulltime">Tiempo Completo</SelectItem>
                  <SelectItem value="parttime">Part-Time</SelectItem>
                  <SelectItem value="shifts">Turnos</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comuna">Comuna *</Label>
              <Input
                id="comuna"
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
                placeholder="Ej: Santiago, Providencia, Maipú"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción del Puesto *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe las responsabilidades y funciones del cargo"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="requirements">Requisitos</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Experiencia, estudios, habilidades necesarias"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="salary">Rango Salarial (Opcional)</Label>
              <Input
                id="salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Ej: $450.000 - $550.000"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/empleos')} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting || !canPublish}
              >
                {isSubmitting ? 'Publicando...' : 'Publicar Empleo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de paquetes (solo se muestra si hay error al publicar) */}
      <PackagesModal
        open={packagesModalOpen && canPublish}
        onOpenChange={setPackagesModalOpen}
        type="jobs"
        onPackageSelect={(packageId) => {
          console.log('Paquete seleccionado:', packageId);
          // Aquí se integría con el sistema de pago
        }}
      />
    </div>
  );
};

export default PostJob;
