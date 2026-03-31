import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Loader2,
  Crown,
  MapPin,
  Star,
  List,
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
  ChefHat,
  Car,
  Home as HomeIcon,
  Phone,
  Edit,
  Plug,
  PaintRoller,
  Flame,
  Utensils,
  Dumbbell,
  GraduationCap,
  Baby,
  Stethoscope,
  Globe,
  Database,
  Smartphone,
  Plane,
  Gift,
  Trophy,
  Coffee,
  Wallet,
  Trees,
  PawPrint,
  Flower2,
  Sun,
  Moon,
  Bike,
  Cpu,
  Mouse,
  Monitor,
  Cloud,
  Code,
  Languages,
  Book,
  School,
  HardHat,
  Construction,
  Drill,
  PlugZap,
  Waves,
  Zap,
  Ticket,
  Video,
  Mic,
  Smile,
  Gamepad2,
  Brush,
  Wind,
  Pill,
  Activity,
  Apple,
  Bone,
  Gem,
  Key,
  Gamepad,
  Search,
  Settings,
  Bell,
  Navigation,
  Anchor,
  Wind as WindIcon,
  Calendar,
  Clock3,
  ClipboardList,
  PenTool,
  Megaphone,
  Target,
  Rocket,
  Bot,
  BadgeCheck,
  Package2,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { adminAPI, authAPI, configAPI, packagesAPI } from '@/lib/api';
import { formatProductPrice } from '@/lib/productUtils';
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
import { cn } from '@/lib/utils';

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

interface AdminProduct {
  id: string;
  title: string;
  description: string;
  comuna: string;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
  price?: number | null;
  currency?: string;
  product_status?: string;
  cover_image_url?: string | null;
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

const getServiceStatusConfig = (rawStatus?: string) => {
  const status = String(rawStatus || '').toLowerCase().trim();
  if (status === 'active') {
    return {
      badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-700',
      cardClass: 'border-emerald-200/70 dark:border-emerald-900/60',
      label: 'Activo',
    };
  }
  if (status === 'pending') {
    return {
      badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-700',
      cardClass: 'border-amber-200/70 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/60',
      label: 'Pendiente',
    };
  }
  if (status === 'rejected' || status === 'suspended') {
    return {
      badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-300 dark:border-rose-700',
      cardClass: 'border-rose-200/70 dark:border-rose-900/60',
      label: 'Bloqueado',
    };
  }
  if (status === 'inactive') {
    return {
      badgeClass: 'bg-slate-500/15 text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700',
      cardClass: 'border-slate-200/70 dark:border-slate-800',
      label: 'Inactivo',
    };
  }
  return {
    badgeClass: 'bg-muted text-muted-foreground border-border',
    cardClass: 'border-border/60',
    label: rawStatus || 'Desconocido',
  };
};

function normalizeCatalogName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

type AdminServiceCountRow = { service_name: string; service_type_ids?: string[] };

function buildCatalogServiceCounts(
  types: Array<{ id: string; name: string }>,
  services: AdminServiceCountRow[]
): { byId: Record<string, number>; uncategorized: number } {
  const byId: Record<string, number> = {};
  for (const t of types) {
    byId[t.id] = 0;
  }

  const nameToTypeId = new Map<string, string>();
  for (const t of types) {
    const key = normalizeCatalogName(t.name);
    if (!nameToTypeId.has(key)) {
      nameToTypeId.set(key, t.id);
    }
  }

  let uncategorized = 0;

  for (const s of services) {
    const ids = Array.isArray(s.service_type_ids) ? s.service_type_ids.map(String) : [];
    if (ids.length > 0) {
      let anyHit = false;
      for (const rawId of ids) {
        if (Object.prototype.hasOwnProperty.call(byId, rawId)) {
          byId[rawId]++;
          anyHit = true;
        }
      }
      if (!anyHit) uncategorized++;
    } else {
      const tid = nameToTypeId.get(normalizeCatalogName(s.service_name || ''));
      if (tid) {
        byId[tid]++;
      } else {
        uncategorized++;
      }
    }
  }

  return { byId, uncategorized };
}

const Admin = () => {
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role_number === 5;

  // Estados para datos (recomendaciones)
  const [datos, setDatos] = useState<any[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(false);


  // Estados para services
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceFilters, setServiceFilters] = useState({ comuna: '', status: 'pending' });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [serviceToReject, setServiceToReject] = useState<Service | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productFilters, setProductFilters] = useState({ comuna: '', status: 'pending' });
  const [rejectProductDialogOpen, setRejectProductDialogOpen] = useState(false);
  const [productToReject, setProductToReject] = useState<AdminProduct | null>(null);
  const [rejectProductReason, setRejectProductReason] = useState('');

