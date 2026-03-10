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
  Trees,
  Activity,
  Apple,
  Bone,
  Gem,
  Key,
  Anchor
} from 'lucide-react';

export const getServiceIcon = (name: string, iconId?: string) => {
  // 1. Si existe iconId de la base de datos, lo usamos prioritariamente
  if (iconId) {
    const n = iconId;
    if (n === 'Wrench') return <Wrench />;
    if (n === 'Lightbulb') return <Lightbulb />;
    if (n === 'ShieldCheck') return <ShieldCheck />;
    if (n === 'Sparkles') return <Sparkles />;
    if (n === 'Building2') return <Building2 />;
    if (n === 'Truck') return <Truck />;
    if (n === 'HeartPulse') return <HeartPulse />;
    if (n === 'Briefcase') return <Briefcase />;
    if (n === 'Paintbrush') return <Paintbrush />;
    if (n === 'Hammer') return <Hammer />;
    if (n === 'Scissors') return <Scissors />;
    if (n === 'Camera') return <Camera />;
    if (n === 'Laptop') return <Laptop />;
    if (n === 'ChefHat') return <ChefHat />;
    if (n === 'Music') return <Music />;
    if (n === 'Car') return <Car />;
    if (n === 'Home') return <HomeIcon />;
    if (n === 'Phone') return <Phone />;
    if (n === 'Trees') return <Trees />;
    if (n === 'Activity') return <Activity />;
    if (n === 'Apple') return <Apple />;
    if (n === 'Bone') return <Bone />;
    if (n === 'Gem') return <Gem />;
    if (n === 'Key') return <Key />;
    if (n === 'Anchor') return <Anchor />;
  }

  // 2. Fallback: Mapeo basado en nombre (como estaba antes)
  const n = name.toLowerCase();
  
  // Categoría Belleza / Peluquería (Prioridad alta para el fix anterior)
  if (n.includes('peluquer') || n.includes('estetica') || n.includes('belleza') || n.includes('manicure') || n.includes('barber')) return <Scissors />;
  
  if (n.includes('gasfiter') || n.includes('plomero') || n.includes('fontaner')) return <Wrench />;
  if (n.includes('electri')) return <Lightbulb />;
  if (n.includes('cerrajer')) return <ShieldCheck />;
  if (n.includes('limpieza') || n.includes('aseo')) return <Sparkles />;
  if (n.includes('construc') || n.includes('albañil')) return <Building2 />;
  if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return <Truck />;
  if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return <HeartPulse />;
  if (n.includes('mecanic')) return <Briefcase />;
  if (n.includes('pintor') || n.includes('pintura')) return <Paintbrush />;
  if (n.includes('carpin') || n.includes('mueble')) return <Hammer />;
  if (n.includes('foto') || n.includes('video')) return <Camera />;
  if (n.includes('compu') || n.includes('tech') || n.includes('soporte')) return <Laptop />;
  if (n.includes('gastro') || n.includes('comida') || n.includes('chef') || n.includes('banquete')) return <ChefHat />;
  if (n.includes('evento') || n.includes('musica') || n.includes('show')) return <Music />;
  if (n.includes('lavado') || n.includes('auto')) return <Car />;
  if (n.includes('jardin')) return <Trees />;
  if (n.includes('hogar') || n.includes('casa')) return <HomeIcon />;
  if (n.includes('telef') || n.includes('contacto')) return <Phone />;
  if (n.includes('masaje') || n.includes('relax') || n.includes('terapia')) return <Sparkles />;
  
  return <Wrench />; // Default icon
};

export const getServiceColor = (name: string) => {
  const n = name.toLowerCase();
  
  // Belleza / Peluquería
  if (n.includes('peluquer') || n.includes('estetica') || n.includes('belleza') || n.includes('manicure') || n.includes('barber')) return '#ec4899'; // pink-500
  
  if (n.includes('gasfiter') || n.includes('plomero') || n.includes('fontaner')) return '#3b82f6'; // blue-500
  if (n.includes('electri')) return '#f59e0b'; // amber-500
  if (n.includes('cerrajer')) return '#334155'; // slate-700
  if (n.includes('limpieza') || n.includes('aseo')) return '#10b981'; // emerald-500
  if (n.includes('construc') || n.includes('albañil')) return '#ea580c'; // orange-600
  if (n.includes('flete') || n.includes('mudan') || n.includes('transp')) return '#a855f7'; // purple-500
  if (n.includes('cuidad') || n.includes('salud') || n.includes('enfer')) return '#f43f5e'; // rose-500
  if (n.includes('mecanic')) return '#indigo-600'; // indigo-600 (Fix: indium color code was Indigo-600)
  if (n.includes('jardin')) return '#22c55e'; // green-500
  if (n.includes('gastro') || n.includes('comida') || n.includes('chef')) return '#ef4444'; // red-500
  
  return 'var(--primary)'; // Default color
};

export const isLightColor = (color?: string) => {
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
