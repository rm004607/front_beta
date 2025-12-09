import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, MapPin, MessageCircle, Heart, Trash2, Send, Info, Briefcase, Phone, Mail } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
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
import { postsAPI, authAPI } from '@/lib/api';

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
  const { isLoggedIn, user } = useUser();
  const [postType, setPostType] = useState('Busco Trabajo');
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

  // Cargar posts
  useEffect(() => {
    loadPosts();
  }, [filterType, filterComuna]);

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
      toast.error(error.message || 'Error al cargar publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async () => {
    if (!postContent.trim() || !postComuna.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      setIsSubmitting(true);
      await postsAPI.createPost({
        type: postType as 'Busco Trabajo' | 'Busco Servicio' | 'Ofrezco' | 'Info',
        content: postContent.trim(),
        comuna: postComuna.trim(),
      });
    toast.success('Publicación creada exitosamente');
    setPostContent('');
    setPostComuna('');
      loadPosts(); // Recargar posts
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Error al crear publicación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para dar like');
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
      toast.error(error.message || 'Error al dar like');
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
        toast.error(error.message || 'Error al cargar comentarios');
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
      toast.error('Debes iniciar sesión para comentar');
      return;
    }

    const content = commentContent[postId]?.trim();
    if (!content) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    const type = commentType[postId] || 'info';
    if (!type) {
      toast.error('Debes seleccionar el tipo de comentario');
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
      toast.success('Comentario agregado');
    } catch (error: any) {
      console.error('Error commenting:', error);
      toast.error(error.message || 'Error al comentar');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      return;
    }

    try {
      await postsAPI.deletePost(postId);
      toast.success('Publicación eliminada');
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Error al eliminar publicación');
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await postsAPI.deleteComment(postId, commentId);
      toast.success('Comentario eliminado');
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
      toast.error(error.message || 'Error al eliminar comentario');
    }
  };

  // Verificar si el usuario puede ver perfiles (solo entrepreneur y super-admin)
  const canViewProfile = () => {
    if (!isLoggedIn || !user) {
      return false;
    }
    return user.roles.includes('entrepreneur') || user.roles.includes('super-admin');
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

  const handleWhatsAppContact = (phone: string, userName: string) => {
    // Formatear el número de teléfono (eliminar espacios, guiones, etc.)
    const cleanPhone = phone.replace(/\D/g, '');
    // Agregar código de país si no lo tiene (Chile: +56)
    const whatsappPhone = cleanPhone.startsWith('56') ? `+${cleanPhone}` : `+56${cleanPhone}`;
    
    // Crear el mensaje predefinido
    const message = `Hola ${userName}, leí tu búsqueda de servicio en Beta y me interesa.`;
    
    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crear el enlace de WhatsApp con el mensaje
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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
        return 'hace unos segundos';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
      } else {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      }
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold mb-2">Pared de Pegas</h1>
        <p className="text-muted-foreground">Comparte información y datos de trabajo</p>
        </div>

      {/* Formulario de publicación estilo blog */}
        {isLoggedIn && (
        <Card className="mb-8 border-2">
          <CardHeader>
            <h2 className="text-xl font-semibold">¿Qué quieres compartir?</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Publicación</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Busco Trabajo">Busco Trabajo</SelectItem>
                    <SelectItem value="Busco Servicio">Busco Servicio</SelectItem>
                      <SelectItem value="Ofrezco">Ofrezco (trabajo/servicio)</SelectItem>
                      <SelectItem value="Info">Info (general)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="comuna">Comuna</Label>
                  <Input
                    id="comuna"
                    value={postComuna}
                    onChange={(e) => setPostComuna(e.target.value)}
                    placeholder="Tu comuna"
                  />
              </div>
                </div>
                <div>
                  <Label htmlFor="content">Mensaje</Label>
                  <Textarea
                    id="content"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                placeholder="Comparte información, datos de pega, oportunidades..."
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
                {isSubmitting ? 'Publicando...' : 'Publicar'}
                </Button>
              </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="mb-6 flex gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Busco Trabajo">Busco Trabajo</SelectItem>
            <SelectItem value="Busco Servicio">Busco Servicio</SelectItem>
            <SelectItem value="Ofrezco">Ofrezco</SelectItem>
            <SelectItem value="Info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Filtrar por comuna..."
          value={filterComuna}
          onChange={(e) => setFilterComuna(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando publicaciones...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No hay publicaciones aún</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
          <Card key={post.id} className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar 
                      className={`${post.type === 'Busco Servicio' && canViewProfile() ? 'cursor-pointer hover:opacity-80 transition-opacity' : post.type === 'Busco Servicio' ? 'opacity-60' : ''}`}
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
                  <div>
                      <h3 
                        className={`font-semibold ${post.type === 'Busco Servicio' && canViewProfile() ? 'cursor-pointer hover:underline' : post.type === 'Busco Servicio' ? 'opacity-60' : ''}`}
                        onClick={() => post.type === 'Busco Servicio' && canViewProfile() && handleProfileClick(post.user_id, post.type, post)}
                        title={post.type === 'Busco Servicio' && !canViewProfile() ? 'Solo los emprendedores pueden contactar' : ''}
                      >
                        {post.user_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                <Badge className={getTypeColor(post.type)}>
                  {post.type}
                </Badge>
                    {(user?.id === post.user_id || user?.roles.includes('super-admin')) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
              </div>
            </CardHeader>
            <CardContent>
                <p className="text-foreground mb-4 whitespace-pre-wrap text-base leading-relaxed">
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
                    className={`flex items-center gap-2 ${
                      post.user_liked ? 'text-red-500' : ''
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
                      <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
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
                                      user?.roles.includes('super-admin')) && (
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
                                Agregar Comentario
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Nuevo Comentario</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div>
                                  <Label htmlFor="comment-type">Tipo de Comentario</Label>
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
                                        Info (información general)
                                      </SelectItem>
                                      <SelectItem value="dato_pega">
                                        Dato de Pega (oportunidad de trabajo)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="comment-content">Comentario</Label>
                                  <Textarea
                                    id="comment-content"
                                    placeholder="Escribe tu comentario..."
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
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={() => handleComment(post.id)}
                                    disabled={!commentContent[post.id]?.trim()}
                                  >
                                    <Send size={16} className="mr-2" />
                                    Comentar
                </Button>
              </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {!isLoggedIn && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Inicia sesión para comentar
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
      )}

      {/* Dialog de perfil de usuario */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil de Usuario</DialogTitle>
          </DialogHeader>
          {loadingProfile ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Cargando perfil...</p>
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
                  Contactar por WhatsApp
                </Button>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No se pudo cargar el perfil</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {!isLoggedIn && (
        <div className="mt-8 text-center py-8 bg-muted/30 rounded-2xl">
          <p className="text-muted-foreground mb-4">
            ¿Quieres publicar en la Pared de Pegas?
          </p>
          <Button variant="outline">Inicia Sesión o Regístrate</Button>
        </div>
      )}
    </div>
  );
};

export default Wall;
