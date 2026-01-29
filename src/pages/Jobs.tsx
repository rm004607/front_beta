import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Building2, MapPin, Clock, DollarSign, Search, Filter, Plus, Loader2, CheckCircle, FileText, Calendar, TrendingUp, X, Trash2, Edit } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/contexts/UserContext';
import { jobsAPI, applicationsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Jobs = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [searchTerm, setSearchTerm] = useState('');
  const [comunaFilter, setComunaFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [appliedJobTitle, setAppliedJobTitle] = useState('');

  const isCompany = user?.roles.includes('company');
  const isAdmin = user?.roles.includes('admin') || user?.role_number === 5;
  const canPublishJob = isCompany || isAdmin; // Company, admin y super-admin pueden publicar
  const canApply = isLoggedIn && !isCompany; // Todos menos empresas pueden postular

  useEffect(() => {
    loadJobs();
  }, [searchTerm, comunaFilter, typeFilter]);

  // Efecto para scroll al elemento resaltado
  useEffect(() => {
    if (highlightId && !loading && jobs.length > 0) {
      // Pequeño timeout para asegurar renderizado
      setTimeout(() => {
        const element = document.getElementById(`job-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [highlightId, loading, jobs]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await jobsAPI.getJobs({
        search: searchTerm || undefined,
        comuna: comunaFilter !== 'all' ? comunaFilter : undefined,
        job_type: typeFilter !== 'all' ? typeFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setJobs(response.jobs);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Error al cargar empleos');
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fulltime: 'Tiempo Completo',
      parttime: 'Part-Time',
      shifts: 'Turnos',
      freelance: 'Freelance',
    };
    return labels[type] || type;
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el empleo "${title}"?`)) return;

    try {
      await jobsAPI.deleteJob(id);
      toast.success('Empleo eliminado correctamente');
      loadJobs();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast.error(error.message || 'Error al eliminar el empleo');
    }
  };


  const handleApply = async (jobId: string, jobTitle: string) => {
    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para postular');
      navigate('/login');
      return;
    }

    if (isCompany) {
      toast.error('Las empresas no pueden postular a empleos');
      return;
    }

    // Verificar si el usuario tiene CV
    if (!user?.cv_url) {
      toast.error('Debes tener un CV en tu perfil para postular a empleos');
      navigate('/perfil?upload_cv=true');
      return;
    }

    try {
      setIsApplying(true);
      setSelectedJobId(jobId);
      await applicationsAPI.applyToJob(jobId);
      setAppliedJobTitle(jobTitle);
      setShowSuccessModal(true);
      // Actualizar el estado del empleo para mostrar "Ya postulaste"
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobId ? { ...job, has_applied: true } : job
        )
      );
      toast.success('¡Postulación enviada exitosamente!');
    } catch (error: any) {
      console.error('Error applying to job:', error);
      // Si el error es que no tiene CV, redirigir
      if (error.message?.includes('CV') || error.message?.includes('curriculum')) {
        toast.error('Debes tener un CV en tu perfil para postular');
        navigate('/perfil?upload_cv=true');
      } else {
        toast.error(error.message || 'Error al postular al empleo');
      }
    } finally {
      setIsApplying(false);
      setSelectedJobId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold">Ofertas de Empleo</h1>
          <p className="text-muted-foreground">Encuentra tu próxima oportunidad laboral</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {canPublishJob && (
            <Link to="/empleos/publicar">
              <Button className="w-full sm:w-auto">
                <Plus size={18} className="mr-2" />
                Publicar Empleo
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar por cargo o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={comunaFilter} onValueChange={setComunaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Comuna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las comunas</SelectItem>
                <SelectItem value="santiago">Santiago Centro</SelectItem>
                <SelectItem value="providencia">Providencia</SelectItem>
                <SelectItem value="lascondes">Las Condes</SelectItem>
                <SelectItem value="maipu">Maipú</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de jornada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="fulltime">Tiempo Completo</SelectItem>
                <SelectItem value="parttime">Part-Time</SelectItem>
                <SelectItem value="shifts">Turnos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                id={`job-${job.id}`}
                className={`hover:shadow-lg transition-all duration-500 border-2 ${String(job.id) === highlightId
                  ? 'border-destructive shadow-xl ring-4 ring-destructive/15 scale-[1.02]'
                  : 'border-border'
                  }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-base">
                        <Avatar className="w-8 h-8">
                          {job.profile_image && (
                            <AvatarImage src={job.profile_image} alt={job.company_name} />
                          )}
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {job.company_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <Building2 size={16} />
                        {job.company_name}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {getJobTypeLabel(job.job_type)}
                      </Badge>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => navigate(`/admin?tab=jobs&search=${job.company_name}`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteJob(job.id, job.title)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Descripción */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase">Descripción</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                    </div>

                    {/* Requisitos */}
                    {job.requirements && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase flex items-center gap-2">
                          <FileText size={14} />
                          Requisitos
                        </h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
                      </div>
                    )}

                    {/* Información adicional */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-secondary" />
                        <span className="font-medium">{job.comuna}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign size={16} className="text-primary" />
                          <span className="font-medium">{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={16} />
                        <span>Publicado: {new Date(job.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón de postulación */}
                  <div className="pt-4 border-t mt-4">
                    {canApply ? (
                      !user?.cv_url ? (
                        <Button
                          onClick={() => {
                            toast.error('Debes tener un CV en tu perfil para postular a empleos');
                            navigate('/perfil?upload_cv=true');
                          }}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          <FileText size={16} className="mr-2" />
                          Agregar CV para Postular
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleApply(job.id, job.title)}
                          disabled={(isApplying && selectedJobId === job.id) || job.has_applied}
                          variant={job.has_applied ? 'outline' : 'default'}
                          className="w-full sm:w-auto"
                        >
                          {isApplying && selectedJobId === job.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Postulando...
                            </>
                          ) : job.has_applied ? (
                            <>
                              <CheckCircle size={16} className="mr-2" />
                              Ya postulaste
                            </>
                          ) : (
                            'Postular Ahora'
                          )}
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!isLoggedIn) {
                            toast.error('Debes iniciar sesión para postular');
                            navigate('/login');
                          } else {
                            toast.info('Las empresas no pueden postular a empleos');
                          }
                        }}
                        className="w-full sm:w-auto"
                      >
                        {isLoggedIn ? 'No disponible' : 'Inicia sesión para postular'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {jobs.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No se encontraron empleos con esos filtros</p>
            </div>
          )}
        </>
      )}

      {/* Modal de éxito con animación del logo de Beta */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">¡Postulación Enviada!</DialogTitle>
            <DialogDescription className="text-center">
              Tu postulación se hizo correctamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            {/* Animación del logo de Beta */}
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/android-chrome-192x192.png"
                  alt="Dameldato"
                  className="w-24 h-24 animate-bounce"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-2 border-primary/20 rounded-full animate-ping"></div>
              </div>
            </div>
            <p className="text-center text-lg font-semibold mb-2">
              ¡Postulación exitosa!
            </p>
            <p className="text-center text-muted-foreground mb-4">
              Has postulado a: <strong>{appliedJobTitle}</strong>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              La empresa revisará tu postulación y te contactará pronto.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowSuccessModal(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;

