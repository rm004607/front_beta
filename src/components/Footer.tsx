import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, HelpCircle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import logoDameldato from '/logo nombre.png';

const Footer = () => {
  const { user, isLoggedIn } = useUser();
  const { t } = useTranslation();

  const isCompany = user?.roles.includes('company');
  const isEntrepreneur = user?.roles.includes('entrepreneur');
  const isAdmin = user?.roles.includes('admin') || user?.role_number === 5;

  return (
    <footer className="bg-card border-t border-border mt-auto pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="flex items-center group">
              <div className="p-0 transition-opacity group-hover:opacity-90">
                <img src={logoDameldato} alt="Dameldato" className="h-14 sm:h-16 w-auto object-contain" />
              </div>
            </Link>
            <p className="text-muted-foreground font-medium leading-relaxed max-w-sm">
              {t('footer.desc')}
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/dameldato.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.linkedin.com/feed/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="mailto:contacto@dameldato.com"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-foreground font-bold text-lg">{t('footer.explore')}</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/servicios" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  {t('services.title')}
                </Link>
              </li>
              <li>
                <Link to="/muro" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  {t('wall.title')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-foreground font-bold text-lg">{t('footer.account')}</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/perfil" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" />
                  {t('nav.profile')}
                </Link>
              </li>
              {(isEntrepreneur || isAdmin) && (
                <li>
                  <Link to="/servicios/publicar" className="text-primary font-medium hover:underline transition-all text-sm flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    {t('services.publish_btn')}
                  </Link>
                </li>
              )}
              {isAdmin && (
                <li>
                  <Link to="/admin" className="text-amber-500 hover:text-amber-400 transition-colors text-sm flex items-center gap-2 font-medium">
                    <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                    {t('nav.admin')}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-foreground font-bold text-lg">{t('footer.support')}</h3>
            <div className="bg-muted/50 p-4 rounded-2xl border border-border space-y-4">
              <Link to="/ayuda" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <HelpCircle size={18} />
                </div>
                <span>{t('footer.help_center')}</span>
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
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground font-medium text-xs">
            © {new Date().getFullYear()} Dameldato. {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            <Link to="/terminos" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/privacidad" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