  // Estados para users (solo super-admin)
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilters, setUserFilters] = useState({ role: 'all', is_active: 'all', is_banned: 'all' });

  // Estados para logs (solo super-admin)
  const [logs, setLogs] = useState<Log[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logLevel, setLogLevel] = useState('all');
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
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
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogTypeServiceCounts, setCatalogTypeServiceCounts] = useState<Record<string, number>>({});
  const [catalogUncategorizedCount, setCatalogUncategorizedCount] = useState(0);
  const [catalogTotalServicesScanned, setCatalogTotalServicesScanned] = useState(0);
  const [loadingCatalogCounts, setLoadingCatalogCounts] = useState(false);
  /** Origen del contador de servicios por categoría (para textos de ayuda) */
  const [catalogCountsSource, setCatalogCountsSource] = useState<'server' | 'client' | 'none'>('none');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', icon: 'Wrench', is_active: true, color: '#1a73e8' });
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

  const loadDatos = async () => {
    try {
      setLoadingDatos(true);
      const response = await adminAPI.getAllTickets({
        category: 'recommendation',
        limit: 50,
      });
      setDatos(response.tickets);
    } catch (error: any) {
      console.error('Error loading datos:', error);
      toast.error(error.message || 'Error al cargar datos');
    } finally {
      setLoadingDatos(false);
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

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await adminAPI.getAllProducts({
        comuna: productFilters.comuna || undefined,
        status: productFilters.status !== 'all' ? productFilters.status : undefined,
        limit: 50,
      });
      setAdminProducts(response.products);
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast.error(error.message || 'Error al cargar productos');
    } finally {
      setLoadingProducts(false);
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

  const fetchAllAdminServicesForCatalogCounts = async (): Promise<AdminServiceCountRow[]> => {
    const all: AdminServiceCountRow[] = [];
    let page = 1;
    const limit = 100;
    for (let guard = 0; guard < 100; guard++) {
      const res = await adminAPI.getAllServices({ page, limit });
      for (const s of res.services) {
        all.push({
          service_name: s.service_name,
          service_type_ids: s.service_type_ids,
        });
      }
      if (page >= res.pagination.totalPages || res.pagination.totalPages === 0) break;
      page += 1;
    }
    return all;
  };

  const loadAdminCatalogPanel = async () => {
    setLoadingCatalog(true);
    setLoadingCatalogCounts(true);
    setCatalogTotalServicesScanned(0);
    try {
      const response = await adminAPI.getAdminServiceTypes();
      const types = response.types || [];
      setCatalogTypes(types);

      if (types.length === 0) {
        setCatalogTypeServiceCounts({});
        setCatalogUncategorizedCount(0);
        setCatalogCountsSource('none');
        return;
      }

      const serverCounts = types.every(
        (t: { services_count?: number }) => typeof t.services_count === 'number'
      );

      if (serverCounts) {
        const m: Record<string, number> = {};
        let sum = 0;
        for (const t of types) {
          const c = t.services_count ?? 0;
          m[t.id] = c;
          sum += c;
        }
        setCatalogTypeServiceCounts(m);
        setCatalogUncategorizedCount(0);
        setCatalogTotalServicesScanned(sum);
        setCatalogCountsSource('server');
        return;
      }

      setCatalogCountsSource('client');
      const services = await fetchAllAdminServicesForCatalogCounts();
      setCatalogTotalServicesScanned(services.length);
      const { byId, uncategorized } = buildCatalogServiceCounts(types, services);
      setCatalogTypeServiceCounts(byId);
      setCatalogUncategorizedCount(uncategorized);
    } catch (error: any) {
      console.error('Error loading service types:', error);
      toast.error(error.message || 'Error al cargar tipos de servicios');
      setCatalogTypeServiceCounts({});
      setCatalogUncategorizedCount(0);
      setCatalogCountsSource('none');
    } finally {
      setLoadingCatalog(false);
      setLoadingCatalogCounts(false);
    }
  };

  const filteredCatalogTypes = useMemo(() => {
    const q = catalogSearchQuery.trim().toLowerCase();
    let list = catalogTypes;
    if (q) {
      list = catalogTypes.filter(
        (t) =>
          (t.name || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  }, [catalogTypes, catalogSearchQuery]);

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
      if (action === 'approve') loadAdminCatalogPanel();
    } catch (error: any) {
      console.error('Error processing suggestion:', error);
      toast.error(error.message || 'Error al procesar sugerencia');
    } finally {
      setIsProcessingSuggestion(null);
    }
  };

  const openNewServiceTypeDialog = () => {
    setSelectedType(null);
    setTypeForm({ name: '', description: '', icon: 'Wrench', is_active: true, color: '#1a73e8' });
    setTypeDialogOpen(true);
  };

  const openEditServiceTypeDialog = (type: any) => {
    setSelectedType({ ...type, id: String(type.id) });
    setTypeForm({
      name: type.name != null ? String(type.name) : '',
      description: type.description ?? '',
      icon: type.icon || 'Wrench',
      is_active: type.is_active !== false && type.is_active !== 0 && type.is_active !== '0',
      color: type.color || '#1a73e8',
    });
    setTypeDialogOpen(true);
  };

  const handleSaveServiceType = async () => {
    try {
      if (selectedType) {
        await adminAPI.updateServiceType(String(selectedType.id), typeForm);
        setCatalogTypes((prev) =>
          prev.map((t) => (String(t.id) === String(selectedType.id) ? { ...t, ...typeForm } : t)),
        );
        toast.success('Tipo de servicio actualizado');
      } else {
        const response = await adminAPI.createServiceType(typeForm);
        if (response.type) {
          setCatalogTypes(prev => [...prev, response.type]);
        }
        toast.success('Tipo de servicio creado');
      }
      setTypeDialogOpen(false);
      // Recargar para sincronizar con el ID real y otros campos del backend
      setTimeout(() => loadAdminCatalogPanel(), 500);
    } catch (error: any) {
      console.error('Error saving service type:', error);
      toast.error(error.message || 'Error al guardar tipo de servicio');
    }
  };

  const isLightColor = (color?: string) => {
    if (!color) return false;
    if (color && color.startsWith('var')) return false;
    try {
      const hex = color.replace('#', '');
      if (hex.length !== 6) return false;
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 180;
    } catch (e) {
      return false;
    }
  };

  const handleDeleteServiceType = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tipo de servicio?')) return;
    try {
      await adminAPI.deleteServiceType(String(id));
      toast.success('Tipo de servicio eliminado');
      loadAdminCatalogPanel();
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
      loadDatos();
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
      loadDatos();
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      toast.error(error.message || 'Error al actualizar el estado');
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

  const handleApproveProduct = async (id: string) => {
    try {
      await adminAPI.approveProduct(id);
      toast.success('Producto aprobado y publicado');
      loadProducts();
      loadStats();
    } catch (error: any) {
      console.error('Error approving product:', error);
      toast.error(error.message || 'Error al aprobar el producto');
    }
  };

  const handleRejectProduct = async () => {
    if (!productToReject) return;
    try {
      await adminAPI.rejectProduct(productToReject.id, rejectProductReason.trim() || undefined);
      toast.success('Producto rechazado');
      setRejectProductDialogOpen(false);
      setProductToReject(null);
      setRejectProductReason('');
      loadProducts();
      loadStats();
    } catch (error: any) {
      console.error('Error rejecting product:', error);
      toast.error(error.message || 'Error al rechazar el producto');
    }
  };

  const handleDeleteAdminProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto de forma permanente?')) return;
    try {
      await adminAPI.deleteAdminProduct(id);
      toast.success('Producto eliminado');
      loadProducts();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Error al eliminar el producto');
    }
  };

  const normalizeIconKey = (value: string) => value.toLowerCase().replace(/[\s_-]/g, '');
  const iconAliases: Record<string, string> = {
    ship: 'Ship',
    store: 'Store',
    storefront: 'Store',
    homeicon: 'Home',
    house: 'Home',
    building: 'Building2',
    briefcasebusiness: 'Briefcase',
    gamepad: 'Gamepad',
    gamepad2: 'Gamepad2',
    chat: 'MessageSquare',
    message: 'MessageSquare',
    messagecircle: 'MessageSquare',
    shield: 'ShieldCheck',
    help: 'HelpCircle',
    helpcircle: 'HelpCircle',
    map: 'MapPin',
    mappin: 'MapPin',
    location: 'MapPin',
    cog: 'Settings',
    check: 'CheckCircle',
    warning: 'AlertTriangle',
    file: 'FileText',
    badgecheck: 'BadgeCheck',
    clipboard: 'ClipboardList',
    clock: 'Clock3',
    calendar: 'Calendar',
  };

  const IconRenderer = ({ name, size = 16, className = "" }: { name: string, size?: number, className?: string }) => {
    const canonical = iconAliases[normalizeIconKey(name)] || name;
    switch (canonical) {
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
      case 'Plug': return <Plug size={size} className={className} />;
      case 'PaintRoller': return <PaintRoller size={size} className={className} />;
      case 'Flame': return <Flame size={size} className={className} />;
      case 'Utensils': return <Utensils size={size} className={className} />;
      case 'Dumbbell': return <Dumbbell size={size} className={className} />;
      case 'GraduationCap': return <GraduationCap size={size} className={className} />;
      case 'Baby': return <Baby size={size} className={className} />;
      case 'Stethoscope': return <Stethoscope size={size} className={className} />;
      case 'Globe': return <Globe size={size} className={className} />;
      case 'Database': return <Database size={size} className={className} />;
      case 'Smartphone': return <Smartphone size={size} className={className} />;
      case 'Plane': return <Plane size={size} className={className} />;
      case 'Gift': return <Gift size={size} className={className} />;
      case 'Trophy': return <Trophy size={size} className={className} />;
      case 'Coffee': return <Coffee size={size} className={className} />;
      case 'Wallet': return <Wallet size={size} className={className} />;
      case 'Trees': return <Trees size={size} className={className} />;
      case 'PawPrint': return <PawPrint size={size} className={className} />;
      case 'Flower2': return <Flower2 size={size} className={className} />;
      case 'Sun': return <Sun size={size} className={className} />;
      case 'Moon': return <Moon size={size} className={className} />;
      case 'Bike': return <Bike size={size} className={className} />;
      case 'Cpu': return <Cpu size={size} className={className} />;
      case 'Mouse': return <Mouse size={size} className={className} />;
      case 'Monitor': return <Monitor size={size} className={className} />;
      case 'Cloud': return <Cloud size={size} className={className} />;
      case 'Code': return <Code size={size} className={className} />;
      case 'Languages': return <Languages size={size} className={className} />;
      case 'Book': return <Book size={size} className={className} />;
      case 'School': return <School size={size} className={className} />;
      case 'HardHat': return <HardHat size={size} className={className} />;
      case 'Construction': return <Construction size={size} className={className} />;
      case 'Drill': return <Drill size={size} className={className} />;
      case 'PlugZap': return <PlugZap size={size} className={className} />;
      case 'Waves': return <Waves size={size} className={className} />;
      case 'Zap': return <Zap size={size} className={className} />;
      case 'Ticket': return <Ticket size={size} className={className} />;
      case 'Video': return <Video size={size} className={className} />;
      case 'Mic': return <Mic size={size} className={className} />;
      case 'Smile': return <Smile size={size} className={className} />;
      case 'Gamepad2': return <Gamepad2 size={size} className={className} />;
      case 'Brush': return <Brush size={size} className={className} />;
      case 'Wind': return <Wind size={size} className={className} />;
      case 'Pill': return <Pill size={size} className={className} />;
      case 'Activity': return <Activity size={size} className={className} />;
      case 'Apple': return <Apple size={size} className={className} />;
      case 'Bone': return <Bone size={size} className={className} />;
      case 'Gem': return <Gem size={size} className={className} />;
      case 'Key': return <Key size={size} className={className} />;
      case 'Search': return <Search size={size} className={className} />;
      case 'Settings': return <Settings size={size} className={className} />;
      case 'Bell': return <Bell size={size} className={className} />;
      case 'Navigation': return <Navigation size={size} className={className} />;
      case 'Anchor': return <Anchor size={size} className={className} />;
      case 'Ship': return <Anchor size={size} className={className} />;
      case 'Store': return <ShoppingBag size={size} className={className} />;
      case 'Gamepad': return <Gamepad2 size={size} className={className} />;
      case 'Calendar': return <Calendar size={size} className={className} />;
      case 'Clock3': return <Clock3 size={size} className={className} />;
      case 'ClipboardList': return <ClipboardList size={size} className={className} />;
      case 'PenTool': return <PenTool size={size} className={className} />;
      case 'Megaphone': return <Megaphone size={size} className={className} />;
      case 'Target': return <Target size={size} className={className} />;
      case 'Rocket': return <Rocket size={size} className={className} />;
      case 'Bot': return <Bot size={size} className={className} />;
      case 'BadgeCheck': return <BadgeCheck size={size} className={className} />;
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
      // Standarize keys to uppercase for frontend logic
      const standardizedConfig = response.config.map((c: any) => ({
        ...c,
        key: c.key.trim().toUpperCase()
      }));
      setAdminConfig(standardizedConfig);
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
     
  }, []);

  // Recargar datos al cambiar de pestaña
  useEffect(() => {
    switch (activeTab) {
      case 'datos': loadDatos(); break;
      case 'services': loadServices(); break;
      case 'products': loadProducts(); break;
      case 'users': loadUsers(); break;
      case 'tickets': loadTickets(); break;
      case 'catalog':
        loadAdminCatalogPanel();
        loadServiceSuggestions();
        break;
      case 'prices':
        loadAdminConfig();
        loadAdminPackages();
        break;
      case 'logs': loadLogs(); break;
    }
  }, [activeTab]);

  useEffect(() => {
    const refreshActiveTab = () => {
      switch (activeTab) {
        case 'datos': loadDatos(); break;
        case 'services': loadServices(); break;
        case 'products': loadProducts(); break;
        case 'users': loadUsers(); break;
        case 'tickets': loadTickets(); break;
        case 'catalog':
          loadAdminCatalogPanel();
          loadServiceSuggestions();
          break;
        case 'prices':
          loadAdminConfig();
          loadAdminPackages();
          break;
        case 'logs': loadLogs(); break;
      }
    };

    const onFocus = () => refreshActiveTab();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshActiveTab();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!isLoggedIn || (!user?.roles.includes('admin') && user?.role_number !== 5 && !user?.roles.includes('super-admin'))) {
      navigate('/');
    }
  }, [isLoggedIn, user, navigate]);

  // Mostrar loading o redirigir si no tiene permisos
  if (!isLoggedIn || (!user?.roles.includes('admin') && user?.role_number !== 5 && !user?.roles.includes('super-admin'))) {
    return null;
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center rounded-2xl border border-border/60 bg-card/80 p-8 shadow-lg backdrop-blur-sm">
          <Loader2 className="h-12 w-12 text-primary animate-spin" aria-hidden />
          <p className="text-muted-foreground font-medium">Cargando panel de control…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 relative overflow-x-hidden pb-16 sm:pb-12">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-8 relative z-10">
        {/* Encabezado */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 glass-card rounded-2xl sm:rounded-3xl border border-primary/15 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2 min-w-0">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors -mt-0.5"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Volver al inicio
              </Link>
              <div className="flex items-start gap-3">
                <div className="mt-1 hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <LayoutDashboard className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary leading-tight">
                    Panel de {isSuperAdmin ? 'Super Admin' : 'Administración'}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
                    Moderación, usuarios y configuración en un solo lugar. En móvil, desliza las pestañas horizontalmente.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
              <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium gap-1.5 border border-border/60">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </Badge>
              {user?.name ? (
                <span className="text-sm text-muted-foreground truncate max-w-[min(100%,14rem)]" title={user.name}>
                  {user.name}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-card/60 backdrop-blur-sm border-primary/15 shadow-sm rounded-2xl group hover:border-primary/35 transition-all duration-300">
              <CardHeader className="pb-1 sm:pb-2 px-4 pt-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors leading-tight">
                  Servicios totales
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums">{stats.total_services ?? 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-sm border-secondary/15 shadow-sm rounded-2xl group hover:border-secondary/35 transition-all duration-300">
              <CardHeader className="pb-1 sm:pb-2 px-4 pt-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-secondary transition-colors leading-tight">
                  Servicios activos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums">{stats.active_services ?? 0}</div>
              </CardContent>
            </Card>
            {isSuperAdmin && stats.total_products != null && (
              <Card className="bg-card/60 backdrop-blur-sm border-emerald-500/15 shadow-sm rounded-2xl group hover:border-emerald-500/35 transition-all duration-300">
                <CardHeader className="pb-1 sm:pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors leading-tight flex items-center gap-1.5">
                    <Package2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Productos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums">{stats.total_products ?? 0}</div>
                  {stats.active_products != null && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 tabular-nums">
                      Activos: {stats.active_products}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            {isSuperAdmin && (
              <Card
                className={cn(
                  'bg-card/60 backdrop-blur-sm border-amber-500/15 shadow-sm rounded-2xl group hover:border-amber-500/35 transition-all duration-300',
                  stats.total_products == null && 'col-span-2 lg:col-span-1',
                )}
              >
                <CardHeader className="pb-1 sm:pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-amber-600 transition-colors leading-tight">
                    Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl sm:text-3xl font-bold tabular-nums">{stats.total_users ?? 0}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-snug">
                    Activos: {stats.active_users ?? 0} · Baneados: {stats.banned_users ?? 0}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-30 -mx-1 px-1 py-2 mb-4 sm:mb-5 rounded-2xl border border-border/50 bg-background/90 backdrop-blur-md shadow-sm sm:static sm:mx-0 sm:px-0 sm:py-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:shadow-none">
            <p className="sm:hidden text-xs text-muted-foreground mb-2 px-1">Desliza para ver todas las secciones</p>
            <div className="w-full overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide touch-pan-x">
              <TabsList
                className={cn(
                  'flex w-max min-w-max sm:flex-wrap sm:w-full sm:min-w-0 h-auto p-1.5 gap-1 sm:gap-1.5',
                  'rounded-xl border border-border/60 bg-muted/40 shadow-inner',
                  'justify-start sm:justify-start',
                )}
              >
              <TabsTrigger
                value="services"
                onClick={loadServices}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Servicios
              </TabsTrigger>
              <TabsTrigger
                value="products"
                onClick={loadProducts}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <Package2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Productos
              </TabsTrigger>
              <TabsTrigger
                value="datos"
                onClick={loadDatos}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Datos
              </TabsTrigger>
              <TabsTrigger
                value="users"
                onClick={loadUsers}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger
                value="tickets"
                onClick={loadTickets}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Tickets
              </TabsTrigger>
              <TabsTrigger
                value="catalog"
                onClick={() => {
                  loadAdminCatalogPanel();
                  loadServiceSuggestions();
                }}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Catálogo
              </TabsTrigger>
              {isSuperAdmin && (
                <>
                  <TabsTrigger
                    value="prices"
                    onClick={() => {
                      loadAdminConfig();
                      loadAdminPackages();
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-md"
                  >
                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    Precios
                  </TabsTrigger>
                  <TabsTrigger
                    value="logs"
                    onClick={loadLogs}
                    className="flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-3 py-2.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-md"
                  >
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    Logs
                  </TabsTrigger>
                </>
              )}
              </TabsList>
            </div>
          </div>

          {/* Tab de Datos */}
          <TabsContent value="datos" className="mt-4 sm:mt-6 outline-none focus-visible:outline-none">
            <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Recomendaciones de la Comunidad (Datos)</CardTitle>
                <CardDescription>Visualiza los datos enviados por los vecinos a través del formulario de la página principal.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDatos ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : datos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay recomendaciones enviadas aún.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {datos.map((dato) => (
                      <Card key={dato.id} className="border hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg text-primary">{dato.subject.replace('Nuevo Dato: ', '')}</CardTitle>
                              <CardDescription>
                                Enviado por: {dato.user_name} ({dato.user_email})
                              </CardDescription>
                              <CardDescription className="mt-1">
                                {formatDate(dato.created_at)}
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                               <Badge variant={dato.status === 'open' ? 'default' : 'secondary'}>
                                 {dato.status === 'open' ? 'Pendiente' : 'Gestionado'}
                               </Badge>
                               <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateTicketStatus(dato.id, dato.status === 'open' ? 'closed' : 'open')}
                                >
                                  {dato.status === 'open' ? 'Marcar como gestionado' : 'Reabrir'}
                                </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                             <p className="whitespace-pre-wrap text-sm leading-relaxed">{dato.message}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Tab de Servicios */}
          <TabsContent value="services" className="mt-4 sm:mt-6 outline-none focus-visible:outline-none">
            <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Servicios/Pymes</CardTitle>
                <CardDescription>
                  Gestiona todos los servicios con una vista optimizada para escritorio y teléfono.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 rounded-2xl border border-border/60 bg-muted/30 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Select value={serviceFilters.status} onValueChange={(value) => setServiceFilters({ ...serviceFilters, status: value })}>
                    <SelectTrigger className="w-full sm:w-60 bg-background/70 border-border/60">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
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
                      className="pl-10 bg-background/70 border-border/60"
                    />
                  </div>
                  <Button onClick={loadServices} className="bg-primary hover:bg-primary/90 sm:px-6">
                    Buscar
                  </Button>
                  </div>
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
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <Card
                        key={service.id}
                        className={cn(
                          'rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md',
                          getServiceStatusConfig(service.status).cardClass
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                            <div className="flex-1">
                              <CardTitle className="text-base sm:text-lg leading-tight">
                                {service.service_name || 'Servicio sin nombre'}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {service.user_name} ({service.user_email})
                              </CardDescription>
                              <CardDescription className="mt-1 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {service.comuna || 'Sin comuna'}
                              </CardDescription>
                              <CardDescription className="mt-1 text-xs">
                                {formatDate(service.created_at)}
                              </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                              <Badge
                                variant="outline"
                                className={cn('font-semibold', getServiceStatusConfig(service.status).badgeClass)}
                              >
                                {getServiceStatusConfig(service.status).label}
                              </Badge>
                              {(service.status?.toLowerCase().trim() === 'pending' || service.status?.toLowerCase().trim() === 'inactive') ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleApproveService(service.id)}
                                  >
                                    <CheckCircle size={14} className="mr-1" />
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-800"
                                    onClick={() => { setServiceToReject(service); setRejectReason(''); setRejectDialogOpen(true); }}
                                  >
                                    <X size={14} className="mr-1" />
                                    Rechazar
                                  </Button>
                                </>
                              ) : null}
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
                          <p className="text-sm leading-relaxed text-foreground/90 mb-3">
                            {service.description || 'Sin descripción disponible.'}
                          </p>
                          {service.price_range && (
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 inline-flex">
                              Precio: {service.price_range}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Productos (marketplace — moderación) */}
          <TabsContent value="products" className="mt-4 sm:mt-6 outline-none focus-visible:outline-none">
            <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Productos (marketplace)</CardTitle>
                <CardDescription>
                  Gestiona publicaciones de productos. Los pendientes requieren aprobación antes de verse en la vista pública.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <Select
                    value={productFilters.status}
                    onValueChange={(value) => setProductFilters({ ...productFilters, status: value })}
                  >
                    <SelectTrigger className="w-full sm:w-56 glass-card border-white/10">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10 backdrop-blur-xl">
                      <SelectItem value="all">🌐 Todos los estados</SelectItem>
                      <SelectItem value="pending">⏳ Pendientes (Aprobación)</SelectItem>
                      <SelectItem value="active">✅ Activos / Publicados</SelectItem>
                      <SelectItem value="rejected">🛑 Rechazados</SelectItem>
                      <SelectItem value="inactive">🌑 Inactivos</SelectItem>
                      <SelectItem value="suspended">⚠️ Suspendidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" size={16} />
                    <Input
                      placeholder="Filtrar por comuna..."
                      value={productFilters.comuna}
                      onChange={(e) => setProductFilters({ ...productFilters, comuna: e.target.value })}
                      className="pl-10 glass-card border-white/10"
                    />
                  </div>
                  <Button onClick={loadProducts} className="bg-primary hover:bg-primary/90">
                    Buscar
                  </Button>
                </div>

                {loadingProducts ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando productos...</p>
                  </div>
                ) : adminProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay productos con ese filtro</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminProducts.map((p) => {
                      const st = p.status?.toLowerCase().trim() || '';
                      return (
                        <Card key={p.id} className={`border ${st === 'pending' ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                              <div className="flex gap-3 flex-1 min-w-0">
                                {p.cover_image_url ? (
                                  <div className="w-20 h-20 rounded-xl overflow-hidden border shrink-0 bg-muted">
                                    <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ) : null}
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-lg line-clamp-2">{p.title}</CardTitle>
                                  <CardDescription>
                                    Por: {p.user_name} ({p.user_email}) — {p.comuna}
                                  </CardDescription>
                                  <CardDescription className="mt-1">{formatDate(p.created_at)}</CardDescription>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
                                <Badge
                                  className={
                                    st === 'active'
                                      ? 'bg-green-500 text-white border-green-600'
                                      : st === 'pending'
                                        ? 'bg-amber-500 text-white border-amber-600'
                                        : st === 'rejected' || st === 'suspended'
                                          ? 'bg-red-500 text-white border-red-600'
                                          : 'bg-gray-500 text-white border-gray-600'
                                  }
                                >
                                  {st === 'active'
                                    ? '✅ Activo'
                                    : st === 'pending'
                                      ? '⏳ Pendiente'
                                      : st === 'rejected' || st === 'suspended'
                                        ? '❌ Bloqueado'
                                        : p.status}
                                </Badge>
                                {(st === 'pending' || st === 'inactive') && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleApproveProduct(p.id)}
                                    >
                                      <CheckCircle size={14} className="mr-1" />
                                      Aprobar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-300 text-red-600 hover:bg-red-50 shadow-sm"
                                      onClick={() => {
                                        setProductToReject(p);
                                        setRejectProductReason('');
                                        setRejectProductDialogOpen(true);
                                      }}
                                    >
                                      <X size={14} className="mr-1" />
                                      Rechazar
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteAdminProduct(p.id)}
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="mb-2 text-sm line-clamp-4">{p.description}</p>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span>Precio: {formatProductPrice(p.price ?? null, p.currency ?? 'CLP')}</span>
                              {p.product_status && (
                                <Badge variant="outline" className="font-normal">
                                  Estado artículo: {p.product_status}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Usuarios (Admin puede ver y banear, Super Admin puede hacer todo) */}
          <TabsContent value="users" className="mt-4 sm:mt-6 outline-none focus-visible:outline-none">
            <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
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
          <TabsContent value="tickets" className="mt-4 sm:mt-6 outline-none focus-visible:outline-none">
            <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
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
                      <SelectItem value="recommendation">Recomendación (Dato)</SelectItem>
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
          <TabsContent value="catalog" className="mt-4 sm:mt-6 outline-none focus-visible:outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
              {/* Gestión de Categorías */}
              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 border-b border-border/50 bg-muted/20 pb-4">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl">Categorías de servicios</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Catálogo oficial. En escritorio verás tabla; en teléfono, tarjetas compactas.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 w-full sm:w-auto"
                    onClick={openNewServiceTypeDialog}
                  >
                    <Plus size={16} className="mr-2" />
                    Nuevo tipo
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-5">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      value={catalogSearchQuery}
                      onChange={(e) => setCatalogSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre o descripción…"
                      className="h-11 rounded-xl pl-9 pr-3"
                      disabled={loadingCatalog && catalogTypes.length === 0}
                    />
                  </div>

                  {!loadingCatalog && catalogTypes.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        Mostrando <strong className="text-foreground">{filteredCatalogTypes.length}</strong> de{' '}
                        <strong className="text-foreground">{catalogTypes.length}</strong> categorías
                        {catalogSearchQuery.trim() ? ' (filtro activo)' : ''}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        {loadingCatalogCounts ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Contando servicios…
                          </span>
                        ) : (
                          <>
                            <Badge variant="secondary" className="font-mono tabular-nums">
                              {catalogTotalServicesScanned} servicios
                            </Badge>
                            {catalogCountsSource === 'client' && catalogUncategorizedCount > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                Sin categoría: {catalogUncategorizedCount}
                              </Badge>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {catalogCountsSource === 'client' && !loadingCatalogCounts && catalogTypes.length > 0 && (
                    <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
                      Conteo calculado aquí: se agrupa por <code className="rounded bg-muted px-1">service_type_ids</code> si el
                      listado admin los trae; si no, por coincidencia del nombre del servicio con el nombre de la categoría.
                    </p>
                  )}
                  {catalogCountsSource === 'server' && (
                    <p className="mb-3 text-[11px] text-muted-foreground">
                      Cantidades de servicios provistas por el backend en cada categoría.
                    </p>
                  )}

                  {loadingCatalog ? (
                    <div className="space-y-2 py-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-14 w-full rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : catalogTypes.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                      No hay categorías configuradas
                    </div>
                  ) : filteredCatalogTypes.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                      Ninguna categoría coincide con la búsqueda
                    </div>
                  ) : (
                    <>
                      {/* Vista móvil: tarjetas */}
                      <div className="max-h-[min(70vh,560px)] space-y-2 overflow-y-auto pr-1 md:hidden">
                        {filteredCatalogTypes.map((type: any) => (
                          <div
                            key={type.id}
                            className={`flex gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm ${!type.is_active ? 'opacity-65 grayscale-[0.4]' : ''}`}
                          >
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${isLightColor(type.color || '#1a73e8') ? 'text-black' : 'text-white'}`}
                              style={{ backgroundColor: type.color || '#1a73e8' }}
                            >
                              <IconRenderer name={type.icon || 'Wrench'} size={22} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold leading-tight text-sm">{type.name}</p>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                  {!type.is_active && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                      Inactivo
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
                                    {loadingCatalogCounts ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>{catalogTypeServiceCounts[type.id] ?? 0} srv.</>
                                    )}
                                  </Badge>
                                </div>
                              </div>
                              {type.description ? (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{type.description}</p>
                              ) : null}
                              <div className="mt-2 flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg px-2 text-xs"
                                  title="Editar"
                                  onClick={() => openEditServiceTypeDialog(type)}
                                >
                                  <Edit size={14} className="mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 rounded-lg px-2 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteServiceType(type.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Vista escritorio: tabla */}
                      <div className="hidden max-h-[min(70vh,640px)] overflow-auto rounded-xl border border-border/60 md:block">
                        <table className="w-full min-w-[640px] caption-bottom text-sm">
                          <thead className="sticky top-0 z-10 border-b border-border/60 bg-muted/90 backdrop-blur-sm">
                            <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              <th className="px-3 py-3 pl-4">Categoría</th>
                              <th className="hidden lg:table-cell px-3 py-3 max-w-[240px]">Descripción</th>
                              <th className="px-3 py-3 w-[100px]">Estado</th>
                              <th className="px-3 py-3 w-[110px] text-right">Servicios</th>
                              <th className="px-3 py-3 pr-4 w-[120px] text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {filteredCatalogTypes.map((type: any) => (
                              <tr
                                key={type.id}
                                className={`bg-card/80 transition-colors hover:bg-muted/40 ${!type.is_active ? 'opacity-70' : ''}`}
                              >
                                <td className="px-3 py-3 pl-4">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isLightColor(type.color || '#1a73e8') ? 'text-black' : 'text-white'}`}
                                      style={{ backgroundColor: type.color || '#1a73e8' }}
                                    >
                                      <IconRenderer name={type.icon || 'Wrench'} size={20} />
                                    </div>
                                    <span className="font-medium">{type.name}</span>
                                  </div>
                                </td>
                                <td className="hidden lg:table-cell px-3 py-3 max-w-[280px]">
                                  <span className="line-clamp-2 text-muted-foreground text-xs">
                                    {type.description || '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  {type.is_active ? (
                                    <Badge className="bg-green-600/15 text-green-700 hover:bg-green-600/20 text-[10px]">
                                      Activa
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px]">
                                      Inactiva
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-right tabular-nums">
                                  {loadingCatalogCounts ? (
                                    <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
                                  ) : (
                                    <span className="font-semibold">{catalogTypeServiceCounts[type.id] ?? 0}</span>
                                  )}
                                </td>
                                <td className="px-3 py-3 pr-4 text-right">
                                  <div className="inline-flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
                                      title="Editar"
                                      onClick={() => openEditServiceTypeDialog(type)}
                                    >
                                      <Edit size={16} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10"
                                      title="Eliminar"
                                      onClick={() => handleDeleteServiceType(type.id)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Buzón de Sugerencias */}
              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
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

          {/* Tab de Precios y Paquetes */}
          {isSuperAdmin && (
            <TabsContent value="prices" className="mt-4 sm:mt-6 outline-none focus-visible:outline-none">
              <div className="grid grid-cols-1 gap-6">
                {/* Sección Configuración Global */}
                <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle>Configuración Global</CardTitle>
                    <CardDescription>Ajustes generales de precios del sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingConfig ? (
                      <div className="text-center py-4">Cargando configuración...</div>
                    ) : (
                      <div className="space-y-4">
                        {adminConfig
                          .filter(config => ['WHATSAPP_CONTACT_PRICE', 'PRICING_ENABLED'].includes(config.key.trim().toUpperCase()))
                          .map((config) => (
                            <div key={config.key} className="flex flex-col sm:flex-row items-center justify-between p-6 border rounded-2xl bg-white shadow-sm border-gray-100 hover:shadow-md transition-all duration-300 gap-4 mb-4">
                              <div className="flex-1">
                                <p className={`font-black text-xl transition-all duration-300 ${config.key.trim().toUpperCase() === 'PRICING_ENABLED' && config.value !== 'true' ? 'text-primary animate-pulse' : 'text-black'}`}>
                                  {config.key.trim().toUpperCase() === 'PRICING_ENABLED'
                                    ? 'MODO TODO GRATUITO'
                                    : (config.key.trim().toUpperCase() === 'WHATSAPP_CONTACT_PRICE' ? 'Precio Mensaje WhatsApp' : config.description || config.key)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {config.key.trim().toUpperCase() === 'PRICING_ENABLED'
                                    ? 'Activa para desactivar todos los pagos en el sistema.'
                                    : 'Costo por cada contacto directo a través del muro o servicios.'}
                                </p>
                              </div>
                              <div className="flex items-center gap-6">
                                {config.key.trim().toUpperCase() === 'PRICING_ENABLED' ? (
                                  <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium ${config.value === 'true' ? 'text-primary' : 'text-slate-500'}`}>
                                      {config.key.trim().toUpperCase() === 'PRICING_ENABLED' ? (config.value === 'true' ? 'MODO PAGO ACTIVADO' : 'MODO TODO GRATUITO ACTIVADO') : 'Activado'}
                                    </span>
                                    <Switch
                                      checked={config.value === 'true' || config.value === '1' || config.value === 1}
                                      onCheckedChange={handleTogglePricing}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-2xl font-black text-primary drop-shadow-sm">
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
                <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
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
            <TabsContent value="logs" className="mt-4 sm:mt-6 outline-none focus-visible:outline-none">
              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
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

        {/* Dialog para Editar/Crear Tipo de Servicio (fuera de Tabs para evitar conflictos de foco con Radix) */}
        <Dialog
          open={typeDialogOpen}
          onOpenChange={(open) => {
            setTypeDialogOpen(open);
            if (!open) setSelectedType(null);
          }}
        >
            <DialogContent className="sm:max-w-[800px] rounded-3xl border-2 p-0 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Lateral Izquierdo: Información */}
                <div className="p-8 space-y-6 bg-muted/10 border-r border-border">
                  <DialogHeader className="mb-2">
                    <DialogTitle className="text-3xl font-black">{selectedType ? 'Editar Categoría' : 'Nueva'}</DialogTitle>
                    <DialogDescription className="text-base">Datos principales y estado</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="type-name" className="text-sm font-bold ml-1">Nombre</Label>
                      <Input
                        id="type-name"
                        value={typeForm.name}
                        onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                        placeholder="Ej: Carpintería..."
                        className="h-12 text-lg rounded-xl border-2 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border-2 border-dashed border-secondary/20">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Estado</Label>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                          {typeForm.is_active ? '✅ Activa' : '❌ Inactiva'}
                        </p>
                      </div>
                      <Switch
                        checked={typeForm.is_active}
                        onCheckedChange={(checked) => setTypeForm({ ...typeForm, is_active: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type-color" className="text-sm font-bold ml-1">Color de la Categoría</Label>
                      <div className="flex flex-wrap gap-2 p-3 bg-white border-2 rounded-xl">
                        {[
                          '#1a73e8', '#ea4335', '#fbbc04', '#34a853',
                          '#8ab4f8', '#f28b82', '#fdd663', '#81c995',
                          '#7b1fa2', '#c2185b', '#0097a7', '#5d4037',
                          '#455a64', '#111827'
                        ].map((c) => (
                          <button
                            key={c}
                            onClick={() => setTypeForm({ ...typeForm, color: c })}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${typeForm.color === c ? 'scale-110 border-foreground ring-2 ring-primary/20' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="color"
                          value={typeForm.color}
                          onChange={(e) => setTypeForm({ ...typeForm, color: e.target.value })}
                          className="w-8 h-8 rounded-full border-2 border-transparent p-0 overflow-hidden cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type-desc" className="text-sm font-bold ml-1 text-muted-foreground">Descripción</Label>
                      <Textarea
                        id="type-desc"
                        value={typeForm.description}
                        onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                        placeholder="Descripción opcional..."
                        className="rounded-xl border-2 min-h-[100px] text-sm focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Lateral Derecho: Icono */}
                <div className="p-8 space-y-6 flex flex-col h-full bg-white">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-black italic text-primary underline underline-offset-4">Selección de Icono</Label>
                    <div className="px-3 py-1 bg-primary/5 rounded-full border border-primary/10 animate-fade-in flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Preview:</span>
                      <IconRenderer name={typeForm.icon || 'Wrench'} size={16} className="text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 flex flex-col justify-center">
                    <div className="flex justify-center">
                      <div
                        className="w-32 h-32 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-white border-4 border-white transition-all duration-500 transform hover:rotate-12"
                        style={{ backgroundColor: typeForm.color || '#1a73e8' }}
                      >
                        <IconRenderer name={typeForm.icon || 'Wrench'} size={64} className="drop-shadow-lg" />
                      </div>
                    </div>

                    <div className="p-1 border-2 rounded-3xl bg-muted/20 flex-1 overflow-hidden flex flex-col">
                      <div className="grid grid-cols-5 gap-2 overflow-y-auto p-4 max-h-[280px] scrollbar-thin">
                        {[
                          { name: 'Wrench', icon: <Wrench size={24} /> },
                          { name: 'Hammer', icon: <Hammer size={24} /> },
                          { name: 'Drill', icon: <Drill size={24} /> },
                          { name: 'Paintbrush', icon: <Paintbrush size={24} /> },
                          { name: 'PaintRoller', icon: <PaintRoller size={24} /> },
                          { name: 'Construction', icon: <Construction size={24} /> },
                          { name: 'HardHat', icon: <HardHat size={24} /> },
                          { name: 'PlugZap', icon: <PlugZap size={24} /> },
                          { name: 'Plug', icon: <Plug size={24} /> },
                          { name: 'Zap', icon: <Zap size={24} /> },
                          { name: 'Flame', icon: <Flame size={24} /> },
                          { name: 'Wind', icon: <Wind size={24} /> },
                          { name: 'Waves', icon: <Waves size={24} /> },
                          { name: 'Truck', icon: <Truck size={24} /> },
                          { name: 'Car', icon: <Car size={24} /> },
                          { name: 'Bike', icon: <Bike size={24} /> },
                          { name: 'Plane', icon: <Plane size={24} /> },
                          { name: 'Ship', icon: <Anchor size={24} /> },
                          { name: 'Home', icon: <HomeIcon size={24} /> },
                          { name: 'Building2', icon: <Building2 size={24} /> },
                          { name: 'Briefcase', icon: <Briefcase size={24} /> },
                          { name: 'ShoppingBag', icon: <ShoppingBag size={24} /> },
                          { name: 'Store', icon: <ShoppingBag size={24} /> },
                          { name: 'Smartphone', icon: <Smartphone size={24} /> },
                          { name: 'Laptop', icon: <Laptop size={24} /> },
                          { name: 'Monitor', icon: <Monitor size={24} /> },
                          { name: 'Cpu', icon: <Cpu size={24} /> },
                          { name: 'Mouse', icon: <Mouse size={24} /> },
                          { name: 'Database', icon: <Database size={24} /> },
                          { name: 'Cloud', icon: <Cloud size={24} /> },
                          { name: 'Code', icon: <Code size={24} /> },
                          { name: 'ChefHat', icon: <ChefHat size={24} /> },
                          { name: 'Utensils', icon: <Utensils size={24} /> },
                          { name: 'Coffee', icon: <Coffee size={24} /> },
                          { name: 'Apple', icon: <Apple size={24} /> },
                          { name: 'Stethoscope', icon: <Stethoscope size={24} /> },
                          { name: 'HeartPulse', icon: <HeartPulse size={24} /> },
                          { name: 'Activity', icon: <Activity size={24} /> },
                          { name: 'Pill', icon: <Pill size={24} /> },
                          { name: 'ShieldCheck', icon: <ShieldCheck size={24} /> },
                          { name: 'Sparkles', icon: <Sparkles size={24} /> },
                          { name: 'Lightbulb', icon: <Lightbulb size={24} /> },
                          { name: 'GraduationCap', icon: <GraduationCap size={24} /> },
                          { name: 'Book', icon: <Book size={24} /> },
                          { name: 'School', icon: <School size={24} /> },
                          { name: 'Globe', icon: <Globe size={24} /> },
                          { name: 'Languages', icon: <Languages size={24} /> },
                          { name: 'Music', icon: <Music size={24} /> },
                          { name: 'Mic', icon: <Mic size={24} /> },
                          { name: 'Camera', icon: <Camera size={24} /> },
                          { name: 'Video', icon: <Video size={24} /> },
                          { name: 'Ticket', icon: <Ticket size={24} /> },
                          { name: 'Gift', icon: <Gift size={24} /> },
                          { name: 'Trophy', icon: <Trophy size={24} /> },
                          { name: 'Scissors', icon: <Scissors size={24} /> },
                          { name: 'Brush', icon: <Brush size={24} /> },
                          { name: 'Dumbbell', icon: <Dumbbell size={24} /> },
                          { name: 'Baby', icon: <Baby size={24} /> },
                          { name: 'PawPrint', icon: <PawPrint size={24} /> },
                          { name: 'Bone', icon: <Bone size={24} /> },
                          { name: 'Trees', icon: <Trees size={24} /> },
                          { name: 'Flower2', icon: <Flower2 size={24} /> },
                          { name: 'Sun', icon: <Sun size={24} /> },
                          { name: 'Moon', icon: <Moon size={24} /> },
                          { name: 'Gem', icon: <Gem size={24} /> },
                          { name: 'Key', icon: <Key size={24} /> },
                          { name: 'Wallet', icon: <Wallet size={24} /> },
                          { name: 'Phone', icon: <Phone size={24} /> },
                          { name: 'Smile', icon: <Smile size={24} /> },
                          { name: 'Gamepad2', icon: <Gamepad2 size={24} /> },
                          { name: 'Gamepad', icon: <Gamepad size={24} /> },
                          { name: 'MapPin', icon: <MapPin size={24} /> },
                          { name: 'Star', icon: <Star size={24} /> },
                          { name: 'List', icon: <List size={24} /> },
                          { name: 'Search', icon: <Search size={24} /> },
                          { name: 'Settings', icon: <Settings size={24} /> },
                          { name: 'Bell', icon: <Bell size={24} /> },
                          { name: 'Navigation', icon: <Navigation size={24} /> },
                          { name: 'FileText', icon: <FileText size={24} /> },
                          { name: 'MessageSquare', icon: <MessageSquare size={24} /> },
                          { name: 'Send', icon: <Send size={24} /> },
                          { name: 'CheckCircle', icon: <CheckCircle size={24} /> },
                          { name: 'AlertTriangle', icon: <AlertTriangle size={24} /> },
                          { name: 'Crown', icon: <Crown size={24} /> },
                          { name: 'Ban', icon: <Ban size={24} /> },
                          { name: 'UserCheck', icon: <UserCheck size={24} /> },
                          { name: 'UserX', icon: <UserX size={24} /> },
                          { name: 'Edit', icon: <Edit size={24} /> },
                          { name: 'XCircle', icon: <XCircle size={24} /> },
                          { name: 'HelpCircle', icon: <HelpCircle size={24} /> },
                          { name: 'Calendar', icon: <Calendar size={24} /> },
                          { name: 'Clock3', icon: <Clock3 size={24} /> },
                          { name: 'ClipboardList', icon: <ClipboardList size={24} /> },
                          { name: 'PenTool', icon: <PenTool size={24} /> },
                          { name: 'Megaphone', icon: <Megaphone size={24} /> },
                          { name: 'Target', icon: <Target size={24} /> },
                          { name: 'Rocket', icon: <Rocket size={24} /> },
                          { name: 'Bot', icon: <Bot size={24} /> },
                          { name: 'BadgeCheck', icon: <BadgeCheck size={24} /> },
                          { name: 'Plus', icon: <Plus size={24} /> },
                        ].map((item) => (
                          <button
                            key={item.name}
                            onClick={() => setTypeForm({ ...typeForm, icon: item.name })}
                            className={`flex items-center justify-center p-4 rounded-2xl transition-all duration-300 transform active:scale-90 ${typeForm.icon === item.name
                              ? 'bg-primary text-primary-foreground scale-110 shadow-xl ring-2 ring-primary ring-offset-4 z-10'
                              : 'bg-white hover:bg-primary/5 text-muted-foreground hover:text-primary border-2 border-transparent hover:border-primary/20'
                              }`}
                            title={item.name}
                          >
                            {item.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" className="rounded-xl h-11" onClick={() => setTypeDialogOpen(false)}>Cancelar</Button>
                    <Button
                      className="rounded-xl h-11 px-8 font-black shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform active:scale-95"
                      onClick={handleSaveServiceType}
                      disabled={!typeForm.name.trim()}
                    >
                      {selectedType ? 'Guardar Cambios' : 'Crear'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>


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

        {/* Dialog para rechazar producto */}
        <Dialog open={rejectProductDialogOpen} onOpenChange={setRejectProductDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rechazar producto</DialogTitle>
              <DialogDescription>
                Rechazando: <strong>{productToReject?.title}</strong> de {productToReject?.user_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Motivo del rechazo (opcional)</Label>
                <Textarea
                  value={rejectProductReason}
                  onChange={(e) => setRejectProductReason(e.target.value)}
                  placeholder="Ej: La publicación no cumple con las políticas..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectProductDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleRejectProduct}>
                <X size={16} className="mr-2" />
                Confirmar rechazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
};

export default Admin;
