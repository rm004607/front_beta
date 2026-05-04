import { useState } from 'react';
import { Copy, Check, X, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

const iconClass = 'h-[18px] w-[18px] shrink-0';

export function ShareModal({ open, onClose, url, title = 'Compartir' }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const whatsappHref = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        hideCloseButton
        aria-describedby={undefined}
        className="w-[min(100%,22rem)] sm:w-full max-w-md rounded-2xl border border-border/60 p-0 gap-0 shadow-xl overflow-hidden"
      >
        <div className="px-5 pt-5 pb-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="text-left text-[15px] sm:text-base font-semibold leading-snug text-foreground pr-1">
              {title}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Enlace
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch rounded-xl border border-border bg-muted/40 p-1.5 sm:p-1">
              <span className="text-[11px] sm:text-xs text-foreground/90 break-all leading-relaxed font-mono px-2 py-1.5 sm:flex-1 sm:min-w-0 sm:max-h-20 sm:overflow-y-auto">
                {url}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'shrink-0 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors sm:self-stretch',
                  copied
                    ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
                aria-label="Copiar enlace"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2.5">
              Compartir por
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex w-full items-center justify-center gap-2 min-h-[2.75rem] px-3 rounded-xl text-sm font-semibold transition-all',
                'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm',
                'hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              <MessageCircle className={iconClass} strokeWidth={2.25} />
              WhatsApp
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
