import React from 'react';
import { chileData } from '@/lib/chile-data';
import {
  Wrench,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Building2,
  Truck,
  HeartPulse,
  Briefcase,
  Paintbrush,
  Hammer,
  Scissors,
  Camera,
  Laptop,
  ChefHat,
  Music,
  Car,
  Home as HomeIcon,
  Phone,
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
  Activity,
  Apple,
  Bone,
  Gem,
  Key,
  Anchor,
  ShoppingBag,
  Brush,
  HelpCircle,
  MapPin,
  List,
  Search,
  Settings,
  Bell,
  Navigation,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Crown,
  Ban,
  UserCheck,
  UserX,
  Edit,
  XCircle,
  MessageSquare,
  Star,
  Gamepad2,
} from 'lucide-react';

type LucideIcon = React.ComponentType<{ className?: string; size?: number }>;

/** Mapa PascalCase exacto: el backend envía estos nombres. Sin normalizar a minúsculas. */
const ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Building2,
  Truck,
  HeartPulse,
  Briefcase,
  Paintbrush,
  Hammer,
  Scissors,
  Camera,
  Laptop,
  ChefHat,
  Music,
  Car,
  Home: HomeIcon,
  Phone,
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
  Activity,
  Apple,
  Bone,
  Gem,
  Key,
  Anchor,
  ShoppingBag,
  Brush,
  Store: ShoppingBag,
  HelpCircle,
  MapPin,
  List,
  Search,
  Settings,
  Bell,
  Navigation,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Crown,
  Ban,
  UserCheck,
  UserX,
  Edit,
  XCircle,
  MessageSquare,
  Star,
  Ship: Anchor,
  Gamepad: Gamepad2,
};

/**
 * Prioridad: type_icon / idicon del backend (PascalCase exacto).
 * Fallback por nombre solo cuando el backend no envía icono o no está en el mapa.
 */
export const getServiceIcon = (name: string, iconId?: string, idicon?: string) => {
  const finalIconId = idicon || iconId;
  if (finalIconId && typeof finalIconId === 'string') {
    const IconComponent = ICON_MAP[finalIconId];
    if (IconComponent) {
      return React.createElement(IconComponent);
    }
  }

  const n = name.toLowerCase();
  if (n.includes('peluquer') || n.includes('estetica') || n.includes('belleza') || n.includes('manicure') || n.includes('barber')) return React.createElement(Scissors);
  if (n.includes('gasfiter') || n.includes('plomero') || n.includes('fontaner')) return React.createElement(Wrench);
  if (n.includes('electri')) return React.createElement(Lightbulb);
  if (n.includes('cerrajer')) return React.createElement(ShieldCheck);
  if (n.includes('limpieza') || n.includes('aseo')) return React.createElement(Sparkles);
  if (n.includes('construc') || n.includes('albañil')) return React.createElement(Building2);
  if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return React.createElement(Truck);
  if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return React.createElement(HeartPulse);
  if (n.includes('mecanic')) return React.createElement(Briefcase);
  if (n.includes('pintor') || n.includes('pintura')) return React.createElement(Paintbrush);
  if (n.includes('carpin') || n.includes('mueble')) return React.createElement(Hammer);
  if (n.includes('foto') || n.includes('video')) return React.createElement(Camera);
  if (n.includes('compu') || n.includes('tech') || n.includes('soporte')) return React.createElement(Laptop);
  if (n.includes('gastro') || n.includes('comida') || n.includes('chef') || n.includes('banquete')) return React.createElement(ChefHat);
  if (n.includes('evento') || n.includes('musica') || n.includes('show')) return React.createElement(Music);
  if (n.includes('lavado') || n.includes('auto')) return React.createElement(Car);
  if (n.includes('jardin')) return React.createElement(Trees);
  if (n.includes('hogar') || n.includes('casa')) return React.createElement(HomeIcon);
  if (n.includes('telef') || n.includes('contacto')) return React.createElement(Phone);
  if (n.includes('masaje') || n.includes('relax') || n.includes('terapia')) return React.createElement(Sparkles);

  return React.createElement(Wrench);
};

export const getServiceColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('peluquer') || n.includes('estetica') || n.includes('belleza') || n.includes('manicure') || n.includes('barber')) return '#ec4899';
  if (n.includes('gasfiter') || n.includes('plomero') || n.includes('fontaner')) return '#3b82f6';
  if (n.includes('electri')) return '#f59e0b';
  if (n.includes('cerrajer')) return '#334155';
  if (n.includes('limpieza') || n.includes('aseo')) return '#10b981';
  if (n.includes('construc') || n.includes('albañil')) return '#ea580c';
  if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return '#a855f7';
  if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return '#f43f5e';
  if (n.includes('mecanic')) return '#4f46e5';
  if (n.includes('jardin')) return '#22c55e';
  if (n.includes('gastro') || n.includes('comida') || n.includes('chef')) return '#ef4444';
  return 'var(--primary)';
};

export const isLightColor = (color?: string) => {
  if (!color) return false;
  if (color.startsWith('var')) return false;
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

/** Nombre de región de oferta; no usa comuna como sustituto (útil para "Comuna · Región"). */
export function getServiceRegionNameOnly(service: {
  offer_region?: { id?: string; name?: string } | null;
  region_name?: string | null;
  region_id?: string | number;
}): string {
  const fromOffer = service.offer_region?.name?.trim();
  if (fromOffer) return fromOffer;
  const named = service.region_name?.trim();
  if (named) return named;
  if (service.region_id != null && String(service.region_id) !== '') {
    const r = chileData.find((x) => String(x.id) === String(service.region_id));
    if (r?.name) return r.name;
  }
  return '';
}

/**
 * Ubicación del servicio para mostrar en UI: comuna + región (producto sin multi-cobertura;
 * con coverage_communes vacío en backend prima comuna y region_id).
 */
export function getServiceLocationDisplay(service: {
  comuna?: string;
  offer_region?: { id?: string; name?: string } | null;
  region_name?: string | null;
  region_id?: string | number;
}): string {
  const comuna = (service.comuna || '').trim();
  const region = getServiceRegionNameOnly(service);
  if (comuna && region) return `${comuna} · ${region}`;
  if (comuna) return comuna;
  if (region) return region;
  return '—';
}

/** Preferir datos del backend enriquecido (offer_region / region_name), luego region_id, luego comuna. */
export function getServiceRegionDisplayName(service: {
  offer_region?: { id?: string; name?: string } | null;
  region_name?: string | null;
  region_id?: string | number;
  comuna?: string;
}): string {
  const regionOnly = getServiceRegionNameOnly(service);
  if (regionOnly) return regionOnly;
  return (service.comuna || '').trim();
}

export type OfferRegionRef = { id?: string; name?: string };

/** Región de oferta del perfil (GET /auth/me), no el domicilio (region_id del usuario). */
export function getUserOfferRegionDisplayName(user: {
  offer_region?: OfferRegionRef | null;
}): string {
  return user.offer_region?.name?.trim() || '';
}
