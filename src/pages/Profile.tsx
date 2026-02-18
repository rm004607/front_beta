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
import { MapPin, Phone, Mail, Edit, Wrench, Building2, MessageSquare, Trash2, Upload, X, FileText, Download, AlertCircle, Eye, Plus, Star, Users, Briefcase } from 'lucide-react';
import { postsAPI, servicesAPI, authAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  isValidName,
  isValidPhone,
  isValidComuna,
  isValidTextField,
  sanitizeInput
} from '@/lib/input-validator';
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
  average_rating?: number;
  reviews_count?: number;
}


const Profile = () => {
  const { user, isLoggedIn, isLoading, loadUser } = useUser();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editComuna, setEditComuna] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* CV code removido */
  // Estados para edición
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  // Estados para completar perfil
  const [showCompleteProfileDialog, setShowCompleteProfileDialog] = useState(false);
  const [completePhone, setCompletePhone] = useState('');
  const [completeComuna, setCompleteComuna] = useState('');
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostComuna, setEditPostComuna] = useState('');
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editServicePriceRange, setEditServicePriceRange] = useState('');
  const [editServiceComuna, setEditServiceComuna] = useState('');

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

    if (!isValidTextField(editPostContent, 2000)) {
      toast.error('El contenido de la publicación contiene caracteres no permitidos');
      return;
    }

    if (!isValidComuna(editPostComuna)) {
      toast.error('La comuna contiene caracteres no permitidos');
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

    if (!isValidTextField(editServiceName, 100)) {
      toast.error('El nombre del servicio contiene caracteres no permitidos');
      return;
    }
    if (!isValidTextField(editServiceDescription, 2000)) {
      toast.error('La descripción contiene caracteres no permitidos');
      return;
    }
    if (!isValidComuna(editServiceComuna)) {
      toast.error('La comuna contiene caracteres no permitidos');
      return;
    }

    try {
      await servicesAPI.updateService(editingService.id, {
        service_name: sanitizeInput(editServiceName, 100),
        description: sanitizeInput(editServiceDescription, 2000),
        price_range: editServicePriceRange ? sanitizeInput(editServicePriceRange, 100) : undefined,
        comuna: sanitizeInput(editServiceComuna, 50),
      });
      toast.success('Servicio actualizado exitosamente');
      setEditingService(null);
      loadServices();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast.error(error.message || 'Error al actualizar servicio');
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
        return 'Vecino';
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

      if (editName !== user.name) {
        if (!isValidName(editName)) {
          toast.error('Nombre no válido');
          setIsUpdating(false);
          return;
        }
        updateData.name = sanitizeInput(editName, 100);
      }

      if (editPhone !== user.phone) {
        if (!isValidPhone(editPhone)) {
          toast.error('Teléfono no válido');
          setIsUpdating(false);
          return;
        }
        updateData.phone = sanitizeInput(editPhone, 20);
      }

      if (editComuna !== user.comuna) {
        if (!isValidComuna(editComuna)) {
          toast.error('Comuna no válida');
          setIsUpdating(false);
          return;
        }
        updateData.comuna = sanitizeInput(editComuna, 50);
      }

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

  /* CV handlers removidos */





  const handleCompleteProfile = async () => {
    if (!completePhone.trim() || !completeComuna.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (!isValidPhone(completePhone)) {
      toast.error('Teléfono no válido');
      return;
    }

    if (!isValidComuna(completeComuna)) {
      toast.error('Comuna no válida');
      return;
    }

    try {
      setIsCompletingProfile(true);
      await authAPI.updateProfile({
        phone: sanitizeInput(completePhone, 20),
        comuna: sanitizeInput(completeComuna, 50),
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

  /* Manejo de query param CV removido */

  // Cargar datos cuando el usuario esté disponible
  useEffect(() => {
    if (user && isLoggedIn) {
      loadPosts();
      if (user.roles.includes('entrepreneur') || user.roles.includes('admin') || user.role_number === 5) {
        loadServices();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoggedIn]); // loadPosts, loadServices, loadJobs son estables y no necesitan estar en deps

  /* Notificación de CV removida */

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

      {/* Banner para completar perfil (si faltan campos) */}
      {hasMissingFields && (
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
                  Completa tu información personal (teléfono y comuna) para que otros usuarios puedan contactarte.
                </p>
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
      {
        user.roles.includes('job-seeker') && (
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
        )
      }

      {/* Sección de CV removida */}

      {
        user.roles.includes('entrepreneur') && (
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
        )
      }

      {/* Tabs para mostrar publicaciones, servicios y empleos */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className={`grid w-full h-auto mb-4 p-1 gap-1 ${user.roles.includes('admin') || user.role_number === 5
          ? 'grid-cols-1 md:grid-cols-2'
          : (user.roles.includes('entrepreneur') ||
            user.roles.includes('admin') || user.role_number === 5)
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1'
          }`}>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare size={16} />
            Publicaciones ({posts.length})
          </TabsTrigger>
          {(user.roles.includes('entrepreneur') || user.roles.includes('admin') || user.role_number === 5) && (
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Wrench size={16} />
              Servicios ({services.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab de Publicaciones */}
        <TabsContent value="posts">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Mis Publicaciones</CardTitle>
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
        {(user.roles.includes('entrepreneur') || user.roles.includes('admin') || user.role_number === 5) && (
          <TabsContent value="services">
            <Card className="border-2">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Mis Servicios</CardTitle>
                    <CardDescription>Servicios activos que has publicado</CardDescription>
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
                              <CardDescription className="flex flex-col gap-1 mt-1">
                                <span>{service.comuna} | {formatDate(service.created_at)}</span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-bold text-yellow-700">
                                    {service.average_rating ? Number(service.average_rating).toFixed(1) : '0.0'}
                                  </span>
                                  <span className="text-[10px]">({service.reviews_count || 0} reseñas)</span>
                                </div>
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

      {/* Modal para ver CV removido */}
    </div >
  );
};

export default Profile;
