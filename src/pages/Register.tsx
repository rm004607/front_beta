import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole, useUser } from '@/contexts/UserContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import {
  isValidName,
  isValidPhone,
  isValidComuna,
  containsSQLInjection,
  sanitizeInput,
  getValidationErrorMessage
} from '@/lib/input-validator';
import { chileData } from '@/lib/chile-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, loadUser } = useUser();
  const [step, setStep] = useState(() => {
    const stepParam = searchParams.get('step');
    return stepParam ? parseInt(stepParam) : 1;
  });
  const [isKycVerified, setIsKycVerified] = useState(true);


  // Step 1: Basic data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [comuna, setComuna] = useState('');

  // Step 2: Roles (solo un rol según backend)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');

  // Persistir datos si viene de QR
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('reg_email', emailParam);
    }

    const savedName = localStorage.getItem('reg_name');
    if (savedName && !name) setName(savedName);
    const savedEmail = localStorage.getItem('reg_email');
    if (savedEmail && !email) setEmail(savedEmail);
    const savedPhone = localStorage.getItem('reg_phone');
    if (savedPhone && !phone) setPhone(savedPhone);
    const savedComuna = localStorage.getItem('reg_comuna');
    if (savedComuna && !comuna) setComuna(savedComuna);
  }, [searchParams, name, email, phone, comuna]);

  // Step 3: Role-specific data
  const [rubro, setRubro] = useState('');
  const [experience, setExperience] = useState('');
  const [service, setService] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [companyRut, setCompanyRut] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyRubro, setCompanyRubro] = useState('');
  const [hrContact, setHrContact] = useState('');

  const selectRole = (role: UserRole) => {
    setSelectedRole(role);
  };


  // Mapa de roles a números para el backend
  const roleToNumber = (role: UserRole): number => {
    const map: Record<UserRole, number> = {
      'job-seeker': 1,
      'entrepreneur': 2,
      'company': 3,
      'admin': 4,
      'super-admin': 5,
    };
    return map[role];
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !password || !phone) {
        toast.error('Por favor completa todos los campos (Nombre, Email, Contraseña y Teléfono)');
        return;
      }

      // Validaciones de seguridad
      if (!isValidName(name)) {
        toast.error(getValidationErrorMessage('name', containsSQLInjection(name) ? 'sql' : 'format'));
        return;
      }

      if (!isValidPhone(phone)) {
        toast.error(getValidationErrorMessage('phone', containsSQLInjection(phone) ? 'sql' : 'format'));
        return;
      }

      if (!isValidComuna(comuna)) {
        toast.error(getValidationErrorMessage('comuna', containsSQLInjection(comuna) ? 'sql' : 'format'));
        return;
      }

      if (!selectedRegion) {
        toast.error('Por favor selecciona una región');
        return;
      }

      if (!acceptTerms) {
        toast.error('Debes aceptar los Términos y Condiciones');
        return;
      }

      // Guardar datos temporalmente si necesita pasar a móvil
      localStorage.setItem('reg_name', name);
      localStorage.setItem('reg_email', email);
      localStorage.setItem('reg_phone', phone);
      localStorage.setItem('reg_comuna', comuna);
    }
    // Si viene del paso 1, saltamos el 2 (KYC) y vamos al 4 (datos específicos)
    setStep(4);
  };

  // Validar formato de email real
  const isValidEmail = (email: string): boolean => {
    // Expresión regular mejorada para validar emails reales
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
      return false;
    }

    // Validaciones adicionales
    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const [localPart, domain] = parts;

    // Validar parte local (antes del @)
    if (localPart.length === 0 || localPart.length > 64) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (localPart.includes('..')) return false;

    // Validar dominio
    if (domain.length === 0 || domain.length > 255) return false;
    if (!domain.includes('.')) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    if (domain.includes('..')) return false;

    // Validar que el dominio tenga al menos un punto y una extensión válida
    const domainParts = domain.split('.');
    if (domainParts.length < 2) return false;
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || tld.length > 63) return false;

    // Rechazar dominios temporales comunes
    const tempDomains = ['tempmail', '10minutemail', 'guerrillamail', 'mailinator', 'throwaway'];
    const domainLower = domain.toLowerCase();
    if (tempDomains.some(temp => domainLower.includes(temp))) {
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Selecciona un rol');
      return;
    }

    // Validar email real
    if (!isValidEmail(email)) {
      toast.error('Por favor ingresa un email válido y real');
      return;
    }

    // Validaciones de seguridad finales
    if (!isValidName(name)) {
      toast.error(getValidationErrorMessage('name', containsSQLInjection(name) ? 'sql' : 'format'));
      return;
    }

    if (!isValidPhone(phone)) {
      toast.error(getValidationErrorMessage('phone', containsSQLInjection(phone) ? 'sql' : 'format'));
      return;
    }

    if (!isValidComuna(comuna)) {
      toast.error(getValidationErrorMessage('comuna', containsSQLInjection(comuna) ? 'sql' : 'format'));
      return;
    }

    setIsSubmitting(true);
    try {
      const priceRangeString = minPrice && maxPrice ? `${minPrice} - ${maxPrice}` : minPrice || maxPrice || '';

      // Sanitizar inputs antes de enviar (capa adicional de seguridad)
      const sanitizedData = {
        name: sanitizeInput(name, 100),
        email: email.trim().toLowerCase(),
        password,
        phone: sanitizeInput(phone, 20),
        comuna: sanitizeInput(comuna, 50),
        rol: roleToNumber(selectedRole),
        // @ts-ignore - Agregando datos opcionales
        rubro: sanitizeInput(rubro || '', 100),
        experience: sanitizeInput(experience || '', 2000),
        service: sanitizeInput(service || '', 100),
        portfolio: sanitizeInput(portfolio || '', 2000),
        priceRange: sanitizeInput(priceRangeString, 100),
      };

      // Registrar usuario directamente (sin verificación de código)
      await authAPI.register(sanitizedData);

      // Hacer login automático después del registro
      await authAPI.login({ email: sanitizedData.email, password });

      // Cargar usuario
      await loadUser();

      toast.success('¡Registro exitoso! Bienvenido a Dameldato');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-12 px-4 mt-6">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
              Únete a la Comunidad
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">Paso {step === 4 ? 2 : 1} de 2</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className={name && !isValidName(name) ? 'border-red-500' : ''}
                  />
                  {name && !isValidName(name) && (
                    <p className="text-sm text-red-500 mt-1">
                      {getValidationErrorMessage('name', containsSQLInjection(name) ? 'sql' : 'format')}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className={email && !isValidEmail(email) ? 'border-red-500' : ''}
                  />
                  {email && !isValidEmail(email) && (
                    <p className="text-sm text-red-500 mt-1">
                      Por favor ingresa un email válido y real
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono de Contacto <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className={phone && !isValidPhone(phone) ? 'border-red-500' : ''}
                  />
                  {phone && !isValidPhone(phone) && (
                    <p className="text-sm text-red-500 mt-1">
                      {getValidationErrorMessage('phone', containsSQLInjection(phone) ? 'sql' : 'format')}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region">Región</Label>
                    <Select value={selectedRegion} onValueChange={(val) => {
                      setSelectedRegion(val);
                      setComuna(''); // Reset commune when region changes
                    }}>
                      <SelectTrigger id="region">
                        <SelectValue placeholder="Selecciona Región" />
                      </SelectTrigger>
                      <SelectContent>
                        {chileData.map((reg) => (
                          <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="comuna">Comuna</Label>
                    <Select value={comuna} onValueChange={setComuna} disabled={!selectedRegion}>
                      <SelectTrigger id="comuna">
                        <SelectValue placeholder="Selecciona Comuna" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedRegion && chileData.find(r => r.id === selectedRegion)?.communes.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="accept-terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="accept-terms" className="text-sm font-medium leading-tight cursor-pointer">
                        Acepto los Términos y Condiciones
                      </Label>
                      <button
                        type="button"
                        className="text-xs text-primary underline"
                        onClick={() => setShowTerms(!showTerms)}
                      >
                        {showTerms ? 'Ocultar' : 'Ver'} Términos
                      </button>
                      {showTerms && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border p-3 text-xs leading-relaxed">
                          <p><strong>Bienvenido/a a Dameldato</strong>, una plataforma que conecta a personas que buscan oportunidades laborales, empresas que contratan y emprendedores que ofrecen servicios.</p>
                          <p className="mt-2">Al registrarse y utilizar Dameldato, usted acepta estos Términos y Condiciones. Si no está de acuerdo, no debe usar la plataforma.</p>
                          <p className="mt-2"><strong>1. Aceptación de los Términos</strong><br />Al crear una cuenta en Dameldato, el usuario declara haber leído, entendido y aceptado íntegramente estos Términos y Condiciones, así como la Política de Privacidad asociada.</p>
                          <p className="mt-2"><strong>2. Naturaleza del Servicio</strong><br />Dameldato es una plataforma que facilita la conexión entre usuarios, empresas y proveedores de servicios. Dameldato no garantiza empleos, ni se responsabiliza por acuerdos, pagos, compromisos o relaciones laborales generadas entre los usuarios fuera de la plataforma. El usuario entiende que Dameldato no participa en negociaciones laborales, no valida la veracidad total de las ofertas publicadas por terceros y no se hace responsable de conflictos, pérdidas o daños derivados de interacciones entre usuarios.</p>
                          <p className="mt-2"><strong>3. Registro y Responsabilidad del Usuario</strong><br />El usuario debe proporcionar datos verdaderos, completos y actualizados; no crear cuentas falsas o duplicadas; no suplantar identidad; no publicar contenido ofensivo, ilegal o que viole derechos; y mantener segura su información de inicio de sesión. Dameldato puede suspender o eliminar cuentas que incumplan estos términos sin previo aviso.</p>
                          <p className="mt-2"><strong>4. Contenido Publicado por Usuarios</strong><br />Los usuarios son responsables del contenido que publiquen y declaran tener derechos para hacerlo. Otorgan a Dameldato una licencia no exclusiva para mostrarlo en la plataforma. Dameldato puede eliminar contenido que infrinja leyes o buenas prácticas.</p>
                          <p className="mt-2"><strong>5. Pagos y Paquetes</strong><br />Algunos servicios requieren pago. Los precios se muestran en pesos chilenos (CLP) y pueden cambiar. No hay reembolsos salvo error de Dameldato.</p>
                          <p className="mt-2"><strong>6. Limitación de Responsabilidad</strong><br />Dameldato no garantiza encontrar empleo, que empleadores o trabajadores cumplan, ni que la plataforma sea ininterrumpida o totalmente segura. No es responsable por daños, pérdidas de datos, ingresos u oportunidades, ni por conflictos entre usuarios. El uso es bajo responsabilidad del usuario.</p>
                          <p className="mt-2"><strong>7. Datos Personales</strong><br />Dameldato trata datos según su Política de Privacidad, no vende datos a terceros y usa la información para operar y mejorar el servicio.</p>
                          <p className="mt-2"><strong>8. Modificaciones de los Términos</strong><br />Dameldato puede actualizar estos Términos; el uso continuado implica aceptación.</p>
                          <p className="mt-2"><strong>9. Suspensión o Eliminación de Cuenta</strong><br />Dameldato puede suspender o eliminar cuentas que infrinjan términos, cometan fraude o pongan en riesgo la plataforma o a otros usuarios.</p>
                          <p className="mt-2"><strong>10. Ley Aplicable</strong><br />Estos Términos se rigen por las leyes de Chile (o el país que se elija).</p>
                          <p className="mt-2"><strong>11. Aceptación</strong><br />Al continuar, confirmas que aceptas estos Términos.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <p className="text-center text-sm font-medium text-muted-foreground">Para continuar, selecciona tu perfil:</p>
                    <div className="flex flex-col items-center gap-4">
                      <Button
                        type="button"
                        onClick={() => {
                          selectRole('job-seeker');
                          handleNext();
                        }}
                        className="w-full max-w-sm h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                      >
                        🏠 Soy Vecino
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          selectRole('entrepreneur');
                          handleNext();
                        }}
                        className="w-full max-w-sm h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                      >
                        🛠️ Soy Emprendedor
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* KYC removido temporalmente */}
            {/* step === 2 && (
            <KYCVerification
              email={email}
              onComplete={() => {
                setIsKycVerified(true);
                localStorage.setItem('reg_kyc_done', 'true');
                setStep(4); // Saltar el antiguo paso 3
              }}
              onBack={() => setStep(1)}
            />
          ) */}


            {step === 4 && (
              <div className="space-y-6">
                {selectedRole === 'job-seeker' && (
                  <div className="space-y-4 p-4 border-2 border-primary/30 rounded-xl">
                    <h3 className="font-heading font-semibold text-lg">Datos como Vecino</h3>
                    <div>
                      <Label htmlFor="rubro">Rubro / Área</Label>
                      <Input
                        id="rubro"
                        value={rubro}
                        onChange={(e) => setRubro(e.target.value)}
                        placeholder="Ej: Construcción, Ventas, Tecnología"
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Experiencia</Label>
                      <Textarea
                        id="experience"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="Describe brevemente tu experiencia laboral"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'entrepreneur' && (
                  <div className="space-y-4 p-4 border-2 border-secondary/30 rounded-xl">
                    <h3 className="font-heading font-semibold text-lg">Datos como Emprendedor</h3>
                    <div>
                      <Label htmlFor="service">Servicio que Ofreces</Label>
                      <Input
                        id="service"
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        placeholder="Ej: Gasfitería, Peluquería, Diseño Web"
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolio">Descripción / Portafolio</Label>
                      <Textarea
                        id="portfolio"
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        placeholder="Describe tu servicio y experiencia"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minPrice">Precio Mínimo</Label>
                        <Input
                          id="minPrice"
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          placeholder="min"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxPrice">Precio Máximo</Label>
                        <Input
                          id="maxPrice"
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="max"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6 border-t">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2" size={18} />
                    Atrás
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1 font-bold text-lg h-12" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrando...' : 'Completar Registro'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
