import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { applicationsAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Application {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  job_title: string;
  company_id: string;
  company_name?: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  user_comuna: string;
  profile_image: string | null;
  cv_url: string | null;
}

const Applications = () => {
  const { user, isLoggedIn } = useUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterJob, setFilterJob] = useState<string>('all');

  useEffect(() => {
    if (isLoggedIn) {
      loadApplications();
    }
  }, [isLoggedIn]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getCompanyApplications();
      setApplications(response.applications || []);
    } catch (error: any) {
      console.error('Error loading applications:', error);
      toast.error(error.message || 'Error al cargar postulaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setShowApplicationDialog(true);
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await applicationsAPI.updateApplicationStatus(applicationId, newStatus);
      toast.success('Estado actualizado exitosamente');
      loadApplications();
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication({ ...selectedApplication, status: newStatus });
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Error al actualizar estado');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedApplication) return;

    try {
      setSendingEmail(true);
      await applicationsAPI.sendEmailToApplicant(
        selectedApplication.id,
        emailSubject || undefined,
        emailMessage || undefined
      );
      toast.success('Correo enviado exitosamente');
      setShowEmailDialog(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Error al enviar correo');
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      pending: { label: 'Pendiente', variant: 'outline', icon: Clock },
      reviewed: { label: 'Revisado', variant: 'secondary', icon: Eye },
      accepted: { label: 'Aceptado', variant: 'default', icon: CheckCircle },
      rejected: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={12} />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredApplications = applications.filter(app => {
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    const jobMatch = filterJob === 'all' || app.job_id === filterJob;
    return statusMatch && jobMatch;
  });

  const uniqueJobs = Array.from(
    new Map(applications.map(app => [app.job_id, { id: app.job_id, title: app.job_title }])).values()
  );

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Debes iniciar sesión para ver las postulaciones
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canViewApplications =
    user?.roles.includes('company') ||
    user?.roles.includes('admin') ||
    user?.roles.includes('super-admin');

  if (!canViewApplications) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No tienes permisos para ver las postulaciones
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold mb-2">Postulaciones</h1>
        <p className="text-muted-foreground">
          Gestiona las postulaciones a tus empleos
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status-filter">Filtrar por estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="reviewed">Revisado</SelectItem>
                  <SelectItem value="accepted">Aceptado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="job-filter">Filtrar por empleo</Label>
              <Select value={filterJob} onValueChange={setFilterJob}>
                <SelectTrigger id="job-filter">
                  <SelectValue placeholder="Todos los empleos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueJobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de postulaciones */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No hay postulaciones {filterStatus !== 'all' || filterJob !== 'all' ? 'con esos filtros' : ''}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar
                      className="w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleViewApplication(application)}
                    >
                      {application.profile_image && (
                        <AvatarImage src={application.profile_image} alt={application.user_name} />
                      )}
                      <AvatarFallback className="bg-primary text-white text-lg">
                        {application.user_name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3
                          className="text-xl font-semibold cursor-pointer hover:underline"
                          onClick={() => handleViewApplication(application)}
                        >
                          {application.user_name}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Briefcase size={14} />
                          <span>{application.job_title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{application.user_comuna}</span>
                        </div>
                        <span>{formatDate(application.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewApplication(application)}
                    >
                      <Eye size={16} className="mr-2" />
                      Ver
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para ver detalles de la postulación */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Postulación</DialogTitle>
            <DialogDescription>
              Información del postulante y su CV
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Información del usuario */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="w-20 h-20">
                  {selectedApplication.profile_image && (
                    <AvatarImage src={selectedApplication.profile_image} alt={selectedApplication.user_name} />
                  )}
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {selectedApplication.user_name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedApplication.user_name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {selectedApplication.user_email && (
                      <div className="flex items-center gap-1">
                        <Mail size={14} />
                        <span>{selectedApplication.user_email}</span>
                      </div>
                    )}
                    {selectedApplication.user_phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        <span>{selectedApplication.user_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{selectedApplication.user_comuna}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(selectedApplication.status)}
              </div>

              {/* Información del empleo */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Briefcase size={16} />
                  Empleo al que postuló
                </h4>
                <p className="text-muted-foreground">{selectedApplication.job_title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Postulado el {formatDate(selectedApplication.created_at)}
                </p>
              </div>

              {/* Mensaje del postulante */}
              {selectedApplication.message && (
                <div>
                  <h4 className="font-semibold mb-2">Mensaje del postulante</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-lg">
                    {selectedApplication.message}
                  </p>
                </div>
              )}

              {/* CV */}
              {selectedApplication.cv_url ? (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Curriculum Vitae
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        try {
                          let cvUrl = selectedApplication.cv_url!;

                          // Validar URL
                          if (!cvUrl.startsWith('http://') && !cvUrl.startsWith('https://')) {
                            toast.error('URL del CV no válido');
                            return;
                          }

                          // Para Cloudinary, agregar parámetro para forzar descarga
                          if (cvUrl.includes('cloudinary.com')) {
                            cvUrl = cvUrl + (cvUrl.includes('?') ? '&' : '?') + 'fl_attachment';
                          }

                          const link = document.createElement('a');
                          link.href = cvUrl;
                          link.download = `CV_${selectedApplication.user_name}.pdf`;
                          link.target = '_blank';
                          link.rel = 'noopener noreferrer';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          toast.success('Descargando CV...');
                        } catch (error) {
                          console.error('Error downloading CV:', error);
                          toast.error('Error al descargar el CV');
                        }
                      }}
                    >
                      <Download size={16} className="mr-2" />
                      Descargar CV
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Curriculum Vitae
                  </h4>
                  <p className="text-muted-foreground">El postulante no ha subido CV</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => handleStatusChange(selectedApplication.id, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="reviewed">Revisado</SelectItem>
                    <SelectItem value="accepted">Aceptado</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Applications;
