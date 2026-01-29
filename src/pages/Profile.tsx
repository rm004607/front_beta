import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/contexts/UserContext';
import logoDameldato from '/logoicono.png';
import { MapPin, Phone, Mail, Edit, Briefcase, Wrench, Building2, MessageSquare, Trash2, Upload, X, FileText, Download, AlertCircle, Users, Eye, Plus } from 'lucide-react';
import { postsAPI, servicesAPI, jobsAPI, authAPI, applicationsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Post {
  id: string;
  type: string;
  content: string;
  comuna: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

interface Service {
  id: string;
  service_name: string;
  description: string;
  price_range?: string;
  comuna: string;
  status: string;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  comuna: string;
  job_type: string;
  is_active: number;
  created_at: string;
}

const Profile = () => {
  const { user, isLoggedIn, isLoading, loadUser } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editComuna, setEditComuna] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCV, setSelectedCV] = useState<File | null>(null);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [showCVSection, setShowCVSection] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [jobApplications, setJobApplications] = useState<Record<string, any[]>>({});
  const [loadingApplications, setLoadingApplications] = useState<Record<string, boolean>>({});
  const [expandedJobApplications, setExpandedJobApplications] = useState<string | null>(null);
  // Estados para edición
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  // Estados para completar perfil
  const [showCompleteProfileDialog, setShowCompleteProfileDialog] = useState(false);
  const [completePhone, setCompletePhone] = useState('');
  const [completeComuna, setCompleteComuna] = useState('');
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostComuna, setEditPostComuna] = useState('');
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editServicePriceRange, setEditServicePriceRange] = useState('');
  const [editServiceComuna, setEditServiceComuna] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editJobDescription, setEditJobDescription] = useState('');
  const [editJobRequirements, setEditJobRequirements] = useState('');
  const [editJobSalary, setEditJobSalary] = useState('');
  const [editJobComuna, setEditJobComuna] = useState('');
  const [editJobType, setEditJobType] = useState('');

  // Definir funciones antes de los hooks que las usan
  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await postsAPI.getMyPosts();
      setPosts(response.posts || []);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error(error.message || 'Error al cargar publicaciones');
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await servicesAPI.getMyServices();
      setServices(response.services || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error(error.message || 'Error al cargar servicios');
    } finally {
      setLoadingServices(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await jobsAPI.getMyJobs();
      const jobsList = response.jobs || [];
      setJobs(jobsList);

      // Cargar aplicaciones para cada empleo
      for (const job of jobsList) {
        try {
          const appsResponse = await applicationsAPI.getJobApplications(job.id);
          setJobApplications((prev) => ({ ...prev, [job.id]: appsResponse.applications }));
        } catch (error) {
          // Si hay error, simplemente no cargar aplicaciones para ese empleo
          console.error(`Error loading applications for job ${job.id}:`, error);
        }
      }
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast.error(error.message || 'Error al cargar empleos');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      return;
    }

    try {
      await postsAPI.deletePost(postId);
      toast.success('Publicación eliminada');
      loadPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Error al eliminar publicación');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      await servicesAPI.deleteService(serviceId);
      toast.success('Servicio eliminado');
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Error al eliminar servicio');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este empleo?')) {
      return;
    }

    try {
      await jobsAPI.deleteJob(jobId);
      toast.success('Empleo eliminado');
      loadJobs();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast.error(error.message || 'Error al eliminar empleo');
    }
  };

  // Funciones de edición
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPostContent(post.content);
    setEditPostComuna(post.comuna);
  };

  const handleSavePost = async () => {
    if (!editingPost || !editPostContent.trim() || !editPostComuna.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    // Nota: No hay endpoint de actualización de posts aún, por ahora solo mostramos un mensaje
    toast.info('La funcionalidad de edición de publicaciones estará disponible pronto');
    setEditingPost(null);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setEditServiceName(service.service_name);
    setEditServiceDescription(service.description);
    setEditServicePriceRange(service.price_range || '');
    setEditServiceComuna(service.comuna);
  };

  const handleSaveService = async () => {
    if (!editingService || !editServiceName.trim() || !editServiceDescription.trim() || !editServiceComuna.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    try {
      await servicesAPI.updateService(editingService.id, {
        service_name: editServiceName,
        description: editServiceDescription,
        price_range: editServicePriceRange || undefined,
        comuna: editServiceComuna,
      });
      toast.success('Servicio actualizado exitosamente');
      setEditingService(null);
      loadServices();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast.error(error.message || 'Error al actualizar servicio');
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setEditJobTitle(job.title);
    setEditJobDescription(job.description);
    setEditJobRequirements((job as any).requirements || '');
    setEditJobSalary((job as any).salary || '');
    setEditJobComuna(job.comuna);
    setEditJobType(job.job_type);
  };

  const handleSaveJob = async () => {
    if (!editingJob || !editJobTitle.trim() || !editJobDescription.trim() || !editJobComuna.trim() || !editJobType) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    try {
      await jobsAPI.updateJob(editingJob.id, {
        title: editJobTitle,
        description: editJobDescription,
        requirements: editJobRequirements || undefined,
        salary: editJobSalary || undefined,
        comuna: editJobComuna,
        job_type: editJobType as 'fulltime' | 'parttime' | 'shifts' | 'freelance',
      });
      toast.success('Empleo actualizado exitosamente');
      setEditingJob(null);
      loadJobs();
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast.error(error.message || 'Error al actualizar empleo');
    }
  };

  const handleToggleJobApplications = async (jobId: string) => {
    if (expandedJobApplications === jobId) {
      setExpandedJobApplications(null);
      return;
    }

    setExpandedJobApplications(jobId);

    if (!jobApplications[jobId]) {
      try {
        setLoadingApplications((prev) => ({ ...prev, [jobId]: true }));
        const response = await applicationsAPI.getJobApplications(jobId);
        setJobApplications((prev) => ({ ...prev, [jobId]: response.applications }));
      } catch (error: any) {
        console.error('Error loading applications:', error);
        toast.error(error.message || 'Error al cargar postulaciones');
      } finally {
        setLoadingApplications((prev) => ({ ...prev, [jobId]: false }));
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-CL');
    } catch {
      return dateString;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'job-seeker':
        return <Briefcase size={16} />;
      case 'entrepreneur':
        return <Wrench size={16} />;
      case 'company':
        return <Building2 size={16} />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'job-seeker':
        return 'Buscador de Empleo';
      case 'entrepreneur':
        return 'Emprendedor';
      case 'company':
        return 'Empresa';
      case 'admin':
        return 'Administrador';
      case 'super-admin':
        return 'Super Admin';
      default:
        return role;
    }
  };

  const handleOpenEditDialog = () => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditComuna(user.comuna);
      setImagePreview(user.profile_image || null);
      setSelectedImage(null);
      setIsEditDialogOpen(true);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen');
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(user?.profile_image || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadImage = async (): Promise<{ url: string; public_id: string } | null> => {
    if (!selectedImage) return null;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', selectedImage);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      return { url: data.url, public_id: data.public_id };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Error al subir la imagen');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Subir imagen si hay una nueva
      let imageUrl = user.profile_image || null;
      let imagePublicId = null;
      if (selectedImage) {
        const uploadResult = await handleUploadImage();
        if (uploadResult) {
          imageUrl = uploadResult.url;
          imagePublicId = uploadResult.public_id;
        } else {
          // Si falla la subida, cancelar la actualización
          setIsUpdating(false);
          return;
        }
      }

      // Actualizar perfil
      const updateData: {
        name?: string;
        phone?: string;
        comuna?: string;
        profile_image?: string | null;
        profile_image_public_id?: string | null;
      } = {};

      if (editName !== user.name) updateData.name = editName;
      if (editPhone !== user.phone) updateData.phone = editPhone;
      if (editComuna !== user.comuna) updateData.comuna = editComuna;
      if (imageUrl !== user.profile_image) {
        updateData.profile_image = imageUrl;
        if (imagePublicId) {
          updateData.profile_image_public_id = imagePublicId;
        }
      }

      // Si no hay cambios, cerrar el diálogo
      if (Object.keys(updateData).length === 0) {
        setIsEditDialogOpen(false);
        return;
      }

      await authAPI.updateProfile(updateData);

      // Actualizar el contexto del usuario
      await loadUser();

      toast.success('Perfil actualizado exitosamente');
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Por favor selecciona un archivo PDF');
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El CV no debe superar los 5MB');
        return;
      }
      setSelectedCV(file);
    }
  };

  const handleUploadCV = async (): Promise<{ url: string; cv_text: string | null; cv_analysis: any | null } | null> => {
    if (!selectedCV) return null;

    try {
      setIsUploadingCV(true);
      const formData = new FormData();
      formData.append('cv', selectedCV);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/upload-cv`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al subir el CV');
      }

      const data = await response.json();
      return {
        url: data.url,
        cv_text: data.cv_text || null,
        cv_analysis: data.cv_analysis || null
      };
    } catch (error: any) {
      console.error('Error uploading CV:', error);
      toast.error(error.message || 'Error al subir el CV');
      return null;
    } finally {
      setIsUploadingCV(false);
    }
  };

  const handleSaveCV = async () => {
    if (!user || !selectedCV) return;

    try {
      const cvData = await handleUploadCV();
      if (!cvData) {
        return; // Error ya fue manejado en handleUploadCV
      }

      // Guardar URL, texto y análisis del CV en el perfil
      await authAPI.updateProfile({
        cv_url: cvData.url,
        cv_text: cvData.cv_text,
        cv_analysis: cvData.cv_analysis
      });
      await loadUser();

      toast.success('CV subido y analizado exitosamente');
      setSelectedCV(null);
      setShowCVSection(false);
      if (cvInputRef.current) {
        cvInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error saving CV:', error);
      toast.error(error.message || 'Error al guardar el CV');
    }
  };

  const handleDeleteCV = async () => {
    if (!user || !confirm('¿Estás seguro de que quieres eliminar tu CV?')) {
      return;
    }

    try {
      await authAPI.updateProfile({ cv_url: null });
      await loadUser();
      toast.success('CV eliminado exitosamente');
    } catch (error: any) {
      console.error('Error deleting CV:', error);
      toast.error(error.message || 'Error al eliminar el CV');
    }
  };

  // Función para obtener el URL del visor de Google Docs como fallback
  const getGoogleDocsViewerUrl = (pdfUrl: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  };

  const handleDownloadCV = () => {
    if (!user?.cv_url) {
      toast.error('No hay CV disponible para descargar');
      return;
    }

    try {
      let cvUrl = user.cv_url;

      // Verificar que el URL es válido
      if (!cvUrl.startsWith('http://') && !cvUrl.startsWith('https://')) {
        toast.error('URL del CV no válido');
        return;
      }

      // Para Cloudinary, agregar parámetro para forzar descarga
      if (cvUrl.includes('cloudinary.com')) {
        cvUrl = cvUrl + (cvUrl.includes('?') ? '&' : '?') + 'fl_attachment';
      }

      // Crear enlace temporal para descargar
      const link = document.createElement('a');
      link.href = cvUrl;
      link.download = `CV_${user.name || 'usuario'}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Descargando CV...');
    } catch (error: any) {
      console.error('Error downloading CV:', error);
      toast.error('Error al descargar el CV');
    }
  };

  const handleCompleteProfile = async () => {
    if (!completePhone.trim() || !completeComuna.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsCompletingProfile(true);
      await authAPI.updateProfile({
        phone: completePhone.trim(),
        comuna: completeComuna.trim(),
      });

      await loadUser();
      toast.success('Perfil completado exitosamente');
      setShowCompleteProfileDialog(false);
    } catch (error: any) {
      console.error('Error completing profile:', error);
      toast.error(error.message || 'Error al completar el perfil');
    } finally {
      setIsCompletingProfile(false);
    }
  };

  // TODOS LOS HOOKS DEBEN ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  // Esperar a que termine la carga antes de redirigir
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/registro');
    }
  }, [isLoading, isLoggedIn, navigate]);

  // Detectar si hay campos faltantes
  const hasMissingFields = user && (!user.phone || !user.comuna);

  // Manejar query param para abrir modal de completar perfil
  useEffect(() => {
    if (searchParams.get('complete_profile') === 'true' && hasMissingFields) {
      setShowCompleteProfileDialog(true);
      setCompletePhone(user?.phone || '');
      setCompleteComuna(user?.comuna || '');
      // Limpiar el query param
      searchParams.delete('complete_profile');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, hasMissingFields, user, setSearchParams]);

  // Manejar query param para abrir sección de CV
  useEffect(() => {
    if (searchParams.get('upload_cv') === 'true' && !user?.cv_url) {
      setShowCVSection(true);
      // Limpiar el query param
      searchParams.delete('upload_cv');
      setSearchParams(searchParams, { replace: true });
      // Mostrar mensaje
      toast.info('Agrega tu CV para poder postular a empleos');
    }
  }, [searchParams, user, setSearchParams]);

  // Cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (user && isLoggedIn) {
      loadPosts();
      // Cargar servicios para entrepreneur, admin y super-admin
      if (user.roles.includes('entrepreneur') || user.roles.includes('admin') || user.roles.includes('super-admin')) {
        loadServices();
      }
      // Cargar empleos para company, admin y super-admin
      if (user.roles.includes('company') || user.roles.includes('admin') || user.roles.includes('super-admin')) {
        loadJobs();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoggedIn]); // loadPosts, loadServices, loadJobs son estables y no necesitan estar en deps

  // Notificación cada 10 minutos si no tiene CV (para todos los usuarios)
  useEffect(() => {
    if (!user || !isLoggedIn || isLoading) return;

    // Mostrar notificación a todos los usuarios sin CV
    const hasNoCV = !user.cv_url;

    if (!hasNoCV) return;

    const showNotification = () => {
      const message = user.roles.includes('job-seeker')
        ? '💼 ¡Completa tu perfil! Agrega tu CV para empezar a buscar trabajo'
        : '📄 ¡Completa tu perfil! Agrega tu CV para completar tu información profesional';

      toast.info(message, {
        duration: 8000,
        action: {
          label: 'Agregar CV',
          onClick: () => setShowCVSection(true)
        }
      });
    };

    // Mostrar inmediatamente si no tiene CV
    showNotification();

    // Mostrar cada 10 minutos (600000 ms)
    const interval = setInterval(showNotification, 600000);

    return () => clearInterval(interval);
  }, [user, isLoggedIn, isLoading]);

  // Mostrar loading mientras se carga el usuario
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-heading font-bold">Mi Perfil</h1>
        <Button variant="outline" onClick={handleOpenEditDialog}>
          <Edit size={16} className="mr-2" />
          Editar Perfil
        </Button>
      </div>

      {/* Banner para completar perfil (si faltan campos o CV) */}
      {(hasMissingFields || !user.cv_url) && (
        <Card className="mb-6 border-2 bg-gradient-to-r from-accent/10 to-accent/20 dark:from-accent/10 dark:to-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center p-2">
                  <img
                    src={logoDameldato}
                    alt="Dameldato"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-heading font-bold mb-2">
                  ¡Completa tu perfil!
                </h3>
                <p className="text-muted-foreground mb-4">
                  {hasMissingFields
                    ? 'Completa tu información personal (teléfono y comuna) para que otros usuarios puedan contactarte.'
                    : user.roles.includes('job-seeker')
                      ? 'Agrega tu CV para que las empresas puedan conocerte mejor y aumentar tus oportunidades de encontrar el trabajo perfecto.'
                      : 'Agrega tu CV para completar tu perfil profesional.'}
                </p>
                {hasMissingFields ? (
                  <Button
                    onClick={() => {
                      setCompletePhone(user.phone || '');
                      setCompleteComuna(user.comuna || '');
                      setShowCompleteProfileDialog(true);
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Users size={16} className="mr-2" />
                    Completar Perfil
                  </Button>
                ) : (
                  <Button onClick={() => setShowCVSection(true)} className="bg-primary hover:bg-primary/90">
                    <FileText size={16} className="mr-2" />
                    Agregar CV
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info Card */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <Avatar className="w-24 h-24">
              {user.profile_image && (
                <AvatarImage src={user.profile_image} alt={user.name} />
              )}
              <AvatarFallback className="text-3xl font-heading bg-primary text-white">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 w-full">
              <CardTitle className="text-3xl mb-3 break-words">{user.name}</CardTitle>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {user.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="flex items-center gap-1">
                    {getRoleIcon(role)}
                    {getRoleLabel(role)}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2 text-muted-foreground flex flex-col items-center md:items-start">
                <div className="flex items-center gap-2 max-w-full">
                  <Mail size={16} className="shrink-0" />
                  <span className="break-all">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="shrink-0" />
                  <span>{user.comuna}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Role-specific information */}
      {user.roles.includes('job-seeker') && (
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="text-primary" />
              Información Laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.rubro && (
              <div>
                <span className="font-semibold">Rubro:</span> {user.rubro}
              </div>
            )}
            {user.experience && (
              <div>
                <span className="font-semibold">Experiencia:</span>
                <p className="text-muted-foreground mt-1">{user.experience}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sección de CV (para todos los usuarios) */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-primary" />
            Curriculum Vitae (CV)
          </CardTitle>
          <CardDescription>
            Sube tu CV en formato PDF. Puedes arrastrar y soltar el archivo o hacer clic para seleccionarlo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.cv_url ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="text-primary" size={24} />
                  <div>
                    <p className="font-semibold">CV Subido</p>
                    <p className="text-sm text-muted-foreground">
                      Tu CV está disponible
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadCV}
                    className="w-full sm:w-auto"
                  >
                    <Download size={16} className="mr-2" />
                    Descargar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCVSection(true)}
                    className="w-full sm:w-auto"
                  >
                    <Upload size={16} className="mr-2" />
                    Reemplazar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteCV}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  No has subido tu CV aún. Agrega tu CV para completar tu perfil.
                </AlertDescription>
              </Alert>
              <Button onClick={() => setShowCVSection(true)} className="w-full">
                <Upload size={16} className="mr-2" />
                Agregar CV
              </Button>
            </div>
          )}

          {/* Sección para subir CV con drag and drop */}
          {showCVSection && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-4">
                {/* Área de drag and drop */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${selectedCV
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                        if (file.size <= 10 * 1024 * 1024) {
                          setSelectedCV(file);
                        } else {
                          toast.error('El CV no debe superar los 10MB');
                        }
                      } else {
                        toast.error('Por favor selecciona un archivo PDF');
                      }
                    }
                  }}
                  onClick={() => cvInputRef.current?.click()}
                  style={{ cursor: 'pointer' }}
                >
                  {selectedCV ? (
                    <div className="space-y-2">
                      <FileText className="mx-auto text-primary" size={48} />
                      <p className="font-semibold text-lg">{selectedCV.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedCV.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Haz clic para seleccionar otro archivo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto text-muted-foreground" size={48} />
                      <p className="font-semibold">
                        Arrastra y suelta tu CV aquí
                      </p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para seleccionar un archivo
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Solo archivos PDF (máximo 10MB)
                      </p>
                    </div>
                  )}
                </div>

                <input
                  id="cv-upload"
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleCVSelect}
                  disabled={isUploadingCV}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleSaveCV}
                    disabled={!selectedCV || isUploadingCV}
                    className="w-full sm:w-auto flex-1"
                  >
                    {isUploadingCV ? 'Subiendo...' : 'Guardar CV'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCVSection(false);
                      setSelectedCV(null);
                      if (cvInputRef.current) {
                        cvInputRef.current.value = '';
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {user.roles.includes('entrepreneur') && (
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="text-secondary" />
              Servicio Ofrecido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.service && (
              <div>
                <span className="font-semibold">Servicio:</span> {user.service}
              </div>
            )}
            {user.priceRange && (
              <div>
                <span className="font-semibold">Rango de Precio:</span> {user.priceRange}
              </div>
            )}
            {user.portfolio && user.portfolio.length > 0 && (
              <div>
                <span className="font-semibold">Descripción:</span>
                <p className="text-muted-foreground mt-1">{user.portfolio[0]}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {user.roles.includes('company') && (
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="text-primary" />
              Información de Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.companyRut && (
              <div>
                <span className="font-semibold">RUT:</span> {user.companyRut}
              </div>
            )}
            {user.companyRubro && (
              <div>
                <span className="font-semibold">Rubro:</span> {user.companyRubro}
              </div>
            )}
            {user.companyAddress && (
              <div>
                <span className="font-semibold">Dirección:</span> {user.companyAddress}
              </div>
            )}
            {user.hrContact && (
              <div>
                <span className="font-semibold">Contacto RRHH:</span> {user.hrContact}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs para mostrar publicaciones, servicios y empleos */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className={`grid w-full h-auto mb-4 p-1 gap-1 ${(user.roles.includes('entrepreneur') && user.roles.includes('company')) ||
          user.roles.includes('admin') || user.roles.includes('super-admin')
          ? 'grid-cols-1 md:grid-cols-3'
          : (user.roles.includes('entrepreneur') || user.roles.includes('company') ||
            user.roles.includes('admin') || user.roles.includes('super-admin'))
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1'
          }`}>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare size={16} />
            Publicaciones ({posts.length})
          </TabsTrigger>
          {(user.roles.includes('entrepreneur') || user.roles.includes('admin') || user.roles.includes('super-admin')) && (
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Wrench size={16} />
              Servicios/Pymes ({services.length})
            </TabsTrigger>
          )}
          {(user.roles.includes('company') || user.roles.includes('admin') || user.roles.includes('super-admin')) && (
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase size={16} />
              Empleos ({jobs.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab de Publicaciones */}
        <TabsContent value="posts">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Mis Publicaciones en el Muro</CardTitle>
              <CardDescription>Tus publicaciones activas en el muro</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando publicaciones...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No has publicado nada aún</p>
                  <Button className="mt-4" onClick={() => navigate('/muro')}>
                    Crear Publicación
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id} className="border">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{post.type}</CardTitle>
                            <CardDescription>
                              {post.comuna} | {formatDate(post.created_at)}
                            </CardDescription>
                            <CardDescription className="mt-1">
                              👍 {post.likes_count} | 💬 {post.comments_count}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPost(post)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{post.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Servicios/Pymes (Emprendedores, Admin y Super-Admin) */}
        {(user.roles.includes('entrepreneur') || user.roles.includes('admin') || user.roles.includes('super-admin')) && (
          <TabsContent value="services">
            <Card className="border-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Mis Servicios/Pymes</CardTitle>
                    <CardDescription>Servicios/Pymes activos que has publicado</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/servicios/publicar')} size="sm">
                    <Plus size={16} className="mr-2" />
                    Nuevo Servicio
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingServices ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando servicios...</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No has publicado servicios aún</p>
                    <Button className="mt-4" onClick={() => navigate('/servicios/publicar')}>
                      Publicar Servicio
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <Card key={service.id} className="border">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{service.service_name}</CardTitle>
                              <CardDescription>
                                {service.comuna} | {formatDate(service.created_at)}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditService(service)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteService(service.id)}
                              >
                                <Trash2 size={16} className="text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-2">{service.description}</p>
                          {service.price_range && (
                            <p className="text-sm text-muted-foreground">Precio: {service.price_range}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab de Empleos (Empresas, Admin y Super-Admin) */}
        {(user.roles.includes('company') || user.roles.includes('admin') || user.roles.includes('super-admin')) && (
          <TabsContent value="jobs">
            <Card className="border-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Mis Empleos</CardTitle>
                    <CardDescription>Empleos activos que has publicado</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/empleos/publicar')} size="sm">
                    <Plus size={16} className="mr-2" />
                    Nuevo Empleo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando empleos...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No has publicado empleos aún</p>
                    <Button className="mt-4" onClick={() => navigate('/empleos/publicar')}>
                      Publicar Empleo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <Card key={job.id} className="border">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{job.title}</CardTitle>
                              <CardDescription>
                                {job.comuna} | {formatDate(job.created_at)} | Tipo: {job.job_type}
                              </CardDescription>
                              <CardDescription className="mt-1">
                                <Users size={14} className="inline mr-1" />
                                Postulantes: {jobApplications[job.id]?.length || 0}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditJob(job)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteJob(job.id)}
                              >
                                <Trash2 size={16} className="text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4">{job.description}</p>
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleJobApplications(job.id)}
                            >
                              <Users size={16} className="mr-2" />
                              Ver Postulaciones ({jobApplications[job.id]?.length || 0})
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </div>

                          {/* Lista de postulaciones */}
                          {expandedJobApplications === job.id && (
                            <div className="mt-4 pt-4 border-t">
                              {loadingApplications[job.id] ? (
                                <div className="text-center py-4">
                                  <p className="text-sm text-muted-foreground">Cargando postulaciones...</p>
                                </div>
                              ) : jobApplications[job.id] && jobApplications[job.id].length > 0 ? (
                                <div className="space-y-3">
                                  <h4 className="font-semibold mb-2">Postulantes:</h4>
                                  {jobApplications[job.id].map((application: any) => (
                                    <Card key={application.id} className="border">
                                      <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                              {application.profile_image && (
                                                <AvatarImage src={application.profile_image} alt={application.user_name} />
                                              )}
                                              <AvatarFallback className="bg-primary text-white text-xs">
                                                {application.user_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <p className="font-semibold">{application.user_name}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(application.created_at).toLocaleDateString('es-CL')}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            {application.cv_url && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  const link = document.createElement('a');
                                                  link.href = application.cv_url;
                                                  link.download = `CV_${application.user_name}.pdf`;
                                                  link.click();
                                                }}
                                              >
                                                <Download size={14} className="mr-1" />
                                                Descargar CV
                                              </Button>
                                            )}
                                            <Badge variant={application.status === 'accepted' ? 'default' : application.status === 'rejected' ? 'destructive' : 'outline'}>
                                              {application.status === 'pending' ? 'Pendiente' :
                                                application.status === 'reviewed' ? 'Revisado' :
                                                  application.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No hay postulaciones para este empleo
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog de Edición de Perfil */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal y foto de perfil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Avatar y subida de imagen */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                {imagePreview && (
                  <AvatarImage src={imagePreview} alt="Preview" />
                )}
                <AvatarFallback className="text-3xl font-heading bg-primary text-white">
                  {editName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isUpdating}
                >
                  <Upload size={16} className="mr-2" />
                  {selectedImage ? 'Cambiar Imagen' : 'Subir Imagen'}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={isUploading || isUpdating}
                  >
                    <X size={16} className="mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Campos del formulario */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={isUpdating || isUploading}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={isUpdating || isUploading}
                />
              </div>
              <div>
                <Label htmlFor="edit-comuna">Comuna</Label>
                <Input
                  id="edit-comuna"
                  value={editComuna}
                  onChange={(e) => setEditComuna(e.target.value)}
                  disabled={isUpdating || isUploading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating || isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdating || isUploading}
            >
              {isUpdating || isUploading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edición de Post */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Publicación</DialogTitle>
            <DialogDescription>
              Modifica el contenido de tu publicación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-post-content">Contenido</Label>
              <Textarea
                id="edit-post-content"
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="edit-post-comuna">Comuna</Label>
              <Input
                id="edit-post-comuna"
                value={editPostComuna}
                onChange={(e) => setEditPostComuna(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePost}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edición de Servicio */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription>
              Modifica la información de tu servicio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-service-name">Nombre del Servicio</Label>
              <Input
                id="edit-service-name"
                value={editServiceName}
                onChange={(e) => setEditServiceName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-service-description">Descripción</Label>
              <Textarea
                id="edit-service-description"
                value={editServiceDescription}
                onChange={(e) => setEditServiceDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-service-price">Rango de Precio</Label>
              <Input
                id="edit-service-price"
                value={editServicePriceRange}
                onChange={(e) => setEditServicePriceRange(e.target.value)}
                placeholder="Ej: $10.000 - $50.000"
              />
            </div>
            <div>
              <Label htmlFor="edit-service-comuna">Comuna</Label>
              <Input
                id="edit-service-comuna"
                value={editServiceComuna}
                onChange={(e) => setEditServiceComuna(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveService}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edición de Empleo */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Empleo</DialogTitle>
            <DialogDescription>
              Modifica la información del empleo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-job-title">Título del Empleo</Label>
              <Input
                id="edit-job-title"
                value={editJobTitle}
                onChange={(e) => setEditJobTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-job-description">Descripción</Label>
              <Textarea
                id="edit-job-description"
                value={editJobDescription}
                onChange={(e) => setEditJobDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-job-requirements">Requisitos</Label>
              <Textarea
                id="edit-job-requirements"
                value={editJobRequirements}
                onChange={(e) => setEditJobRequirements(e.target.value)}
                rows={3}
                placeholder="Opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-job-salary">Salario</Label>
                <Input
                  id="edit-job-salary"
                  value={editJobSalary}
                  onChange={(e) => setEditJobSalary(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <Label htmlFor="edit-job-type">Tipo de Jornada</Label>
                <Select value={editJobType} onValueChange={setEditJobType}>
                  <SelectTrigger id="edit-job-type">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fulltime">Tiempo Completo</SelectItem>
                    <SelectItem value="parttime">Part-Time</SelectItem>
                    <SelectItem value="shifts">Turnos</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-job-comuna">Comuna</Label>
              <Input
                id="edit-job-comuna"
                value={editJobComuna}
                onChange={(e) => setEditJobComuna(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingJob(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveJob}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para completar perfil */}
      <Dialog open={showCompleteProfileDialog} onOpenChange={setShowCompleteProfileDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Completar Perfil</DialogTitle>
            <DialogDescription>
              Completa tu información personal para que otros usuarios puedan contactarte
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="complete-phone">Teléfono *</Label>
              <Input
                id="complete-phone"
                value={completePhone}
                onChange={(e) => setCompletePhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                disabled={isCompletingProfile}
              />
            </div>
            <div>
              <Label htmlFor="complete-comuna">Comuna *</Label>
              <Input
                id="complete-comuna"
                value={completeComuna}
                onChange={(e) => setCompleteComuna(e.target.value)}
                placeholder="Tu comuna"
                disabled={isCompletingProfile}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteProfileDialog(false)}
              disabled={isCompletingProfile}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompleteProfile}
              disabled={isCompletingProfile || !completePhone.trim() || !completeComuna.trim()}
            >
              {isCompletingProfile ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para ver CV */}
      <Dialog open={showCVModal} onOpenChange={setShowCVModal}>
        <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Curriculum Vitae</DialogTitle>
            <DialogDescription>
              Vista previa de tu CV
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden border-t border-b bg-muted/30 relative">
            {user?.cv_url ? (
              <>
                {useGoogleViewer ? (
                  /* Usar Google Docs Viewer como alternativa */
                  <iframe
                    src={getGoogleDocsViewerUrl(user.cv_url)}
                    className="w-full h-full border-0"
                    title="CV Preview"
                    style={{ minHeight: '600px' }}
                    allow="fullscreen"
                  />
                ) : (
                  /* Intentar mostrar PDF directamente primero */
                  <object
                    data={`${user.cv_url}#toolbar=0&navpanes=0&scrollbar=1`}
                    type="application/pdf"
                    className="w-full h-full"
                    style={{ minHeight: '600px' }}
                  >
                    {/* Fallback: si el object no funciona, mostrar mensaje */}
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <p className="text-muted-foreground mb-4">
                        No se pudo cargar el PDF directamente. Intentando con visor alternativo...
                      </p>
                      <Button
                        onClick={() => setUseGoogleViewer(true)}
                        className="mb-2"
                      >
                        Usar visor alternativo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(user.cv_url!, '_blank', 'noopener,noreferrer')}
                      >
                        Abrir en nueva pestaña
                      </Button>
                    </div>
                  </object>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No hay CV disponible</p>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadCV}
            >
              <Download size={16} className="mr-2" />
              Descargar CV
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCVModal(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
