import { Link, useLocation } from 'react-router-dom';
import { Home, Wrench, ShoppingBag, User, PlusCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/servicios', label: 'Servicios', icon: Wrench },
  { to: '/productos', label: 'Productos', icon: ShoppingBag },
  { to: '/perfil', label: 'Mi Perfil', icon: User },
];

export function MobileBottomNav() {
  const { isLoggedIn, user } = useUser();
  const location = useLocation();
  const isEntrepreneur = user?.roles.includes('entrepreneur') || user?.role_number === 5;

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className={cn('grid h-16', isLoggedIn && isEntrepreneur ? 'grid-cols-5' : 'grid-cols-4')}>
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          if (to === '/perfil' && !isLoggedIn) {
            return (
              <Link
                key={to}
                to="/login"
                className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground"
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">Entrar</span>
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className={cn('text-[10px]', active ? 'font-bold' : 'font-medium')}>{label}</span>
            </Link>
          );
        })}

        {isLoggedIn && isEntrepreneur && (
          <Link
            to="/servicios/publicar"
            className="flex flex-col items-center justify-center gap-0.5 text-primary"
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center -mt-4 shadow-lg shadow-primary/30">
              <PlusCircle size={20} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-primary mt-0.5">Publicar</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
