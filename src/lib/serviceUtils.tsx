import React from 'react';
import { chileData } from '@/lib/chile-data';
import { communesMatch } from '@/lib/chile-region-helpers';
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
  Calendar,
  Clock3,
  ClipboardList,
  PenTool,
  Megaphone,
  Target,
  Rocket,
  Bot,
  BadgeCheck,
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
  Calendar,
  Clock3,
  ClipboardList,
  PenTool,
  Megaphone,
  Target,
  Rocket,
  Bot,
  BadgeCheck,
};

const ICON_ALIASES: Record<string, string> = {
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

function normalizeIconKey(value: string): string {
  return value.toLowerCase().replace(/[\s_-]/g, '');
}

/**
 * Prioridad: type_icon / idicon del backend (PascalCase exacto).
 * Fallback por nombre solo cuando el backend no envía icono o no está en el mapa.
 */
export const getServiceIcon = (name: string, iconId?: string, idicon?: string) => {
  const finalIconId = idicon || iconId;
  if (finalIconId && typeof finalIconId === 'string') {
    const canonical =
      ICON_ALIASES[normalizeIconKey(finalIconId)] || finalIconId;
    const IconComponent = ICON_MAP[canonical];
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

/**
 * Nombre de región para UI (listado/detalle). Prioriza siempre la respuesta enriquecida del API;
 * el catálogo local (`chileData`) solo como respaldo si el backend no envía nombre.
 */
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

function stripAccentsLower(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Aplana `coverage_communes` por si el backend envía un array, un JSON string o un string separado por comas. */
function normalizeCoverageCommunesList(raw: string[] | string | undefined | null): string[] {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x ?? '').trim()).filter(Boolean);
      }
    } catch {
      /* no es JSON */
    }
    return t
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    if (entry == null) continue;
    let s = String(entry).trim();
    if (!s) continue;
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('["') && s.endsWith('"]'))) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) {
          for (const x of parsed) {
            const t = String(x ?? '').trim();
            if (t) out.push(t);
          }
          continue;
        }
      } catch {
        /* seguir como texto simple */
      }
    }
    out.push(s);
  }
  return out;
}

/**
 * Igual que `communesMatch` y tolera guiones/apóstrofos y subcadenas solo si ambas son largas
 * (evita confusiones tipo "Lo" ↔ "Lo Prado").
 */
function communeNameMatchesCatalog(catalogName: string, poolName: string): boolean {
  if (communesMatch(catalogName, poolName)) return true;
  const a = stripAccentsLower(catalogName).replace(/['.]/g, '').replace(/\s+/g, ' ');
  const b = stripAccentsLower(poolName).replace(/['.]/g, '').replace(/\s+/g, ' ');
  if (a === b) return true;
  const minL = Math.min(a.length, b.length);
  if (minL >= 6 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

/**
 * Fila de `chileData` para la región de oferta: por id numérico de catálogo y, si no calza,
 * por nombre de región (p. ej. API con id distinto a "13" pero `region_name` = RM).
 */
function findChileDataRegionRowForLocation(service: {
  offer_region?: { id?: string; name?: string } | null;
  region_id?: string | number;
  region_name?: string | null;
}) {
  const idCandidates = [service.offer_region?.id, service.region_id].filter(
    (x) => x != null && String(x).trim() !== '',
  );
  for (const id of idCandidates) {
    const row = chileData.find((r) => String(r.id) === String(id).trim());
    if (row) return row;
  }

  const label = (service.offer_region?.name || service.region_name || '').trim();
  if (!label) return undefined;
  const n = stripAccentsLower(label);
  if (n.includes('metropolitana')) {
    const rm = chileData.find((r) => r.id === '13');
    if (rm) return rm;
  }
  for (const r of chileData) {
    const rn = stripAccentsLower(r.name);
    if (rn === n || n.includes(rn) || rn.includes(n)) return r;
  }
  return undefined;
}

/**
 * True si `coverage_communes` cubre todas las comunas del catálogo local (`chileData`) para la
 * región de oferta. Así evitamos mostrar solo la primera comuna del listado (p. ej. Alhué en RM)
 * cuando el prestador marcó “todas las comunas”.
 */
function serviceCoversFullRegionCatalog(service: {
  comuna?: string;
  coverage_communes?: string[] | string;
  offer_region?: { id?: string; name?: string } | null;
  region_id?: string | number;
  region_name?: string | null;
}): boolean {
  const coverage = normalizeCoverageCommunesList(service.coverage_communes);
  if (coverage.length === 0) return false;

  const regionRow = findChileDataRegionRowForLocation(service);
  const catalog = regionRow?.communes;
  if (!catalog?.length) return false;

  const pool = [...coverage, (service.comuna || '').trim()].filter(Boolean);

  const matchedCount = catalog.filter((cat) =>
    pool.some((p) => communeNameMatchesCatalog(cat, p)),
  ).length;
  return matchedCount === catalog.length;
}

/**
 * Ubicación del servicio para mostrar en UI: comuna + región (producto sin multi-cobertura;
 * con coverage_communes vacío en backend prima comuna y region_id).
 * Si la cobertura incluye todas las comunas del catálogo de esa región, muestra “Toda la …”.
 */
export function getServiceLocationDisplay(service: {
  comuna?: string;
  coverage_communes?: string[] | string;
  /** Si el backend lo envía en `true`, se muestra “Toda la {región}” (ver `ServiceCoverageApiFields` en api.ts). */
  coverage_full_region?: boolean;
  offer_region?: { id?: string; name?: string } | null;
  region_name?: string | null;
  region_id?: string | number;
}): string {
  const showTodaLaRegion =
    service.coverage_full_region === true || serviceCoversFullRegionCatalog(service);
  if (showTodaLaRegion) {
    const regionName = getServiceRegionNameOnly(service);
    if (regionName) return `Toda la ${regionName}`;
    const row = findChileDataRegionRowForLocation(service);
    if (row?.name) return `Toda la ${row.name}`;
    return 'Toda la región';
  }

  const comuna = (service.comuna || '').trim();
  const region = getServiceRegionNameOnly(service);
  if (comuna && region) return `${comuna} · ${region}`;
  if (comuna) return comuna;
  if (region) return region;
  return '—';
}

/** offer_region.name, region_name (API), luego comuna si no hay región. */
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
