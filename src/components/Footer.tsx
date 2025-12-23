import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, HelpCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import logoBeta from '@/assets/logo beta.png';

const Footer = () => {
  const { user, isLoggedIn } = useUser();
  
  const isCompany = user?.roles.includes('company');
  const isEntrepreneur = user?.roles.includes('entrepreneur');
  const isAdmin = user?.roles.includes('admin') || user?.roles.includes('super-admin');
  
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {/* Logo y frase */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoBeta} alt="Beta" className="h-10 w-10 rounded-lg object-contain" />
              <span className="text-2xl font-heading font-bold text-primary">Beta</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Conectamos talento y oportunidades en Chile. Tu próximo paso profesional comienza aquí.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/beta_coropcl/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.linkedin.com/feed/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/empleos" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Buscar Empleos
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Buscar Servicios/Pymes
                </Link>
              </li>
              <li>
                <Link to="/muro" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Muro de Publicaciones
                </Link>
              </li>
              <li>
                <Link to="/perfil" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Mi Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Para empresas - Solo visible para empresas, admin y super-admin */}
          {(isCompany || isAdmin) && (
            <div>
              <h3 className="font-semibold mb-4">Para Empresas</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/empleos/publicar" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    Publicar Empleo
                  </Link>
                </li>
                <li>
                  <Link to="/postulaciones" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    Ver Postulaciones
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Para emprendedores - Solo visible para emprendedores, admin y super-admin */}
          {(isEntrepreneur || isAdmin) && (
            <div>
              <h3 className="font-semibold mb-4">Para Emprendedores</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/servicios/publicar" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    Publicar Servicio/Pymes
                  </Link>
                </li>
                <li>
                  <Link to="/servicios" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    Ver Servicios/Pymes
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Para usuarios - Visible para todos los usuarios no empresarios/emprendedores */}
          {!isCompany && !isEntrepreneur && !isAdmin && (
            <div>
              <h3 className="font-semibold mb-4">Para Usuarios</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/empleos" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    Buscar Empleos
                  </Link>
                </li>
                <li>
                  <Link to="/servicios" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    Buscar Servicios/Pymes
                  </Link>
                </li>
                <li>
                  <Link to="/perfil" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    Mi Perfil
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Contacto y ayuda */}
          <div>
            <h3 className="font-semibold mb-4">Contacto y Ayuda</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/ayuda"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  <HelpCircle size={16} />
                  <span>Centro de Ayuda</span>
                </Link>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail size={16} />
                <span>betacontac@gmail.com</span>
              </li>
      
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin size={16} />
                <span>Santiago, Chile</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Beta - Conectamos talento y oportunidades en Chile. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

