import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, HelpCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import logoDameldato from '/logoicono.png';

const Footer = () => {
  const { user, isLoggedIn } = useUser();

  const isCompany = user?.roles.includes('company');
  const isEntrepreneur = user?.roles.includes('entrepreneur');
  const isAdmin = user?.roles.includes('admin') || user?.role_number === 5;

  return (
    <footer className="bg-[#0a0b14] border-t border-primary/10 mt-auto pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <img src={logoDameldato} alt="Dameldato" className="h-10 w-10 object-contain" />
              </div>
              <span className="text-2xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Dameldato
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              La plataforma líder en Chile para conectar talentos, oportunidades laborales y emprendimientos locales. Impulsando el crecimiento de nuestra comunidad.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/dameldato.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.linkedin.com/feed/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="mailto:contacto@dameldato.com"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-white font-bold text-lg">Explorar</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/empleos" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  Buscar Empleos
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  Buscar Servicios
                </Link>
              </li>
              <li>
                <Link to="/muro" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  Muro de Avisos
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-white font-bold text-lg">Tu Cuenta</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/perfil" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  Mi Perfil
                </Link>
              </li>
              {(isEntrepreneur || isAdmin) && (
                <li>
                  <Link to="/servicios/publicar" className="text-primary font-medium hover:underline transition-all text-sm flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    Publicar mi Servicio
                  </Link>
                </li>
              )}
              {isAdmin && (
                <li>
                  <Link to="/admin" className="text-amber-500 hover:text-amber-400 transition-colors text-sm flex items-center gap-2 font-medium">
                    <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                    Panel Admin
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-white font-bold text-lg">Soporte</h3>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
              <Link to="/ayuda" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <HelpCircle size={18} />
                </div>
                <span>Centro de Ayuda</span>
              </Link>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                  <MapPin size={18} />
                </div>
                <span>Santiago, Chile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Dameldato. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link to="/terminos" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Términos y Condiciones
            </Link>
            <Link to="/privacidad" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

