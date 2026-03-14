import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, Home, Briefcase, Wrench, MessageSquare, Building2, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import logoDameldato from '/logo_nombre.webp';
import faviconDameldato from '/logoico.webp';
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
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-3 xs:px-4 py-3 xs:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center shrink-0">
              {/* Logo Completo - Visible en Desktop */}
              <img
                src={logoDameldato}
                alt="Dameldato"
                className="hidden sm:block h-16 md:h-20 lg:h-24 w-auto object-contain drop-shadow-md transition-all scale-110"
              />
              {/* Icono Solo - Visible en Móvil */}
              <img
                src={faviconDameldato}
                alt="Dameldato"
                className="block sm:hidden h-14 w-14 object-contain drop-shadow-xl scale-125"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/servicios"
                className={`flex items-center gap-2 transition-colors ${isActive('/servicios') ? 'text-primary font-semibold' : 'text-foreground hover:text-primary'
                  }`}
              >
                <Wrench size={18} />
                <span>{t('nav.services')}</span>
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="px-2 font-bold text-xs hover:bg-primary/10"
              >
                {i18n.language === 'es' ? 'EN' : 'ES'}
              </Button>

              {/* Desktop auth/actions */}
              <div className="hidden md:flex items-center gap-3">
                {isLoggedIn ? (
                  <>
                    {(user?.roles.includes('admin') || user?.role_number === 5) && (
                      <Link to="/admin">
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-primary/50 text-primary hover:bg-primary/5 hover:border-primary/30 transition-colors shadow-sm"
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
                            {t('nav.profile')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            logout().catch(console.error);
                          }}
                          className="cursor-pointer"
                        >
                          <LogOut size={16} className="mr-2" />
                          {t('nav.logout')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 text-sm h-auto">
                          {t('hero.offer_services_btn')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl border-primary/20 shadow-2xl bg-card animate-in fade-in zoom-in duration-200">
                        <DropdownMenuItem asChild className="p-0 mb-1">
                          <Link to="/registro" className="flex flex-col items-start gap-1 p-3.5 rounded-xl hover:bg-primary/10 transition-colors focus:bg-primary/10 outline-none">
                            <span className="font-bold text-primary text-base leading-tight">{t('home.want_to_offer_services')}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Crear una nueva cuenta de talento</span>
                          </Link>
                        </DropdownMenuItem>
                        <div className="h-px bg-border/50 my-1 mx-2" />
                        <DropdownMenuItem asChild className="p-0">
                          <Link to="/login" className="flex flex-col items-start gap-1 p-3.5 rounded-xl hover:bg-secondary/10 transition-colors focus:bg-secondary/10 outline-none">
                            <span className="font-bold text-secondary text-base leading-tight">{t('home.already_offer_services')}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Inicia sesión con tu cuenta existente</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>

              {/* Mobile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="outline" size="sm" className="rounded-xl border-primary/20 h-10 w-10 p-0 flex items-center justify-center">
                    <Menu size={20} className="text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card w-64 p-2 rounded-2xl border-primary/20 shadow-2xl">
                  <DropdownMenuItem asChild className="rounded-xl mb-1">
                    <Link to="/" className="flex items-center gap-3 p-3">
                      <Home size={18} className="text-muted-foreground" />
                      <span className="font-medium">{t('nav.home')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl mb-1">
                    <Link to="/servicios" className="flex items-center gap-3 p-3">
                      <Wrench size={18} className="text-muted-foreground" />
                      <span className="font-medium">{t('nav.services')}</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Mobile auth */}
                  {isLoggedIn ? (
                    <>
                      <DropdownMenuItem asChild className="rounded-xl mb-1">
                        <Link to="/perfil" className="flex items-center gap-3 p-3">
                          <User size={18} className="text-muted-foreground" />
                          <span className="font-medium">{t('nav.profile')}</span>
                        </Link>
                      </DropdownMenuItem>
                      {(user?.roles.includes('admin') || user?.role_number === 5) && (
                        <DropdownMenuItem asChild className="rounded-xl mb-1">
                          <Link to="/admin" className="flex items-center gap-3 p-3">
                            <Shield size={18} className="text-primary" />
                            <span className="font-medium text-primary">{t('nav.admin')}</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <div className="h-px bg-border/50 my-2 mx-3" />
                      <DropdownMenuItem
                        onClick={() => {
                          logout().catch(console.error);
                        }}
                        className="rounded-xl text-destructive hover:bg-destructive/10 focus:bg-destructive/10 p-3 flex items-center gap-3"
                      >
                        <LogOut size={18} />
                        <span className="font-medium">{t('nav.logout')}</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <div className="h-px bg-border/50 my-2 mx-3" />
                      <div className="p-3">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-3 ml-1">Para Emprendedores</p>
                        <div className="space-y-2">
                          <Link to="/registro">
                            <Button className="w-full justify-start h-auto py-3.5 px-4 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 mb-2 whitespace-normal text-left leading-tight">
                              {t('home.want_to_offer_services')}
                            </Button>
                          </Link>
                          <Link to="/login">
                            <Button variant="outline" className="w-full justify-start h-auto py-3.5 px-4 rounded-xl border-secondary/30 text-secondary hover:bg-secondary/5 whitespace-normal text-left leading-tight">
                              {t('home.already_offer_services')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
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

      {/* AI Chat Bubble */}

    </div>
  );
};

export default Layout;
