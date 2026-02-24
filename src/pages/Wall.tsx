import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, MapPin, MessageCircle, Heart, Trash2, Send, Info, Briefcase, Phone, Mail, CheckCircle, Edit, Crown } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { postsAPI, authAPI, flowAPI, configAPI } from '@/lib/api';
import { chileData } from '@/lib/chile-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

interface Post {
  id: string;
  type: 'Busco Trabajo' | 'Busco Servicio' | 'Ofrezco' | 'Info';
  content: string;
  comuna: string;
  created_at: string;
  user_id: string;
  user_name: string;
  profile_image?: string | null;
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
  user_role_number?: number;
}

interface Comment {
  id: string;
  content: string;
  comment_type: 'info' | 'dato_pega';
  created_at: string;
  user_id: string;
  user_name: string;
  profile_image?: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  comuna: string;
  role: string;
}

const Wall = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUser();
  const { t, i18n } = useTranslation();
  const [postType, setPostType] = useState('Busco Servicio');
  const [postContent, setPostContent] = useState('');
  const [postComuna, setPostComuna] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentContent, setCommentContent] = useState<Record<string, string>>({});
  const [commentType, setCommentType] = useState<Record<string, 'info' | 'dato_pega'>>({});
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState<Record<string, boolean>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterComuna, setFilterComuna] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  // Estado para loading de contacto individual
  const [loadingContact, setLoadingContact] = useState<Record<string, boolean>>({});

  // Estado para el modal de cobro por contacto
  const [isPaidContactModalOpen, setIsPaidContactModalOpen] = useState(false);
  const [pendingContactPost, setPendingContactPost] = useState<Post | null>(null);
  const [pendingContactPhone, setPendingContactPhone] = useState<string | null>(null);
  const [pendingContactName, setPendingContactName] = useState<string | null>(null);
  const [whatsappPrice, setWhatsappPrice] = useState<number>(2990); // Valor por defecto
  const [pricingEnabled, setPricingEnabled] = useState<boolean>(true); // Por defecto true (seguro)

  // Cargar precio dinámico y estado de pricing
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await configAPI.getPublicPrices();
        if (response.whatsapp_contact_price) {
          setWhatsappPrice(response.whatsapp_contact_price);
        }
        if (response.pricing_enabled !== undefined) {
          setPricingEnabled(response.pricing_enabled);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();
  }, []);

  // Estados para ubicación
  const [postRegion, setPostRegion] = useState('');
  const [postComunas, setPostComunas] = useState<string[]>([]);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

  // Cargar posts
  useEffect(() => {
    loadPosts();
  }, [filterType, filterComuna]);

  // Auto-seleccionar comuna del usuario
  useEffect(() => {
    if (isLoggedIn && user?.comuna && postComunas.length === 0) {
      setPostComunas([user.comuna]);
      if (user.region_id) setPostRegion(user.region_id);
    }
  }, [isLoggedIn, user]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getPosts({
        type: filterType !== 'all' ? filterType : undefined,
        comuna: filterComuna || undefined,
        limit: 50,
      });
      setPosts(response.posts);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error(error.message || t('wall.loading_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async () => {
    const finalComunas = postComunas.join(', ');
    if (!postContent.trim() || postComunas.length === 0) {
      toast.error(t('wall.fields_required'));
      return;
    }

    try {
      setIsSubmitting(true);
      await postsAPI.createPost({
        type: postType as 'Busco Servicio' | 'Ofrezco' | 'Info',
        content: postContent.trim(),
        comuna: finalComunas,
      });
      toast.success(t('wall.post_created'));
      setPostContent('');
      // No limpiar ubicación para facilitar múltiples posts en la misma zona
      loadPosts(); // Recargar posts
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || t('wall.post_create_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error(t('wall.login_to_like'));
      return;
    }

    try {
      const response = await postsAPI.likePost(postId);
      // Actualizar el post en el estado
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              user_liked: response.liked,
              likes_count: response.likes_count,
            }
            : post
        )
      );
    } catch (error: any) {
      console.error('Error liking post:', error);
      toast.error(error.message || t('wall.like_error'));
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }

    setExpandedPost(postId);

    // Si no tenemos los comentarios cargados, cargarlos
    if (!comments[postId]) {
      try {
        setLoadingComments((prev) => ({ ...prev, [postId]: true }));
        const response = await postsAPI.getPostComments(postId);
        setComments((prev) => ({ ...prev, [postId]: response.comments }));
      } catch (error: any) {
        console.error('Error loading comments:', error);
        toast.error(error.message || t('wall.comments_error'));
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleOpenCommentDialog = (postId: string) => {
    setIsCommentDialogOpen((prev) => ({ ...prev, [postId]: true }));
    // Inicializar el tipo de comentario si no está definido
    if (!commentType[postId]) {
      setCommentType((prev) => ({ ...prev, [postId]: 'info' }));
    }
  };

  const handleComment = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error(t('wall.login_to_comment'));
      return;
    }

    const content = commentContent[postId]?.trim();
    if (!content) {
      toast.error(t('wall.comment_empty'));
      return;
    }

    const type = commentType[postId] || 'info';
    if (!type) {
      toast.error(t('wall.comment_type_required'));
      return;
    }

    try {
      const response = await postsAPI.commentPost(postId, content, type);
      // Agregar el comentario a la lista
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.comment],
      }));
      // Limpiar el campo de comentario y cerrar el diálogo
      setCommentContent((prev) => ({ ...prev, [postId]: '' }));
      setIsCommentDialogOpen((prev) => ({ ...prev, [postId]: false }));
      // Actualizar el contador de comentarios
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
      toast.success(t('wall.comment_added'));
    } catch (error: any) {
      console.error('Error commenting:', error);
      toast.error(error.message || t('wall.comment_error'));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t('wall.delete_post_confirm'))) {
      return;
    }

    try {
      await postsAPI.deletePost(postId);
      toast.success(t('wall.post_deleted'));
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || t('wall.delete_error'));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await postsAPI.deleteComment(postId, commentId);
      toast.success(t('wall.comment_deleted'));
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId]?.filter((c) => c.id !== commentId) || [],
      }));
      // Actualizar el contador de comentarios
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, comments_count: Math.max(0, post.comments_count - 1) }
            : post
        )
      );
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error(error.message || t('wall.comment_delete_error'));
    }
  };

  // Verificar si el usuario puede ver perfiles (solo entrepreneur y super-admin)
  const canViewProfile = () => {
    if (!isLoggedIn || !user) {
      return false;
    }
    return user.roles.includes('entrepreneur') || user.role_number === 5;
  };

  const handleProfileClick = async (userId: string, postType: string, post: Post) => {
    // Solo permitir ver perfil si el tipo es "Busco Servicio"
    if (postType !== 'Busco Servicio') {
      return;
    }

    // Verificar que el usuario tenga permisos (entrepreneur o super-admin)
    if (!canViewProfile()) {
      toast.error('Solo los emprendedores pueden contactar a usuarios que buscan servicios');
      return;
    }

    try {
      setLoadingProfile(true);
      setSelectedUserId(userId);
      setSelectedPost(post); // Guardar el post para usar en el mensaje de WhatsApp
      setIsProfileDialogOpen(true);
      const response = await authAPI.getUserById(userId);
      setUserProfile(response.user);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      toast.error(error.message || 'Error al cargar perfil del usuario');
      setIsProfileDialogOpen(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleDirectWhatsAppContact = async (post: Post) => {
    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para contactar');
      return;
    }

    // Si pricing está desactivado, contactar gratis
    if (!pricingEnabled) {
      try {
        setLoadingContact((prev) => ({ ...prev, [post.id]: true }));
        const response = await authAPI.getUserById(post.user_id);
        if (response.user?.phone) {
          const cleanPhone = response.user.phone.replace(/\D/g, '');
          const message = `Hola ${response.user.name}, te contacto por tu publicación en Dameldato.`;
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        } else {
          toast.error('Este usuario no tiene número de teléfono disponible');
        }
      } catch (error: any) {
        console.error('Error loading user profile:', error);
        toast.error('Error al obtener datos de contacto');
      } finally {
        setLoadingContact((prev) => ({ ...prev, [post.id]: false }));
      }
      return;
    }

    setPendingContactPost(post);
    setPendingContactPhone(null);
    setPendingContactName(null);
    setIsPaidContactModalOpen(true);
  };

  const handleWhatsAppContact = (phone: string, userName: string) => {
    // Si pricing está desactivado, contactar gratis
    if (!pricingEnabled) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = `Hola ${userName}, te contacto a través de Dameldato.`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }

    setPendingContactPost(null);
    setPendingContactPhone(phone);
    setPendingContactName(userName);
    setIsPaidContactModalOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Busco Trabajo':
        return 'bg-primary';
      case 'Busco Servicio':
        return 'bg-blue-500';
      case 'Ofrezco':
        return 'bg-secondary';
      case 'Info':
        return 'bg-accent';
      default:
        return 'bg-muted';
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500';
      case 'dato_pega':
        return 'bg-green-500';
      default:
        return 'bg-muted';
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch (type) {
      case 'info':
        return 'Info';
      case 'dato_pega':
        return 'Dato de Pega';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return t('common.just_now');
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${t('common.ago')} ${minutes} ${minutes === 1 ? t('common.minute') : t('common.minutes')}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${t('common.ago')} ${hours} ${hours === 1 ? t('common.hour') : t('common.hours')}`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${t('common.ago')} ${days} ${days === 1 ? t('common.day') : t('common.days')}`;
      } else {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${t('common.ago')} ${weeks} ${weeks === 1 ? t('common.week') : t('common.weeks')}`;
      }
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-8 p-6 glass-card rounded-3xl border-primary/10">
          <h1 className="text-4xl font-heading font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{t('wall.title')}</h1>
          <p className="text-muted-foreground italic">{t('wall.subtitle')}</p>
        </div>

        {/* Formulario de publicación estilo blog */}
        {isLoggedIn && (
          <Card className="mb-8 glass-card border-primary/10 bg-card/40 backdrop-blur-md shadow-2xl">
            <CardHeader>
              <h2 className="text-xl font-semibold">{t('wall.form_title')}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">{t('wall.post_type')}</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Busco Servicio">{t('wall.type_busco_servicio')}</SelectItem>
                      <SelectItem value="Ofrezco">{t('wall.type_ofrezco')}</SelectItem>
                      <SelectItem value="Info">{t('wall.type_info')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t('wall.comuna')}</Label>
                  <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-12 rounded-xl border-primary/20 bg-muted/5">
                        <MapPin className="mr-2 h-4 w-4 text-primary" />
                        {postComunas.length > 0 ? (
                          <div className="flex flex-wrap gap-1 overflow-hidden max-h-6">
                            {postComunas.map(c => (
                              <Badge key={c} variant="secondary" className="text-[10px] py-0">{c}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{t('services.comuna_placeholder')}</span>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Selecciona Comunas</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Región</Label>
                          <Select value={postRegion} onValueChange={(val) => {
                            setPostRegion(val);
                            // No limpiamos comunas para permitir selección multiregión si se desea, 
                            // pero el scroll se actualiza solo para la región seleccionada
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una región..." />
                            </SelectTrigger>
                            <SelectContent>
                              {chileData.map((reg) => (
                                <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {postRegion && (
                          <div className="space-y-2">
                            <Label>Comunas en esta región</Label>
                            <ScrollArea className="h-48 border rounded-md p-2 bg-background">
                              <div className="grid grid-cols-2 gap-2">
                                {chileData.find(r => r.id === postRegion)?.communes.map((c) => (
                                  <div key={c} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`post-cov-${c}`}
                                      checked={postComunas.includes(c)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setPostComunas([...postComunas, c]);
                                        } else {
                                          setPostComunas(postComunas.filter(item => item !== c));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`post-cov-${c}`} className="text-sm cursor-pointer truncate">{c}</label>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {postComunas.length > 0 && (
                          <div className="pt-2">
                            <Label className="text-xs mb-2 block">Seleccionadas ({postComunas.length}):</Label>
                            <div className="flex flex-wrap gap-1">
                              {postComunas.map(c => (
                                <Badge key={c} variant="secondary" className="pl-2 pr-1 h-6 flex items-center gap-1">
                                  {c}
                                  <button
                                    type="button"
                                    onClick={() => setPostComunas(postComunas.filter(item => item !== c))}
                                    className="bg-muted-foreground/20 rounded-full p-0.5 hover:bg-muted-foreground/40"
                                  >
                                    <X size={10} />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => setIsLocationDialogOpen(false)}>Cerrar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div>
                <Label htmlFor="content">{t('wall.message')}</Label>
                <Textarea
                  id="content"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={t('wall.placeholder')}
                  rows={5}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitPost}
                  disabled={isSubmitting || !postContent.trim() || !postComuna.trim()}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? t('wall.publishing') : t('wall.publish')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-40 flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t('wall.filter_type')}</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder={t('wall.filter_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('wall.all')}</SelectItem>
                <SelectItem value="Busco Servicio">{t('wall.type_busco_servicio')}</SelectItem>
                <SelectItem value="Ofrezco">{t('wall.type_ofrezco')}</SelectItem>
                <SelectItem value="Info">{t('wall.type_info')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 w-full flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t('wall.filter_comuna')}</Label>
            <Select value={filterComuna} onValueChange={setFilterComuna}>
              <SelectTrigger>
                <SelectValue placeholder={t('wall.filter_comuna')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('services.all_comunas')}</SelectItem>
                {/* 
                  Aquí podríamos listar todas las comunas, 
                  pero como son muchas, vamos a permitir que el usuario mantenga 
                  el valor si lo seleccionó en su perfil o dejarlo como "Todas"
                */}
                {chileData.flatMap(r => r.communes).sort().map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-12 glass-card rounded-2xl border-white/5">
            <p className="text-muted-foreground animate-pulse">{t('wall.loading')}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl border-white/5">
            <p className="text-muted-foreground">{t('wall.empty')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="glass-card border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 flex-1 min-w-0">
                      <Avatar
                        className={`shrink-0 ${post.type === 'Busco Servicio' && canViewProfile() ? 'cursor-pointer hover:opacity-80 transition-opacity' : post.type === 'Busco Servicio' ? 'opacity-60' : ''}`}
                        onClick={() => post.type === 'Busco Servicio' && canViewProfile() && handleProfileClick(post.user_id, post.type, post)}
                        title={post.type === 'Busco Servicio' && !canViewProfile() ? 'Solo los emprendedores pueden contactar' : ''}
                      >
                        {post.profile_image && (
                          <AvatarImage src={post.profile_image} alt={post.user_name} />
                        )}
                        <AvatarFallback className="bg-secondary text-white">
                          {post.user_name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <h3
                            className={`font-semibold truncate ${post.type === 'Busco Servicio' && canViewProfile() ? 'cursor-pointer hover:underline' : post.type === 'Busco Servicio' ? 'opacity-60' : ''}`}
                            onClick={() => post.type === 'Busco Servicio' && canViewProfile() && handleProfileClick(post.user_id, post.type, post)}
                            title={post.type === 'Busco Servicio' && !canViewProfile() ? 'Solo los emprendedores pueden contactar' : ''}
                          >
                            {post.user_name}
                          </h3>
                          {post.user_role_number === 5 && (
                            <div title="Super Admin" className="shrink-0">
                              <Crown size={14} className="text-yellow-500 fill-yellow-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                      {post.type === 'Ofrezco' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                          onClick={() => handleDirectWhatsAppContact(post)}
                          disabled={loadingContact[post.id]}
                        >
                          {loadingContact[post.id] ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <MessageCircle size={14} />
                          )}
                          {t('wall.contact')}
                        </Button>
                      )}
                      <Badge className={getTypeColor(post.type)}>
                        {post.type === 'Busco Servicio' ? t('wall.type_busco_servicio') :
                          post.type === 'Ofrezco' ? t('wall.type_ofrezco') :
                            post.type === 'Info' ? t('wall.type_info') :
                              post.type === 'Busco Trabajo' ? t('wall.type_trabajo') : post.type}
                      </Badge>
                      {(user?.id === post.user_id || user?.role_number === 5) && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin?tab=posts&search=${post.user_name}`)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-4 whitespace-pre-wrap text-base leading-relaxed break-words overflow-hidden">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin size={16} className="text-secondary" />
                    <span>{post.comuna}</span>
                  </div>

                  {/* Acciones: Like y Comentarios */}
                  <div className="flex items-center gap-4 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 ${post.user_liked ? 'text-red-500' : ''
                        }`}
                      disabled={!isLoggedIn}
                    >
                      <Heart
                        size={16}
                        className={post.user_liked ? 'fill-current' : ''}
                      />
                      <span>{post.likes_count}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle size={16} />
                      <span>{post.comments_count}</span>
                    </Button>
                  </div>

                  {/* Sección de comentarios */}
                  {expandedPost === post.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Lista de comentarios */}
                      {loadingComments[post.id] ? (
                        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                      ) : (
                        <>
                          {comments[post.id] && comments[post.id].length > 0 && (
                            <div className="space-y-3">
                              {comments[post.id].map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                                >
                                  <Avatar className="cursor-default">
                                    {comment.profile_image && (
                                      <AvatarImage src={comment.profile_image} alt={comment.user_name} />
                                    )}
                                    <AvatarFallback className="bg-secondary text-white text-xs">
                                      {comment.user_name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm">
                                          {comment.user_name}
                                        </p>
                                        <Badge
                                          className={`${getCommentTypeColor(comment.comment_type)} text-white text-xs`}
                                        >
                                          {comment.comment_type === 'info' ? (
                                            <Info size={12} className="mr-1" />
                                          ) : (
                                            <Briefcase size={12} className="mr-1" />
                                          )}
                                          {getCommentTypeLabel(comment.comment_type)}
                                        </Badge>
                                      </div>
                                      {(user?.id === comment.user_id ||
                                        user?.role_number === 5) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteComment(post.id, comment.id)
                                            }
                                            className="text-destructive hover:text-destructive h-6 w-6 p-0"
                                          >
                                            <Trash2 size={12} />
                                          </Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {formatDate(comment.created_at)}
                                    </p>
                                    <p className="text-sm mt-1 whitespace-pre-wrap">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Botón para agregar comentario */}
                          {isLoggedIn && (
                            <Dialog
                              open={isCommentDialogOpen[post.id] || false}
                              onOpenChange={(open) =>
                                setIsCommentDialogOpen((prev) => ({ ...prev, [post.id]: open }))
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenCommentDialog(post.id)}
                                  className="w-full"
                                >
                                  <MessageCircle size={16} className="mr-2" />
                                  {t('wall.add_comment')}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>{t('wall.new_comment')}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <Label htmlFor="comment-type">{t('wall.comment_type')}</Label>
                                    <Select
                                      value={commentType[post.id] || 'info'}
                                      onValueChange={(value: 'info' | 'dato_pega') =>
                                        setCommentType((prev) => ({ ...prev, [post.id]: value }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="info">
                                          {t('wall.comment_info_label')}
                                        </SelectItem>
                                        <SelectItem value="dato_pega">
                                          {t('wall.comment_pega_label')}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="comment-content">{t('wall.comments')}</Label>
                                    <Textarea
                                      id="comment-content"
                                      placeholder={t('wall.comment_placeholder')}
                                      value={commentContent[post.id] || ''}
                                      onChange={(e) =>
                                        setCommentContent((prev) => ({
                                          ...prev,
                                          [post.id]: e.target.value,
                                        }))
                                      }
                                      rows={4}
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setIsCommentDialogOpen((prev) => ({
                                          ...prev,
                                          [post.id]: false,
                                        }))
                                      }
                                    >
                                      {t('common.cancel')}
                                    </Button>
                                    <Button
                                      onClick={() => handleComment(post.id)}
                                      disabled={!commentContent[post.id]?.trim()}
                                    >
                                      <Send size={16} className="mr-2" />
                                      {t('wall.comment_btn')}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {!isLoggedIn && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {t('wall.login_to_comment_msg')}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
        }

        {/* Dialog de perfil de usuario */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('wall.user_profile')}</DialogTitle>
            </DialogHeader>
            {loadingProfile ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">{t('wall.loading_profile')}</p>
              </div>
            ) : userProfile ? (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {userProfile.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{userProfile.name}</h3>
                    <Badge variant="secondary">{userProfile.role}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} className="text-muted-foreground" />
                    <span>{userProfile.comuna}</span>
                  </div>
                  {userProfile.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-muted-foreground" />
                      <span>{userProfile.phone}</span>
                    </div>
                  )}
                </div>
                {userProfile.phone && selectedPost && (
                  <Button
                    onClick={() => handleWhatsAppContact(userProfile.phone, userProfile.name)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Phone size={16} className="mr-2" />
                    {t('services.contact_whatsapp')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">{t('wall.profile_error')}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {
          !isLoggedIn && (
            <div className="mt-8 text-center py-8 bg-muted/30 rounded-2xl">
              <p className="text-muted-foreground mb-4">
                {t('wall.want_to_post')}
              </p>
              <Link to="/registro">
                <Button variant="outline">{t('wall.login_register')}</Button>
              </Link>
            </div>
          )
        }
        {/* Dialog de cobro por contacto WhatsApp */}
        <Dialog open={isPaidContactModalOpen} onOpenChange={setIsPaidContactModalOpen}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
            <Card className="border-t-4 border-t-primary shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-green-600" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-800">{t('services.contact_whatsapp')}</DialogTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-blue-800 font-medium mb-1">{t('services.premium_service')}</p>
                  <div className="text-3xl font-black text-blue-900">
                    {new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'es-CL', { style: 'currency', currency: 'CLP' }).format(whatsappPrice)}
                  </div>
                  <p className="text-blue-600 text-xs mt-1">{t('services.one_time_payment')}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">{t('services.immediate_access')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">{t('services.direct_chat')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsPaidContactModalOpen(false)}
                    className="h-12 border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        let targetUserId = '';
                        let postId = '';

                        if (pendingContactPost) {
                          targetUserId = pendingContactPost.user_id;
                          postId = pendingContactPost.id;
                        } else if (pendingContactPhone && pendingContactName && userProfile) {
                          targetUserId = userProfile.id;
                        }

                        if (!targetUserId) {
                          toast.error(t('wall.contact_error'));
                          return;
                        }

                        setIsPaidContactModalOpen(false);
                        toast.loading(t('wall.preparing_payment'), { id: 'contact-payment' });

                        const response = await flowAPI.createContactPayment(targetUserId, postId);

                        if (response && response.url) {
                          toast.success(t('wall.redirecting_flow'), { id: 'contact-payment' });
                          window.location.href = response.url;
                        } else {
                          throw new Error('No se recibió la URL de pago del servidor');
                        }
                      } catch (error: any) {
                        console.error('Error creating contact payment:', error);
                        toast.error(error.message || t('wall.payment_error'), { id: 'contact-payment' });
                      }
                    }}
                    className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200"
                  >
                    {t('services.pay_chat')}
                  </Button>
                </div>

                <p className="text-[10px] text-center text-gray-400">
                  {t('services.accept_policies')}
                </p>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Wall;
