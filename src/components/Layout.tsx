import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, Home, Briefcase, Wrench, MessageSquare, Building2, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/contexts/UserContext';
import Footer from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import AIChatBubble from '@/components/AIChatBubble';
import ErrorBoundary from '@/components/ErrorBoundary';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isLoggedIn, logout } = useUser();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/src/assets/beta-logo.png" alt="Beta" className="h-10 w-10" />
              <span className="text-2xl font-heading font-bold text-primary">Beta</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/empleos" 
                className={`flex items-center gap-2 transition-colors ${
                  isActive('/empleos') ? 'text-primary font-semibold' : 'text-foreground hover:text-primary'
                }`}
              >
                <Briefcase size={18} />
                <span>Empleos</span>
              </Link>
              <Link 
                to="/servicios" 
                className={`flex items-center gap-2 transition-colors ${
                  isActive('/servicios') ? 'text-primary font-semibold' : 'text-foreground hover:text-primary'
                }`}
              >
                <Wrench size={18} />
                <span>Servicios</span>
              </Link>
              <Link 
                to="/muro" 
                className={`flex items-center gap-2 transition-colors ${
                  isActive('/muro') ? 'text-primary font-semibold' : 'text-foreground hover:text-primary'
                }`}
              >
                <MessageSquare size={18} />
                <span>Muro</span>
              </Link>
              {(user?.roles.includes('company') || user?.roles.includes('admin') || user?.roles.includes('super-admin')) && (
                <Link 
                  to="/postulaciones" 
                  className={`flex items-center gap-2 transition-colors ${
                    isActive('/postulaciones') ? 'text-primary font-semibold' : 'text-foreground hover:text-primary'
                  }`}
                >
                  <FileText size={18} />
                  <span>Postulaciones</span>
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isLoggedIn ? (
                <>
                  {(user?.roles.includes('admin') || user?.roles.includes('super-admin')) && (
                    <Link to="/admin">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary hover:text-primary-foreground dark:border-primary/50 dark:text-primary dark:hover:bg-primary/20 dark:hover:border-primary dark:hover:text-primary-foreground transition-colors"
                      >
                        <Shield size={18} className="text-primary dark:text-primary" />
                      </Button>
                    </Link>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="outline-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                        <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity border-2 border-border">
                          {user?.profile_image && (
                            <AvatarImage src={user.profile_image} alt={user.name} />
                          )}
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card">
                      <DropdownMenuItem asChild>
                        <Link to="/perfil" className="cursor-pointer">
                          <User size={16} className="mr-2" />
                          Mi Perfil
                        </Link>
                      </DropdownMenuItem>
                      {(user?.roles.includes('company') || user?.roles.includes('admin') || user?.roles.includes('super-admin')) && (
                        <DropdownMenuItem asChild>
                          <Link to="/postulaciones" className="cursor-pointer">
                            <FileText size={16} className="mr-2" />
                            Postulaciones
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => {
                          logout().catch(console.error);
                        }} 
                        className="cursor-pointer"
                      >
                        <LogOut size={16} className="mr-2" />
                        Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline">Iniciar Sesión</Button>
                  </Link>
                  <Link to="/registro">
                    <Button>Registrarse</Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="outline" size="sm">
                    <Menu size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer">
                      <Home size={16} className="mr-2" />
                      Inicio
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/empleos" className="cursor-pointer">
                      <Briefcase size={16} className="mr-2" />
                      Empleos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/servicios" className="cursor-pointer">
                      <Wrench size={16} className="mr-2" />
                      Servicios
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/muro" className="cursor-pointer">
                      <MessageSquare size={16} className="mr-2" />
                      Muro
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div key={location.pathname} className="animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Chat flotante de IA */}
      <ErrorBoundary fallback={null}>
        <AIChatBubble />
      </ErrorBoundary>
    </div>
  );
};

export default Layout;
