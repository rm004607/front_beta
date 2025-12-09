import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Trash2,
  Users,
  Briefcase,
  MessageSquare,
  Wrench,
  Shield,
  FileText,
  Ban,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  X,
  HelpCircle,
  Send,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI, authAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Post {
  id: string;
  type: string;
  content: string;
  comuna: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  likes_count: number;
  comments_count: number;
}

interface Job {
  id: string;
  title: string;
  description: string;
  comuna: string;
  job_type: string;
  is_active: number;
  created_at: string;
  company_name: string;
  company_email: string;
}

interface Service {
  id: string;
  service_name: string;
  description: string;
  comuna: string;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  comuna: string;
  profile_image?: string | null;
  is_active: boolean;
  is_banned: boolean;
  ban_reason?: string;
  banned_until?: string;
  ban_count: number;
  role: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  profile_image?: string | null;
  comuna: string;
  role: string;
}

interface Log {
  id: number;
  timestamp: string;
  level: string;
  message: string;
}

const Admin = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const isSuperAdmin = user?.roles.includes('super-admin');

  // Estados para posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postFilters, setPostFilters] = useState({ type: 'all', comuna: '' });

  // Estados para jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobFilters, setJobFilters] = useState({ job_type: 'all', comuna: '', is_active: 'all' });

  // Estados para services
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceFilters, setServiceFilters] = useState({ comuna: '', status: 'all' });

  // Estados para users (solo super-admin)
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilters, setUserFilters] = useState({ role: 'all', is_active: 'all', is_banned: 'all' });

  // Estados para logs (solo super-admin)
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logLevel, setLogLevel] = useState('all');
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(false);

  // Estados para tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilters, setTicketFilters] = useState({ status: 'all', category: 'all' });
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketResponse, setTicketResponse] = useState('');
  const [ticketResponseDialogOpen, setTicketResponseDialogOpen] = useState(false);

  // Estados para stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Estados para diálogos
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDays, setBanDays] = useState('7');
  const [userProfileDialogOpen, setUserProfileDialogOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  // Definir funciones antes de los hooks que las usan
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await adminAPI.getStats();
      setStats(response.stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error(error.message || 'Error al cargar estadísticas');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await adminAPI.getAllPosts({
        type: postFilters.type !== 'all' ? postFilters.type : undefined,
        comuna: postFilters.comuna || undefined,
        limit: 50,
      });
      setPosts(response.posts);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error(error.message || 'Error al cargar publicaciones');
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await adminAPI.getAllJobs({
        job_type: jobFilters.job_type !== 'all' ? jobFilters.job_type : undefined,
        comuna: jobFilters.comuna || undefined,
        is_active: jobFilters.is_active !== 'all' ? parseInt(jobFilters.is_active) : undefined,
        limit: 50,
      });
      setJobs(response.jobs);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast.error(error.message || 'Error al cargar empleos');
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await adminAPI.getAllServices({
        comuna: serviceFilters.comuna || undefined,
        status: serviceFilters.status !== 'all' ? serviceFilters.status : undefined,
        limit: 50,
      });
      setServices(response.services);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error(error.message || 'Error al cargar servicios');
    } finally {
      setLoadingServices(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await adminAPI.getAllUsers({
        role: userFilters.role !== 'all' ? userFilters.role : undefined,
        is_active: userFilters.is_active !== 'all' ? parseInt(userFilters.is_active) : undefined,
        is_banned: userFilters.is_banned !== 'all' ? parseInt(userFilters.is_banned) : undefined,
        limit: 50,
      });
      setUsers(response.users);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error(error.message || 'Error al cargar usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadLogs = async () => {
    if (!isSuperAdmin) return;
    try {
      setLoadingLogs(true);
      const response = await adminAPI.getLogs({
        limit: 200,
        level: logLevel !== 'all' ? logLevel : undefined,
      });
      setLogs(response.logs);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      toast.error(error.message || 'Error al cargar logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      const response = await adminAPI.getAllTickets({
        status: ticketFilters.status !== 'all' ? ticketFilters.status : undefined,
        category: ticketFilters.category !== 'all' ? ticketFilters.category : undefined,
        limit: 50,
      });
      setTickets(response.tickets);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      toast.error(error.message || 'Error al cargar tickets');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleRespondToTicket = async (closeTicket: boolean = false) => {
    if (!selectedTicket || !ticketResponse.trim()) {
      toast.error('Por favor escribe una respuesta');
      return;
    }

    try {
      const status = closeTicket ? 'closed' : 'resolved';
      await adminAPI.respondToTicket(selectedTicket.id, ticketResponse.trim(), status);
      toast.success(closeTicket ? 'Ticket cerrado exitosamente' : 'Respuesta enviada exitosamente');
      setTicketResponseDialogOpen(false);
      setTicketResponse('');
      setSelectedTicket(null);
      loadTickets();
    } catch (error: any) {
      console.error('Error responding to ticket:', error);
      toast.error(error.message || 'Error al responder al ticket');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    // Si se intenta cerrar un ticket sin respuesta, abrir el modal de respuesta
    if (status === 'closed') {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket && !ticket.response) {
        setSelectedTicket(ticket);
        setTicketResponseDialogOpen(true);
        toast.info('Debes proporcionar una solución antes de cerrar el ticket');
        // Restaurar el estado anterior del ticket
        loadTickets();
        return;
      }
    }

    try {
      await adminAPI.updateTicketStatus(ticketId, status);
      toast.success('Estado del ticket actualizado');
      loadTickets();
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      toast.error(error.message || 'Error al actualizar el estado');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      return;
    }

    try {
      await adminAPI.deletePost(id);
      toast.success('Publicación eliminada');
      loadPosts();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Error al eliminar publicación');
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este empleo?')) {
      return;
    }

    try {
      await adminAPI.deleteJob(id);
      toast.success('Empleo eliminado');
      loadJobs();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast.error(error.message || 'Error al eliminar empleo');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      await adminAPI.deleteService(id);
      toast.success('Servicio eliminado');
      loadServices();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Error al eliminar servicio');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    if (!banReason.trim()) {
      toast.error('Debes escribir el motivo del ban');
      return;
    }

    if (!banDays || parseInt(banDays) <= 0) {
      toast.error('Los días deben ser mayor a 0');
      return;
    }

    try {
      const response = await adminAPI.banUser(selectedUser.id, {
        reason: banReason.trim(),
        days: parseInt(banDays),
      });

      if (response.permanent) {
        toast.warning('Usuario baneado permanentemente (segunda infracción)');
      } else {
        toast.success(`Usuario baneado por ${banDays} días`);
      }

      setBanDialogOpen(false);
      setBanReason('');
      setBanDays('7');
      setSelectedUser(null);
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error(error.message || 'Error al banear usuario');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres desbanear este usuario?')) {
      return;
    }

    try {
      await adminAPI.unbanUser(userId);
      toast.success('Usuario desbaneado');
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast.error(error.message || 'Error al desbanear usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      toast.success('Usuario eliminado');
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Error al eliminar usuario');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUserForRoleChange || !newRole) {
      toast.error('Selecciona un rol');
      return;
    }

    if (selectedUserForRoleChange.role === newRole) {
      toast.error('El usuario ya tiene este rol');
      return;
    }

    try {
      await adminAPI.updateUserRole(selectedUserForRoleChange.id, newRole);
      toast.success(`Rol del usuario actualizado a ${getRoleLabel(newRole)}`);
      setChangeRoleDialogOpen(false);
      setSelectedUserForRoleChange(null);
      setNewRole('');
      loadUsers();
    } catch (error: any) {
      console.error('Error changing user role:', error);
      toast.error(error.message || 'Error al cambiar rol del usuario');
    }
  };

  const openChangeRoleDialog = (user: User) => {
    setSelectedUserForRoleChange(user);
    setNewRole(user.role); // Establecer el rol actual como valor inicial
    setChangeRoleDialogOpen(true);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'job-seeker': 'Buscador de Empleo',
      'entrepreneur': 'Emprendedor',
      'company': 'Empresa',
      'admin': 'Administrador',
      'super-admin': 'Super Administrador'
    };
    return roleLabels[role] || role;
  };

  const handleViewUserProfile = async (userId: string) => {
    try {
      setLoadingUserProfile(true);
      setUserProfileDialogOpen(true);
      const response = await authAPI.getUserById(userId);
      setSelectedUserProfile(response.user);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      toast.error(error.message || 'Error al cargar perfil del usuario');
      setUserProfileDialogOpen(false);
    } finally {
      setLoadingUserProfile(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('es-CL');
    } catch {
      return dateString;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500 bg-red-50';
      case 'warn':
        return 'text-yellow-500 bg-yellow-50';
      case 'info':
        return 'text-blue-500 bg-blue-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  // TODOS LOS HOOKS DEBEN ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  // Cargar estadísticas
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadStats es estable y no necesita estar en deps

  // Auto-refresh de logs
  useEffect(() => {
    if (logsAutoRefresh) {
      const interval = setInterval(() => {
        loadLogs();
      }, 2000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsAutoRefresh, logLevel]); // loadLogs es estable y no necesita estar en deps

  // Verificar autenticación y permisos
  useEffect(() => {
    if (!isLoggedIn || (!user?.roles.includes('admin') && !user?.roles.includes('super-admin'))) {
      navigate('/');
    }
  }, [isLoggedIn, user, navigate]);

  // Mostrar loading o redirigir si no tiene permisos
  if (!isLoggedIn || (!user?.roles.includes('admin') && !user?.roles.includes('super-admin'))) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold mb-2">
          Panel de {isSuperAdmin ? 'Super Admin' : 'Administración'}
        </h1>
        <p className="text-muted-foreground">Gestiona el contenido de la plataforma</p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Publicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_posts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Empleos Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_jobs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Servicios Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_services || 0}</div>
            </CardContent>
          </Card>
          {isSuperAdmin && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Activos: {stats.active_users || 0} | Baneados: {stats.banned_users || 0}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="wall" className="w-full">
        <TabsList className={`grid w-full mb-8 ${isSuperAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="wall" onClick={loadPosts} className="flex items-center gap-2">
            <MessageSquare size={16} />
            Muro
          </TabsTrigger>
          <TabsTrigger value="jobs" onClick={loadJobs} className="flex items-center gap-2">
            <Briefcase size={16} />
            Empleos
          </TabsTrigger>
          <TabsTrigger value="services" onClick={loadServices} className="flex items-center gap-2">
            <Wrench size={16} />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="users" onClick={loadUsers} className="flex items-center gap-2">
            <Users size={16} />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="tickets" onClick={loadTickets} className="flex items-center gap-2">
            <HelpCircle size={16} />
            Tickets
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="logs" onClick={loadLogs} className="flex items-center gap-2">
              <FileText size={16} />
              Logs
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab de Muro */}
        <TabsContent value="wall">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Publicaciones del Muro</CardTitle>
              <CardDescription>Gestiona todas las publicaciones del muro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <Select value={postFilters.type} onValueChange={(value) => setPostFilters({ ...postFilters, type: value })}>
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
                  value={postFilters.comuna}
                  onChange={(e) => setPostFilters({ ...postFilters, comuna: e.target.value })}
                  className="flex-1"
                />
                <Button onClick={loadPosts}>Buscar</Button>
              </div>

              {loadingPosts ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando publicaciones...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay publicaciones</p>
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
                              Por: {post.user_name} ({post.user_email}) - {post.comuna}
                            </CardDescription>
                            <CardDescription className="mt-1">
                              {formatDate(post.created_at)} | 👍 {post.likes_count} | 💬 {post.comments_count}
                            </CardDescription>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 size={16} className="mr-2" />
                            Eliminar
                          </Button>
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

        {/* Tab de Empleos */}
        <TabsContent value="jobs">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Empleos</CardTitle>
              <CardDescription>Gestiona todos los empleos publicados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <Select value={jobFilters.job_type} onValueChange={(value) => setJobFilters({ ...jobFilters, job_type: value })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="fulltime">Tiempo Completo</SelectItem>
                    <SelectItem value="parttime">Part Time</SelectItem>
                    <SelectItem value="shifts">Turnos</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={jobFilters.is_active} onValueChange={(value) => setJobFilters({ ...jobFilters, is_active: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="1">Activos</SelectItem>
                    <SelectItem value="0">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Filtrar por comuna..."
                  value={jobFilters.comuna}
                  onChange={(e) => setJobFilters({ ...jobFilters, comuna: e.target.value })}
                  className="flex-1"
                />
                <Button onClick={loadJobs}>Buscar</Button>
              </div>

              {loadingJobs ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando empleos...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay empleos</p>
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
                              Por: {job.company_name} ({job.company_email}) - {job.comuna}
                            </CardDescription>
                            <CardDescription className="mt-1">
                              {formatDate(job.created_at)} | Tipo: {job.job_type}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={job.is_active === 1 ? 'default' : 'secondary'}>
                              {job.is_active === 1 ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <Trash2 size={16} className="mr-2" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-2">{job.description}</p>
                        {job.requirements && (
                          <div className="mt-2">
                            <p className="text-sm font-semibold">Requisitos:</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
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

        {/* Tab de Servicios */}
        <TabsContent value="services">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Servicios</CardTitle>
              <CardDescription>Gestiona todos los servicios publicados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4">
                <Select value={serviceFilters.status} onValueChange={(value) => setServiceFilters({ ...serviceFilters, status: value })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                    <SelectItem value="suspended">Suspendidos</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Filtrar por comuna..."
                  value={serviceFilters.comuna}
                  onChange={(e) => setServiceFilters({ ...serviceFilters, comuna: e.target.value })}
                  className="flex-1"
                />
                <Button onClick={loadServices}>Buscar</Button>
              </div>

              {loadingServices ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando servicios...</p>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay servicios</p>
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
                              Por: {service.user_name} ({service.user_email}) - {service.comuna}
                            </CardDescription>
                            <CardDescription className="mt-1">
                              {formatDate(service.created_at)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                              {service.status}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 size={16} className="mr-2" />
                              Eliminar
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

        {/* Tab de Usuarios (Admin puede ver y banear, Super Admin puede hacer todo) */}
        <TabsContent value="users">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>Gestiona usuarios, baneos y roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <Select value={userFilters.role} onValueChange={(value) => setUserFilters({ ...userFilters, role: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="job-seeker">Job Seeker</SelectItem>
                      <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userFilters.is_active} onValueChange={(value) => setUserFilters({ ...userFilters, is_active: value })}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Activo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="1">Activos</SelectItem>
                      <SelectItem value="0">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userFilters.is_banned} onValueChange={(value) => setUserFilters({ ...userFilters, is_banned: value })}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="1">Baneados</SelectItem>
                      <SelectItem value="0">No Baneados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadUsers}>Buscar</Button>
                </div>

                {loadingUsers ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando usuarios...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay usuarios</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <Card key={user.id} className="border">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleViewUserProfile(user.id)}
                              >
                                {user.profile_image && (
                                  <AvatarImage src={user.profile_image} alt={user.name} />
                                )}
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <CardTitle className="text-lg cursor-pointer hover:underline" onClick={() => handleViewUserProfile(user.id)}>
                                  {user.name}
                                </CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                                <CardDescription className="mt-1">
                                  {user.comuna} | {user.phone} | Rol: {user.role}
                                </CardDescription>
                                {user.is_banned && (
                                  <div className="mt-2">
                                    <Alert variant="destructive">
                                      <AlertTriangle size={16} />
                                      <AlertDescription>
                                        Baneado: {user.ban_reason} | Hasta: {user.banned_until ? formatDate(user.banned_until) : 'Permanente'} | Veces baneado: {user.ban_count}
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                {user.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                              {user.is_banned && (
                                <Badge variant="destructive">Baneado</Badge>
                              )}
                              {user.ban_count > 0 && (
                                <Badge variant="outline">Bans: {user.ban_count}</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 flex-wrap">
                            {!user.is_banned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBanDialogOpen(true);
                                }}
                              >
                                <Ban size={16} className="mr-2" />
                                Banear
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnbanUser(user.id)}
                              >
                                <UserCheck size={16} className="mr-2" />
                                Desbanear
                              </Button>
                            )}
                            {isSuperAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openChangeRoleDialog(user)}
                              >
                                <Shield size={16} className="mr-2" />
                                Cambiar Rol
                              </Button>
                            )}
                            {isSuperAdmin && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 size={16} className="mr-2" />
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        {/* Tab de Tickets */}
        <TabsContent value="tickets">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Tickets de Soporte</CardTitle>
                <CardDescription>Gestiona los tickets de soporte de los usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <Select
                    value={ticketFilters.status}
                    onValueChange={(value) => {
                      setTicketFilters({ ...ticketFilters, status: value });
                      setTimeout(loadTickets, 100);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="open">Abierto</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={ticketFilters.category}
                    onValueChange={(value) => {
                      setTicketFilters({ ...ticketFilters, category: value });
                      setTimeout(loadTickets, 100);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="account">Cuenta</SelectItem>
                      <SelectItem value="payment">Pago</SelectItem>
                      <SelectItem value="report">Reporte</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loadingTickets ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando tickets...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay tickets</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <Card key={ticket.id} className="border">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="w-10 h-10">
                                {ticket.profile_image && (
                                  <AvatarImage src={ticket.profile_image} alt={ticket.user_name} />
                                )}
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {ticket.user_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                                <CardDescription>
                                  {ticket.user_name} ({ticket.user_email}) | {new Date(ticket.created_at).toLocaleString('es-CL')}
                                </CardDescription>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline">{ticket.category}</Badge>
                                  <Badge
                                    variant={
                                      ticket.status === 'resolved' ? 'default' :
                                      ticket.status === 'closed' ? 'secondary' :
                                      ticket.status === 'in_progress' ? 'default' :
                                      'destructive'
                                    }
                                  >
                                    {ticket.status === 'open' ? 'Abierto' :
                                     ticket.status === 'in_progress' ? 'En Progreso' :
                                     ticket.status === 'resolved' ? 'Resuelto' :
                                     'Cerrado'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setTicketResponseDialogOpen(true);
                                }}
                              >
                                <Send size={16} className="mr-2" />
                                Responder
                              </Button>
                              <Select
                                value={ticket.status}
                                onValueChange={(value) => {
                                  if (value === 'closed' && !ticket.response) {
                                    // Si intenta cerrar sin respuesta, abrir modal
                                    setSelectedTicket(ticket);
                                    setTicketResponseDialogOpen(true);
                                    toast.info('Debes proporcionar una solución antes de cerrar el ticket');
                                    // No cambiar el estado todavía
                                    return;
                                  }
                                  handleUpdateTicketStatus(ticket.id, value);
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Abierto</SelectItem>
                                  <SelectItem value="in_progress">En Progreso</SelectItem>
                                  <SelectItem value="resolved">Resuelto</SelectItem>
                                  <SelectItem 
                                    value="closed"
                                    disabled={!ticket.response}
                                  >
                                    Cerrado {!ticket.response && '(requiere respuesta)'}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Mensaje:</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">{ticket.message}</p>
                            </div>
                            {ticket.response && (
                              <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <CheckCircle size={16} className="text-green-500" />
                                  Respuesta {ticket.responder_name && `por ${ticket.responder_name}`}:
                                </h4>
                                <p className="text-muted-foreground whitespace-pre-wrap">{ticket.response}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(ticket.updated_at).toLocaleString('es-CL')}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        {/* Tab de Logs (Solo Super Admin) */}
        {isSuperAdmin && (
          <TabsContent value="logs">
            <Card className="border-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Logs del Backend</CardTitle>
                    <CardDescription>Visualiza los logs en tiempo real del servidor</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsAutoRefresh(!logsAutoRefresh)}
                    >
                      <RefreshCw size={16} className={`mr-2 ${logsAutoRefresh ? 'animate-spin' : ''}`} />
                      {logsAutoRefresh ? 'Detener' : 'Auto-refresh'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadLogs}
                    >
                      Actualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <Select value={logLevel} onValueChange={(value) => {
                    setLogLevel(value);
                    loadLogs();
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="log">Log</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loadingLogs ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando logs...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay logs</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg border text-sm ${getLogLevelColor(log.level)}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{log.level.toUpperCase()}</span>
                          <span className="text-xs opacity-70">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-xs font-mono whitespace-pre-wrap break-words">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog para banear usuario */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Banear Usuario</DialogTitle>
            <DialogDescription>
              {selectedUser && selectedUser.ban_count > 0 && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle size={16} />
                  <AlertDescription>
                    ⚠️ Este usuario ya ha sido baneado {selectedUser.ban_count} vez(es). 
                    Si lo baneas nuevamente, la cuenta se bloqueará permanentemente.
                  </AlertDescription>
                </Alert>
              )}
              <Alert className="mt-2">
                <AlertTriangle size={16} />
                <AlertDescription>
                  Recuerda: Si un usuario es baneado 2 veces, su cuenta se bloqueará para siempre.
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="ban-reason">Motivo del Ban *</Label>
              <Textarea
                id="ban-reason"
                placeholder="Escribe el motivo por el cual se bloquea la cuenta..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ban-days">Días de Ban *</Label>
              <Input
                id="ban-days"
                type="number"
                min="1"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
                placeholder="7"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Número de días que estará baneado el usuario
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBanDialogOpen(false);
              setBanReason('');
              setBanDays('7');
              setSelectedUser(null);
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={!banReason.trim() || !banDays || parseInt(banDays) <= 0}
            >
              <Ban size={16} className="mr-2" />
              Banear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver perfil de usuario */}
      <Dialog open={userProfileDialogOpen} onOpenChange={setUserProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil de Usuario</DialogTitle>
          </DialogHeader>
          {loadingUserProfile ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Cargando perfil...</p>
            </div>
          ) : selectedUserProfile ? (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {selectedUserProfile.profile_image && (
                    <AvatarImage src={selectedUserProfile.profile_image} alt={selectedUserProfile.name} />
                  )}
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {selectedUserProfile.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUserProfile.name}</h3>
                  <Badge variant="secondary">{selectedUserProfile.role}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Comuna:</span>
                  <span>{selectedUserProfile.comuna}</span>
                </div>
                {selectedUserProfile.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Teléfono:</span>
                    <span>{selectedUserProfile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No se pudo cargar el perfil</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para cambiar rol de usuario */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para {selectedUserForRoleChange?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="role">Rol Actual</Label>
              <Input
                id="current-role"
                value={selectedUserForRoleChange ? getRoleLabel(selectedUserForRoleChange.role) : ''}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="new-role">Nuevo Rol *</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job-seeker">Buscador de Empleo</SelectItem>
                  <SelectItem value="entrepreneur">Emprendedor</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="super-admin">Super Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedUserForRoleChange && newRole === selectedUserForRoleChange.role && (
              <Alert>
                <AlertTriangle size={16} />
                <AlertDescription>
                  El usuario ya tiene este rol. Selecciona un rol diferente.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setChangeRoleDialogOpen(false);
              setSelectedUserForRoleChange(null);
              setNewRole('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={!newRole || (selectedUserForRoleChange && newRole === selectedUserForRoleChange.role)}
            >
              <Shield size={16} className="mr-2" />
              Cambiar Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para responder ticket */}
      <Dialog open={ticketResponseDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // Si se cierra el modal y el ticket estaba intentando cerrarse, restaurar estado
          if (selectedTicket) {
            const ticket = tickets.find(t => t.id === selectedTicket.id);
            if (ticket) {
              // Restaurar el estado original del ticket en la UI
              loadTickets();
            }
          }
        }
        setTicketResponseDialogOpen(open);
        if (!open) {
          setTicketResponse('');
          setSelectedTicket(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket?.status === 'closed' || selectedTicket?.status === 'resolved' 
                ? 'Actualiza la solución al problema' 
                : `Responde al ticket de ${selectedTicket?.user_name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <Label>Asunto:</Label>
                <p className="text-sm text-muted-foreground">{selectedTicket.subject}</p>
              </div>
              <div>
                <Label>Mensaje del usuario:</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
              {selectedTicket.response && (
                <div className="border-t pt-4">
                  <Label>Respuesta anterior:</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded mt-2">
                    {selectedTicket.response}
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="ticket-response">
                  {selectedTicket.response ? 'Actualizar solución:' : 'Solución al problema:'}
                </Label>
                <Textarea
                  id="ticket-response"
                  value={ticketResponse}
                  onChange={(e) => setTicketResponse(e.target.value)}
                  rows={6}
                  placeholder={selectedTicket.response 
                    ? "Actualiza la solución al problema..." 
                    : "Escribe la solución al problema aquí..."}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTicket.status === 'closed' || selectedTicket.status === 'resolved'
                    ? 'Esta solución será visible para el usuario.'
                    : 'Esta respuesta resolverá el ticket.'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setTicketResponseDialogOpen(false);
              setTicketResponse('');
              setSelectedTicket(null);
            }}>
              Cancelar
            </Button>
            {selectedTicket && selectedTicket.status !== 'closed' && (
              <Button 
                onClick={() => handleRespondToTicket(false)} 
                disabled={!ticketResponse.trim()}
                variant="outline"
              >
                <CheckCircle size={16} className="mr-2" />
                Resolver (sin cerrar)
              </Button>
            )}
            <Button 
              onClick={() => handleRespondToTicket(true)} 
              disabled={!ticketResponse.trim()}
            >
              <Send size={16} className="mr-2" />
              {selectedTicket?.status === 'closed' ? 'Actualizar y Cerrar' : 'Enviar y Cerrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
