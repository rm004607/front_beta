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
  Plus,
  XCircle,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Building2,
  Truck,
  HeartPulse,
  Paintbrush,
  Camera,
  Scissors,
  Laptop,
  Hammer,
  ShoppingBag,
  Music,
  Camera as CameraIcon,
  ChefHat,
  Car,
  Home as HomeIcon,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI, authAPI, configAPI, packagesAPI } from '@/lib/api';
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
import { Switch } from '@/components/ui/switch';

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


interface Service {
  id: string;
  service_name: string;
  description: string;
  comuna: string;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
  price_range?: string;
  average_rating?: number;
  reviews_count?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut?: string;
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
  const isSuperAdmin = user?.role_number === 5;

  // Estados para posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postFilters, setPostFilters] = useState({ type: 'all', comuna: '' });


  // Estados para services
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceFilters, setServiceFilters] = useState({ comuna: '', status: 'pending' });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [serviceToReject, setServiceToReject] = useState<Service | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Estados para users (solo super-admin)
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilters, setUserFilters] = useState({ role: 'all', is_active: 'all', is_banned: 'all' });

  // Estados para logs (solo super-admin)
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logLevel, setLogLevel] = useState('all');
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('wall');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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

  // Estados para límites de publicaciones (Super Admin)
  const [publicationLimitsDialogOpen, setPublicationLimitsDialogOpen] = useState(false);
  const [selectedUserLimits, setSelectedUserLimits] = useState<null | {
    user: { id: string; name: string; email: string; role: string };
    services: { base_limit: number; bonus: number; total_limit: number; used: number; remaining: number };
    jobs?: { base_limit: number; bonus: number; total_limit: number; used: number; remaining: number };
  }>(null);
  const [limitsForm, setLimitsForm] = useState({
    services_limit: 2,
    services_bonus: 0,
    jobs_limit: 3,
    jobs_bonus: 0,
  });
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsError, setLimitsError] = useState('');

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

  // Estados para Precios y Paquetes
  const [adminConfig, setAdminConfig] = useState<any[]>([]);
  const [adminPackages, setAdminPackages] = useState<{ services: any[] }>({ services: [] });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Estado para editar configuración
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null);
  const [configValue, setConfigValue] = useState('');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Estado para editar paquete
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [editPackageForm, setEditPackageForm] = useState({ price: 0, publications: 0, is_active: true });
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);

  // Estados para Catálogo de Servicios
  const [catalogTypes, setCatalogTypes] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', icon: '' });
  const [isProcessingSuggestion, setIsProcessingSuggestion] = useState<string | null>(null);

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

  const loadAdminServiceTypes = async () => {
    try {
      setLoadingCatalog(true);
      const response = await adminAPI.getAdminServiceTypes();
      setCatalogTypes(response.types);
    } catch (error: any) {
      console.error('Error loading service types:', error);
      toast.error(error.message || 'Error al cargar tipos de servicios');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadServiceSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await adminAPI.getServiceSuggestions();
      setSuggestions(response.suggestions);
    } catch (error: any) {
      console.error('Error loading service suggestions:', error);
      toast.error(error.message || 'Error al cargar sugerencias');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleProcessSuggestion = async (id: string, action: 'approve' | 'reject') => {
    try {
      setIsProcessingSuggestion(id);
      await adminAPI.processServiceSuggestion(id, action);
      toast.success(action === 'approve' ? 'Sugerencia aprobada' : 'Sugerencia rechazada');
      loadServiceSuggestions();
      if (action === 'approve') loadAdminServiceTypes();
    } catch (error: any) {
      console.error('Error processing suggestion:', error);
      toast.error(error.message || 'Error al procesar sugerencia');
    } finally {
      setIsProcessingSuggestion(null);
    }
  };

  const handleSaveServiceType = async () => {
    try {
      if (selectedType) {
        await adminAPI.updateServiceType(selectedType.id, typeForm);
        toast.success('Tipo de servicio actualizado');
      } else {
        await adminAPI.createServiceType(typeForm);
        toast.success('Tipo de servicio creado');
      }
      setTypeDialogOpen(false);
      loadAdminServiceTypes();
    } catch (error: any) {
      console.error('Error saving service type:', error);
      toast.error(error.message || 'Error al guardar tipo de servicio');
    }
  };

  const handleDeleteServiceType = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tipo de servicio?')) return;
    try {
      await adminAPI.deleteServiceType(id);
      toast.success('Tipo de servicio eliminado');
      loadAdminServiceTypes();
    } catch (error: any) {
      console.error('Error deleting service type:', error);
      toast.error(error.message || 'Error al eliminar tipo de servicio');
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

  const handleApproveService = async (id: string) => {
    try {
      await adminAPI.approveService(id);
      toast.success('Servicio aprobado y publicado exitosamente');
      loadServices();
      loadStats();
    } catch (error: any) {
      console.error('Error approving service:', error);
      toast.error(error.message || 'Error al aprobar el servicio');
    }
  };

  const handleRejectService = async () => {
    if (!serviceToReject) return;
    try {
      await adminAPI.rejectService(serviceToReject.id, rejectReason.trim() || undefined);
      toast.success('Servicio rechazado');
      setRejectDialogOpen(false);
      setServiceToReject(null);
      setRejectReason('');
      loadServices();
      loadStats();
    } catch (error: any) {
      console.error('Error rejecting service:', error);
      toast.error(error.message || 'Error al rechazar el servicio');
    }
  };

  const IconRenderer = ({ name, size = 16, className = "" }: { name: string, size?: number, className?: string }) => {
    switch (name) {
      case 'Wrench': return <Wrench size={size} className={className} />;
      case 'Lightbulb': return <Lightbulb size={size} className={className} />;
      case 'ShieldCheck': return <ShieldCheck size={size} className={className} />;
      case 'Sparkles': return <Sparkles size={size} className={className} />;
      case 'Building2': return <Building2 size={size} className={className} />;
      case 'Truck': return <Truck size={size} className={className} />;
      case 'HeartPulse': return <HeartPulse size={size} className={className} />;
      case 'Briefcase': return <Briefcase size={size} className={className} />;
      case 'Paintbrush': return <Paintbrush size={size} className={className} />;
      case 'Hammer': return <Hammer size={size} className={className} />;
      case 'Scissors': return <Scissors size={size} className={className} />;
      case 'Camera': return <Camera size={size} className={className} />;
      case 'Laptop': return <Laptop size={size} className={className} />;
      case 'ShoppingBag': return <ShoppingBag size={size} className={className} />;
      case 'ChefHat': return <ChefHat size={size} className={className} />;
      case 'Music': return <Music size={size} className={className} />;
      case 'Car': return <Car size={size} className={className} />;
      case 'Home': return <HomeIcon size={size} className={className} />;
      case 'Phone': return <Phone size={size} className={className} />;
      case 'Plus': return <Plus size={size} className={className} />;
      default: return <HelpCircle size={size} className={className} />;
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

  // ===== Publicación de límites (Super Admin) =====
  const openPublicationLimits = async (userId: string) => {
    if (!isSuperAdmin) return;
    setLimitsError('');
    setLoadingLimits(true);
    setPublicationLimitsDialogOpen(true);
    try {
      const data = await adminAPI.getUserPublicationLimits(userId);
      setSelectedUserLimits(data);
      setLimitsForm({
        services_limit: data.services.base_limit ?? 2,
        services_bonus: data.services.bonus ?? 0,
        jobs_limit: data.jobs?.base_limit ?? 3,
        jobs_bonus: data.jobs?.bonus ?? 0,
      });
    } catch (error: any) {
      console.error('Error al obtener límites:', error);
      setLimitsError(error?.message || 'Error al obtener límites');
      toast.error('No se pudieron cargar los límites');
    } finally {
      setLoadingLimits(false);
    }
  };

  const handleSavePublicationLimits = async () => {
    if (!selectedUserLimits) return;
    if (
      limitsForm.services_limit < 0 ||
      limitsForm.services_bonus < 0 ||
      limitsForm.jobs_limit < 0 ||
      limitsForm.jobs_bonus < 0
    ) {
      toast.error('Los valores no pueden ser negativos');
      return;
    }
    setSavingLimits(true);
    setLimitsError('');
    try {
      await adminAPI.updateUserPublicationLimits(selectedUserLimits.user.id, limitsForm);
      toast.success('Límites de publicaciones actualizados');
      await openPublicationLimits(selectedUserLimits.user.id);
    } catch (error: any) {
      console.error('Error al actualizar límites:', error);
      setLimitsError(error?.message || 'Error al actualizar límites');
      toast.error('No se pudo actualizar');
    } finally {
      setSavingLimits(false);
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
      'job-seeker': 'Vecino',
      'entrepreneur': 'Emprendedor',
      'admin': 'Administrador',
      'super-admin': 'Super Administrador'
    };
    return roleLabels[role] || role;
  };

  const getUsageStatus = (used: number, total: number) => {
    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 100;
    if (total === 0) return { percent, color: 'text-destructive', bar: 'bg-destructive' };
    if (percent >= 100) return { percent, color: 'text-destructive', bar: 'bg-destructive' };
    if (percent >= 80) return { percent, color: 'text-amber-500', bar: 'bg-amber-500' };
    return { percent, color: 'text-success', bar: 'bg-success' };
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
        return 'text-accent bg-accent/10';
      case 'info':
        return 'text-blue-500 bg-blue-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  // Funciones para Precios y Configuración
  const loadAdminConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await configAPI.getAdminConfig();
      setAdminConfig(response.config);
    } catch (error: any) {
      console.error('Error loading config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadAdminPackages = async () => {
    try {
      setLoadingPackages(true);
      const [servicesRes, jobsRes] = await Promise.all([
        packagesAPI.getServicePackages(),
        packagesAPI.getJobPackages()
      ]);
      setAdminPackages({
        services: servicesRes.packages,
      });
    } catch (error: any) {
      console.error('Error loading packages:', error);
      toast.error('Error al cargar paquetes');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;
    try {
      await configAPI.updateAdminConfig(selectedConfig.key, configValue);
      toast.success('Configuración actualizada');
      setConfigDialogOpen(false);
      loadAdminConfig();
    } catch (error: any) {
      console.error('Error updating config:', error);
      toast.error('Error al actualizar configuración');
    }
  };

  const handleTogglePricing = async (enabled: boolean) => {
    try {
      await configAPI.updateAdminConfig('PRICING_ENABLED', enabled ? 'true' : 'false');
      toast.success(enabled ? 'Pagos activados' : 'Modo Gratuito activado');
      loadAdminConfig();
    } catch (error: any) {
      console.error('Error toggling pricing:', error);
      toast.error('Error al cambiar el modo de precios');
    }
  };

  const handleUpdatePackage = async () => {
    if (!selectedPackage) return;
    try {
      await packagesAPI.updatePackage(selectedPackage.id, editPackageForm);
      toast.success('Paquete actualizado');
      setPackageDialogOpen(false);
      loadAdminPackages();
    } catch (error: any) {
      console.error('Error updating package:', error);
      toast.error('Error al actualizar paquete');
    }
  };

  const openEditConfig = (config: any) => {
    setSelectedConfig(config);
    setConfigValue(config.value);
    setConfigDialogOpen(true);
  };

  const openEditPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setEditPackageForm({
      price: pkg.price,
      publications: pkg.publications,
      is_active: true // Asumimos true ya que la API no devuelve is_active por ahora en el listado público, el back lo manejará
    });
    setPackageDialogOpen(true);
  };

  // TODOS LOS HOOKS DEBEN ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  // Cargar estadísticas
  useEffect(() => {
    const initAdmin = async () => {
      setIsInitialLoading(true);
      await loadStats();
      setIsInitialLoading(false);
    };
    initAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar datos al cambiar de pestaña
  useEffect(() => {
    switch (activeTab) {
      case 'wall': loadPosts(); break;
      case 'services': loadServices(); break;
      case 'users': loadUsers(); break;
      case 'tickets': loadTickets(); break;
      case 'prices':
        loadAdminConfig();
        loadAdminPackages();
        break;
      case 'logs': loadLogs(); break;
    }
  }, [activeTab]);

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
    if (!isLoggedIn || (!user?.roles.includes('admin') && user?.role_number !== 5)) {
      navigate('/');
    }
  }, [isLoggedIn, user, navigate]);

  // Mostrar loading o redirigir si no tiene permisos
  if (!isLoggedIn || (!user?.roles.includes('admin') && user?.role_number !== 5)) {
    return null;
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Cargando Panel de Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 glass-card rounded-2xl sm:rounded-3xl border-primary/10">
          <h1 className="text-2xl sm:text-4xl font-heading font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Panel de {isSuperAdmin ? 'Super Admin' : 'Administración'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestiona el contenido, servicios y usuarios de la plataforma.</p>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/40 backdrop-blur-md border-primary/10 group hover:border-primary/30 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Publicaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total_posts || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-md border-secondary/10 group hover:border-secondary/30 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-secondary transition-colors">Servicios/Pymes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.active_services || 0}</div>
              </CardContent>
            </Card>
            {isSuperAdmin && (
              <Card className="bg-card/40 backdrop-blur-md border-amber-500/10 group hover:border-amber-500/30 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-amber-500 transition-colors">Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activos: {stats.active_users || 0} | Baneados: {stats.banned_users || 0}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className={`flex w-max min-w-full h-auto mb-2 p-1 gap-1 glass-card border-white/5`}>
              <TabsTrigger value="wall" onClick={loadPosts} className="flex items-center gap-2">
                <MessageSquare size={16} />
                Muro
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
              <TabsTrigger value="catalog" onClick={() => { loadAdminServiceTypes(); loadServiceSuggestions(); }} className="flex items-center gap-2">
                <List size={16} />
                Catálogo
              </TabsTrigger>
              {isSuperAdmin && (
                <>
                  <TabsTrigger value="prices" onClick={() => { loadAdminConfig(); loadAdminPackages(); }} className="flex items-center gap-2">
                    <RefreshCw size={16} />
                    Precios
                  </TabsTrigger>
                  <TabsTrigger value="logs" onClick={loadLogs} className="flex items-center gap-2">
                    <FileText size={16} />
                    Logs
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* Tab de Muro */}
          <TabsContent value="wall">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Publicaciones del Muro</CardTitle>
                <CardDescription>Gestiona todas las publicaciones del muro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <Select value={postFilters.type} onValueChange={(value) => setPostFilters({ ...postFilters, type: value })}>
                    <SelectTrigger className="w-full sm:w-44 glass-card border-white/10 text-glow">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                      <SelectItem value="all">🌐 Todos</SelectItem>
                      <SelectItem value="Busco Servicio">🔍 Busco Servicio</SelectItem>
                      <SelectItem value="Ofrezco">💼 Ofrezco</SelectItem>
                      <SelectItem value="Info">ℹ️ Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={16} />
                    <Input
                      placeholder="Filtrar por comuna..."
                      value={postFilters.comuna}
                      onChange={(e) => setPostFilters({ ...postFilters, comuna: e.target.value })}
                      className="pl-10 glass-card border-white/10"
                    />
                  </div>
                  <Button onClick={loadPosts} className="bg-primary hover:bg-primary/90 font-bold px-6">Buscar</Button>
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


          {/* Tab de Servicios */}
          <TabsContent value="services">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Servicios/Pymes</CardTitle>
                <CardDescription>Gestiona todos los servicios. Los pendientes requieren aprobación antes de publicarse.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <Select value={serviceFilters.status} onValueChange={(value) => setServiceFilters({ ...serviceFilters, status: value })}>
                    <SelectTrigger className="w-full sm:w-56 glass-card border-white/10">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                      <SelectItem value="all">🌐 Todos los estados</SelectItem>
                      <SelectItem value="pending">⏳ Pendientes (Aprobación)</SelectItem>
                      <SelectItem value="active">✅ Activos / Publicados</SelectItem>
                      <SelectItem value="rejected">🛑 Bloqueados / Rechazados</SelectItem>
                      <SelectItem value="inactive">🌑 Inactivos (X)</SelectItem>
                      <SelectItem value="suspended">⚠️ Suspendidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={16} />
                    <Input
                      placeholder="Filtrar por comuna..."
                      value={serviceFilters.comuna}
                      onChange={(e) => setServiceFilters({ ...serviceFilters, comuna: e.target.value })}
                      className="pl-10 glass-card border-white/10"
                    />
                  </div>
                  <Button onClick={loadServices} className="bg-primary hover:bg-primary/90">Buscar</Button>
                </div>

                {loadingServices ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando servicios...</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay servicios con ese filtro</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <Card key={service.id} className={`border ${service.status === 'pending' ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                        <CardHeader>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{service.service_name}</CardTitle>
                              <CardDescription>
                                Por: {service.user_name} ({service.user_email}) - {service.comuna}
                              </CardDescription>
                              <CardDescription className="mt-1">
                                {formatDate(service.created_at)}
                              </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 justify-end">
                              <Badge
                                className={
                                  service.status?.toLowerCase().trim() === 'active' ? 'bg-green-500 text-white border-green-600' :
                                    service.status?.toLowerCase().trim() === 'pending' ? 'bg-amber-500 text-white border-amber-600' :
                                      (service.status?.toLowerCase().trim() === 'rejected' || service.status?.toLowerCase().trim() === 'suspended') ? 'bg-red-500 text-white border-red-600' :
                                        'bg-gray-500 text-white border-gray-600'
                                }
                              >
                                {service.status?.toLowerCase().trim() === 'active' ? '✅ Activo' :
                                  service.status?.toLowerCase().trim() === 'pending' ? '⏳ Pendiente' :
                                    (service.status?.toLowerCase().trim() === 'rejected' || service.status?.toLowerCase().trim() === 'suspended') ? '❌ Bloqueado' :
                                      service.status}
                              </Badge>
                              {(service.status?.toLowerCase().trim() === 'pending' || service.status?.toLowerCase().trim() === 'inactive') && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleApproveService(service.id)}
                                  >
                                    <CheckCircle size={14} className="mr-1" />
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50 shadow-sm"
                                    onClick={() => { setServiceToReject(service); setRejectReason(''); setRejectDialogOpen(true); }}
                                  >
                                    <X size={14} className="mr-1" />
                                    Rechazar
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteService(service.id)}
                              >
                                <Trash2 size={14} className="mr-1" />
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
                <div className="mb-6 flex flex-wrap gap-4">
                  <Select value={userFilters.role} onValueChange={(value) => setUserFilters({ ...userFilters, role: value })}>
                    <SelectTrigger className="w-full sm:w-48 glass-card border-white/10">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                      <SelectItem value="all">👥 Todos los roles</SelectItem>
                      <SelectItem value="job-seeker">👤 Vecino</SelectItem>
                      <SelectItem value="entrepreneur">🛠️ Emprendedor</SelectItem>
                      <SelectItem value="company">🏢 Empresa</SelectItem>
                      <SelectItem value="admin">🛡️ Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userFilters.is_active} onValueChange={(value) => setUserFilters({ ...userFilters, is_active: value })}>
                    <SelectTrigger className="w-full sm:w-40 glass-card border-white/10">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                      <SelectItem value="all">✨ Todos los estados</SelectItem>
                      <SelectItem value="1">✅ Activos</SelectItem>
                      <SelectItem value="0">🌑 Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userFilters.is_banned} onValueChange={(value) => setUserFilters({ ...userFilters, is_banned: value })}>
                    <SelectTrigger className="w-full sm:w-40 glass-card border-white/10">
                      <SelectValue placeholder="Ban" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                      <SelectItem value="all">🚫 Todos</SelectItem>
                      <SelectItem value="1">❌ Baneados</SelectItem>
                      <SelectItem value="0">🛡️ No Baneados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadUsers} className="bg-primary hover:bg-primary/90 font-bold px-6">Buscar</Button>
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
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex items-center gap-3 flex-1 w-full">
                              <Avatar
                                className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                onClick={() => handleViewUserProfile(user.id)}
                              >
                                {user.profile_image && (
                                  <AvatarImage src={user.profile_image} alt={user.name} />
                                )}
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg cursor-pointer hover:underline truncate" onClick={() => handleViewUserProfile(user.id)}>
                                  {user.name}
                                </CardTitle>
                                <CardDescription className="truncate">
                                  {user.email} {user.rut ? `| RUT: ${user.rut}` : ''}
                                </CardDescription>
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
                                variant="outline"
                                size="sm"
                                onClick={() => openPublicationLimits(user.id)}
                              >
                                <FileText size={16} className="mr-2" />
                                Gestionar publicaciones
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
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex items-center gap-3 flex-1 w-full">
                              <Avatar className="w-10 h-10 flex-shrink-0">
                                {ticket.profile_image && (
                                  <AvatarImage src={ticket.profile_image} alt={ticket.user_name} />
                                )}
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {ticket.user_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate">{ticket.subject}</CardTitle>
                                <CardDescription className="truncate">
                                  {ticket.user_name} ({ticket.user_email}) | {new Date(ticket.created_at).toLocaleString('es-CL')}
                                </CardDescription>
                                <div className="flex gap-2 mt-2 flex-wrap">
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
                            <div className="flex gap-2 w-full sm:w-auto">
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

          {/* Tab de Catálogo de Servicios */}
          <TabsContent value="catalog" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
              {/* Gestión de Categorías */}
              <Card className="border-2 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Categorías de Servicios</CardTitle>
                    <CardDescription>Tipos de servicios oficiales del catálogo</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => {
                    setSelectedType(null);
                    setTypeForm({ name: '', description: '', icon: '' });
                    setTypeDialogOpen(true);
                  }}>
                    <Plus size={16} className="mr-2" />
                    Nuevo Tipo
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingCatalog ? (
                    <div className="space-y-2 py-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-lg bg-muted animate-pulse" />)}
                    </div>
                  ) : catalogTypes.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                      No hay categorías configuradas
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                      {catalogTypes.map((type) => (
                        <div key={type.id} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:shadow-md transition-all duration-200 group">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                              <IconRenderer name={type.icon || 'Wrench'} size={24} />
                            </div>
                            <div className="flex-1 min-w-0 mr-4">
                              <p className="font-bold text-lg">{type.name}</p>
                              {type.description && <p className="text-sm text-muted-foreground line-clamp-1">{type.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 hover:text-primary rounded-full transition-all group-hover:scale-110" title="Cambiar Icono" onClick={() => {
                              setSelectedType(type);
                              setTypeForm({ name: type.name, description: type.description || '', icon: type.icon || '' });
                              setTypeDialogOpen(true);
                            }}>
                              <IconRenderer name={type.icon || 'Wrench'} size={18} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 hover:text-primary rounded-full transition-all" onClick={() => {
                              setSelectedType(type);
                              setTypeForm({ name: type.name, description: type.description || '', icon: type.icon || '' });
                              setTypeDialogOpen(true);
                            }}>
                              <Wrench size={18} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full transition-all" onClick={() => handleDeleteServiceType(type.id)}>
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Buzón de Sugerencias */}
              <Card className="border-2 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Buzón de Sugerencias</CardTitle>
                  <CardDescription>Servicios sugeridos por usuarios ('Otro')</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSuggestions ? (
                    <div className="space-y-2 py-4">
                      {[1, 2].map(i => <div key={i} className="h-32 w-full rounded-lg bg-muted animate-pulse" />)}
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                      No hay sugerencias pendientes
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                      {suggestions.map((sug) => (
                        <div key={sug.id} className="p-5 border-2 rounded-2xl bg-secondary/5 border-secondary/10 group hover:border-primary/20 transition-all duration-300">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-black text-xl text-primary leading-tight truncate">{sug.custom_service_name}</h4>
                              <div className="mt-1 flex flex-col gap-0.5">
                                <p className="text-xs font-semibold text-muted-foreground">Por: {sug.user_name}</p>
                                <p className="text-[10px] text-muted-foreground/60">{sug.user_email}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="font-mono text-[10px]">{new Date(sug.created_at).toLocaleDateString('es-CL')}</Badge>
                          </div>
                          <div className="flex gap-3 mt-5">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/10 h-10 font-bold"
                              onClick={() => handleProcessSuggestion(sug.id, 'approve')}
                              disabled={!!isProcessingSuggestion}
                            >
                              <CheckCircle size={16} className="mr-2" />
                              {isProcessingSuggestion === sug.id ? '...' : 'Aprobar'}
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1 shadow-lg shadow-red-900/10 h-10 font-bold"
                              onClick={() => handleProcessSuggestion(sug.id, 'reject')}
                              disabled={!!isProcessingSuggestion}
                            >
                              <XCircle size={16} className="mr-2" />
                              {isProcessingSuggestion === sug.id ? '...' : 'Rechazar'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dialog para Editar/Crear Tipo de Servicio */}
          <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-2">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{selectedType ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                <DialogDescription className="text-base">Configura un tipo de servicio oficial para el catálogo</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="type-name" className="text-sm font-bold ml-1">Nombre de la Categoría</Label>
                  <Input
                    id="type-name"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                    placeholder="Ej: Gasfitería, Electricista, Mudanzas..."
                    className="h-12 text-lg rounded-xl border-2 focus-visible:ring-primary"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-desc" className="text-sm font-bold ml-1">Descripción (Opcional)</Label>
                  <Textarea
                    id="type-desc"
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    placeholder="Describe los servicios que incluye esta categoría..."
                    className="rounded-xl border-2 min-h-[120px] focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold ml-1">Icono de la Categoría</Label>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 animate-fade-in">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Preview:</span>
                      <IconRenderer name={typeForm.icon || 'Wrench'} size={16} className="text-primary" />
                    </div>
                  </div>

                  <div className="p-4 border-2 rounded-2xl bg-muted/20">
                    <div className="flex justify-center mb-6">
                      <div className="w-24 h-24 rounded-3xl bg-white shadow-inner flex items-center justify-center text-primary border-2 border-primary/20 group hover:border-primary/40 transition-all duration-300 transform hover:scale-105">
                        <IconRenderer name={typeForm.icon || 'Wrench'} size={48} className="drop-shadow-sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                      {[
                        { name: 'Wrench', icon: <Wrench size={20} /> },
                        { name: 'Lightbulb', icon: <Lightbulb size={20} /> },
                        { name: 'ShieldCheck', icon: <ShieldCheck size={20} /> },
                        { name: 'Sparkles', icon: <Sparkles size={20} /> },
                        { name: 'Building2', icon: <Building2 size={20} /> },
                        { name: 'Truck', icon: <Truck size={20} /> },
                        { name: 'HeartPulse', icon: <HeartPulse size={20} /> },
                        { name: 'Briefcase', icon: <Briefcase size={20} /> },
                        { name: 'Paintbrush', icon: <Paintbrush size={20} /> },
                        { name: 'Hammer', icon: <Hammer size={20} /> },
                        { name: 'Scissors', icon: <Scissors size={20} /> },
                        { name: 'Camera', icon: <Camera size={20} /> },
                        { name: 'Laptop', icon: <Laptop size={20} /> },
                        { name: 'ShoppingBag', icon: <ShoppingBag size={20} /> },
                        { name: 'ChefHat', icon: <ChefHat size={20} /> },
                        { name: 'Music', icon: <Music size={20} /> },
                        { name: 'Car', icon: <Car size={20} /> },
                        { name: 'Home', icon: <HomeIcon size={20} /> },
                        { name: 'Phone', icon: <Phone size={20} /> },
                        { name: 'Plus', icon: <Plus size={20} /> },
                      ].map((item) => (
                        <button
                          key={item.name}
                          onClick={() => setTypeForm({ ...typeForm, icon: item.name })}
                          className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 transform active:scale-95 ${typeForm.icon === item.name
                            ? 'bg-primary text-primary-foreground scale-110 shadow-lg ring-2 ring-primary ring-offset-2 z-10'
                            : 'bg-white hover:bg-primary/5 text-muted-foreground hover:text-primary border border-transparent hover:border-primary/20'
                            }`}
                          title={item.name}
                        >
                          {item.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center animate-pulse">Selecciona un icono de la biblioteca para esta categoría</p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" className="rounded-xl h-11" onClick={() => setTypeDialogOpen(false)}>Cancelar</Button>
                <Button className="rounded-xl h-11 px-8 font-bold" onClick={handleSaveServiceType} disabled={!typeForm.name.trim()}>
                  {selectedType ? 'Guardar Cambios' : 'Crear Categoría'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Tab de Precios y Paquetes */}
          {isSuperAdmin && (
            <TabsContent value="prices">
              <div className="grid grid-cols-1 gap-6">
                {/* Sección Configuración Global */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Configuración Global</CardTitle>
                    <CardDescription>Ajustes generales de precios del sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingConfig ? (
                      <div className="text-center py-4">Cargando configuración...</div>
                    ) : (
                      <div className="space-y-4">
                        {adminConfig.map((config) => (
                          <div key={config.key} className="flex flex-col sm:flex-row items-center justify-between p-5 glass-card border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 gap-4">
                            <div>
                              <p className="font-semibold text-lg text-white group-hover:text-primary transition-colors">{config.description}</p>
                              <code className="text-[10px] text-primary/60 bg-primary/5 px-2 py-0.5 rounded uppercase tracking-wider">{config.key}</code>
                            </div>
                            <div className="flex items-center gap-6">
                              {config.key === 'PRICING_ENABLED' ? (
                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${config.value === 'true' ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {config.value === 'true' ? 'Activado' : 'Desactivado (Gratis)'}
                                  </span>
                                  <Switch
                                    checked={config.value === 'true'}
                                    onCheckedChange={handleTogglePricing}
                                  />
                                </div>
                              ) : (
                                <>
                                  <span className="text-2xl font-black text-primary text-glow drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                                    {parseInt(config.value) ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(parseInt(config.value)) : config.value}
                                  </span>
                                  <Button variant="outline" size="sm" onClick={() => openEditConfig(config)} className="glass-card hover:border-primary/50 transition-colors">
                                    <Wrench size={14} className="mr-2" />
                                    Editar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sección Paquetes */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Gestión de Paquetes</CardTitle>
                    <CardDescription>Edita los precios y límites de los paquetes de publicación</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingPackages ? (
                      <div className="text-center py-4">Cargando paquetes...</div>
                    ) : (
                      <Tabs defaultValue="services-packages" className="w-full">
                        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                          <TabsList className="flex w-max min-w-full h-auto mb-2 p-1 gap-1 glass-card border-white/5">
                            <TabsTrigger value="services-packages">Servicios / Pymes</TabsTrigger>
                            <TabsTrigger value="jobs-packages">Empleos</TabsTrigger>
                          </TabsList>
                        </div>

                        <TabsContent value="services-packages" className="mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {adminPackages.services.map((pkg) => (
                              <Card key={pkg.id} className="glass-card border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                                <div className="absolute top-0 right-0 p-2">
                                  <Badge className={pkg.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                                    {pkg.is_active ? "Activo" : "Inactivo"}
                                  </Badge>
                                </div>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-primary" />
                                    {pkg.name}
                                  </CardTitle>
                                  <CardDescription className="line-clamp-2 text-xs text-muted-foreground">{pkg.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3 mb-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">Precio:</span>
                                      <span className="font-bold text-lg text-primary text-glow">
                                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(pkg.price)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-muted-foreground">Publicaciones:</span>
                                      <span className="font-bold text-secondary">+{pkg.publications}</span>
                                    </div>
                                  </div>
                                  <Button className="w-full glass-card border-white/10 hover:border-primary/50 transition-colors" variant="outline" size="sm" onClick={() => openEditPackage(pkg)}>
                                    Editar Paquete
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>

                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

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

        {/* Dialog para límites de publicaciones */}
        <Dialog open={publicationLimitsDialogOpen} onOpenChange={(open) => {
          setPublicationLimitsDialogOpen(open);
          if (!open) {
            setSelectedUserLimits(null);
            setLimitsError('');
          }
        }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Gestionar límites de publicaciones</DialogTitle>
              <DialogDescription>
                Asigna límites base y bonus para servicios/pymes y empleos.
              </DialogDescription>
            </DialogHeader>

            {loadingLimits && !selectedUserLimits ? (
              <div className="py-8 text-center text-muted-foreground">Cargando límites...</div>
            ) : limitsError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle size={16} />
                <AlertDescription>{limitsError}</AlertDescription>
              </Alert>
            ) : selectedUserLimits ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedUserLimits.user.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedUserLimits.user.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUserLimits.user.email}</p>
                    <Badge variant="outline" className="mt-1">{getRoleLabel(selectedUserLimits.user.role)}</Badge>
                  </div>
                </div>

                {/* Servicios / Pymes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Servicios/Pymes</CardTitle>
                    <CardDescription>
                      Total: {selectedUserLimits.services.total_limit} | Usadas: {selectedUserLimits.services.used} | Restantes: {selectedUserLimits.services.remaining}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Base</p>
                        <p className="font-semibold">{selectedUserLimits.services.base_limit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bonus</p>
                        <p className="font-semibold">{selectedUserLimits.services.bonus}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold">{selectedUserLimits.services.total_limit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Usadas</p>
                        <p className="font-semibold">{selectedUserLimits.services.used}</p>
                      </div>
                    </div>
                    {(() => {
                      const { percent, color, bar } = getUsageStatus(selectedUserLimits.services.used, selectedUserLimits.services.total_limit);
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progreso</span>
                            <span className={color}>{Math.round(percent)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${bar}`} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Empleos (solo empresa) */}
                {selectedUserLimits.user.role === 'company' && selectedUserLimits.jobs && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Empleos</CardTitle>
                      <CardDescription>
                        Total: {selectedUserLimits.jobs.total_limit} | Usadas: {selectedUserLimits.jobs.used} | Restantes: {selectedUserLimits.jobs.remaining}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Base</p>
                          <p className="font-semibold">{selectedUserLimits.jobs.base_limit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Bonus</p>
                          <p className="font-semibold">{selectedUserLimits.jobs.bonus}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-semibold">{selectedUserLimits.jobs.total_limit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Usadas</p>
                          <p className="font-semibold">{selectedUserLimits.jobs.used}</p>
                        </div>
                      </div>
                      {(() => {
                        const { percent, color, bar } = getUsageStatus(selectedUserLimits.jobs.used, selectedUserLimits.jobs.total_limit);
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Progreso</span>
                              <span className={color}>{Math.round(percent)}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full ${bar}`} style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Formulario edición */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Editar límites</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Límite base de servicios/pymes</Label>
                      <Input
                        type="number"
                        min={0}
                        value={limitsForm.services_limit}
                        onChange={(e) => setLimitsForm({ ...limitsForm, services_limit: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Publicaciones adicionales de servicios/pymes</Label>
                      <Input
                        type="number"
                        min={0}
                        value={limitsForm.services_bonus}
                        onChange={(e) => setLimitsForm({ ...limitsForm, services_bonus: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Total disponible: {limitsForm.services_limit + limitsForm.services_bonus}
                      </p>
                    </div>
                  </div>

                  {selectedUserLimits.user.role === 'company' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Límite base de empleos</Label>
                        <Input
                          type="number"
                          min={0}
                          value={limitsForm.jobs_limit}
                          onChange={(e) => setLimitsForm({ ...limitsForm, jobs_limit: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Publicaciones adicionales de empleos</Label>
                        <Input
                          type="number"
                          min={0}
                          value={limitsForm.jobs_bonus}
                          onChange={(e) => setLimitsForm({ ...limitsForm, jobs_bonus: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Total disponible: {limitsForm.jobs_limit + limitsForm.jobs_bonus}
                        </p>
                      </div>
                    </div>
                  )}

                  {limitsError && (
                    <Alert variant="destructive">
                      <AlertTriangle size={16} />
                      <AlertDescription>{limitsError}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter className="pt-2">
                  <Button variant="outline" onClick={() => {
                    setPublicationLimitsDialogOpen(false);
                    setSelectedUserLimits(null);
                    setLimitsError('');
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePublicationLimits} disabled={savingLimits}>
                    {savingLimits ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </DialogFooter>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

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

        {/* Dialog para editar configuración */}
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Configuración</DialogTitle>
              <DialogDescription>
                Modificando: {selectedConfig?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Clave</Label>
                <Input value={selectedConfig?.key || ''} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  value={configValue}
                  onChange={(e) => setConfigValue(e.target.value)}
                  placeholder="Ingrese el nuevo valor"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Para precios, ingrese solo números (ej: 2990).
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateConfig}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar paquete */}
        <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Paquete</DialogTitle>
              <DialogDescription>
                {selectedPackage?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Precio (CLP)</Label>
                <Input
                  type="number"
                  value={editPackageForm.price}
                  onChange={(e) => setEditPackageForm({ ...editPackageForm, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Cantidad de Publicaciones</Label>
                <Input
                  type="number"
                  value={editPackageForm.publications}
                  onChange={(e) => setEditPackageForm({ ...editPackageForm, publications: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdatePackage}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para rechazar servicio */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rechazar Servicio</DialogTitle>
              <DialogDescription>
                Rechazando: <strong>{serviceToReject?.service_name}</strong> de {serviceToReject?.user_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Motivo del rechazo (opcional)</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: El servicio no cumple con las políticas de la plataforma..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si proporcionas un motivo, el usuario podrá verlo en su perfil.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleRejectService}>
                <X size={16} className="mr-2" />
                Confirmar Rechazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
};

export default Admin;
