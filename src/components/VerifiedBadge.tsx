import { BadgeCheck, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type VerifiedBadgeSize = 'sm' | 'md' | 'lg';
type VerifiedBadgeVariant = 'icon' | 'icon-text';

interface VerifiedBadgeProps {
  size?: VerifiedBadgeSize;
  variant?: VerifiedBadgeVariant;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 'w-3 h-3', text: 'text-[10px]', padding: 'px-1.5 py-0.5', gap: 'gap-1' },
  md: { icon: 'w-3.5 h-3.5', text: 'text-xs', padding: 'px-2 py-0.5', gap: 'gap-1' },
  lg: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2.5 py-1', gap: 'gap-1.5' },
};

export function VerifiedBadge({ size = 'sm', variant = 'icon-text', className }: VerifiedBadgeProps) {
  const s = sizeConfig[size];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label="Identidad verificada"
            className={`inline-flex items-center ${s.gap} bg-primary/10 text-primary border border-primary/20 ${s.padding} rounded-full font-bold tracking-wide cursor-default select-none shrink-0 ${className ?? ''}`}
          >
            <BadgeCheck className={`${s.icon} shrink-0`} />
            {variant === 'icon-text' && <span className={s.text}>Verificado</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px] text-center">
          Identidad verificada con cédula chilena (TOC Biometrics)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Indicador neutro para prestadores con verificación en curso. No muestra nada si el estado es 'not_started'. */
export function PendingVerificationBadge({ size = 'sm' }: { size?: VerifiedBadgeSize }) {
  const s = sizeConfig[size];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label="Verificación en curso"
            className={`inline-flex items-center ${s.gap} bg-muted text-muted-foreground border border-border ${s.padding} rounded-full font-medium cursor-default select-none shrink-0`}
          >
            <Clock className={`${s.icon} shrink-0`} />
            {size !== 'sm' && <span className={s.text}>En revisión</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px] text-center">
          Este prestador tiene su verificación en proceso
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
