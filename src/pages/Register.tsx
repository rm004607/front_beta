import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserRole, useUser } from '@/contexts/UserContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import {
  isValidName,
  validatePhone,
  isValidPhone,
  isValidComuna,
  isValidRut,
  formatRut,
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
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser, loadUser } = useUser();
  const [step, setStep] = useState(() => {
    const stepParam = searchParams.get('step');
    return stepParam ? parseInt(stepParam) : 1;
  });
  const [isKycVerified, setIsKycVerified] = useState(true);
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const hasPrefilled = useRef(false);


  // Step 1: Basic data
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
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

  // Persistir datos si viene de QR o Google
  // Función para decodificar JWT sin librerías externas
  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const urlToken = searchParams.get('token');
    const isRegistrationPending = searchParams.get('google_registration_pending') === 'true';

    // Si el registro de Google está pendiente, tratar de pre-poblar desde el token
    if (isRegistrationPending && urlToken && !hasPrefilled.current) {
      const decoded = decodeToken(urlToken);
      if (decoded) {
        if (decoded.google_name) setName(decoded.google_name);
        if (decoded.google_email) setEmail(decoded.google_email);
        hasPrefilled.current = true;
      }
    }

    // Si ya hay un usuario cargado (ej. por token de Google ya registrado), pre-poblar campos
    // Solo lo hacemos una vez para permitir al usuario borrar los campos si lo desea
    if (user && !hasPrefilled.current) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      // No auto-poblar RUT ni teléfono por privacidad
      if (user.comuna) setComuna(user.comuna);
      if (user.region_id) setSelectedRegion(user.region_id);
      hasPrefilled.current = true;
    }

    const emailParam = searchParams.get('email');
    if (emailParam && !email) {
      setEmail(emailParam);
      localStorage.setItem('reg_email', emailParam);
    }

    // Del mismo modo para localStorage, solo si están vacíos al inicio
    if (!hasPrefilled.current) {
      const savedName = localStorage.getItem('reg_name');
      if (savedName && !name) setName(savedName);

      const savedEmail = localStorage.getItem('reg_email');
      if (savedEmail && !email) setEmail(savedEmail);

      const savedComuna = localStorage.getItem('reg_comuna');
      if (savedComuna && !comuna) setComuna(savedComuna);

      // Si cargamos algo de localStorage, también marcamos como prefilled
      if (savedName || savedEmail || savedComuna) {
        hasPrefilled.current = true;
      }
    }
  }, [user, searchParams]); // Reducimos dependencias para evitar bucles de reset

  // Step 3: Role-specific data
  const [rubro, setRubro] = useState('');
  const [experience, setExperience] = useState('');
  const [service, setService] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Detect Google redirect
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setStep(2); // Go directly to role selection
      setIsGoogleVerified(true);
      loadUser(); // Asegurar que cargamos los datos del usuario logueado con ese token
    } else if (localStorage.getItem('token')) {
      // Si no hay token en URL pero hay uno en localStorage, y estamos en /registro,
      // podría ser una continuación de flujo de Google (especialmente si no hay sesión normal)
      setIsGoogleVerified(true);
    }
  }, [searchParams]);

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
      if (!name || !rut || !email || !password || !phone || !comuna || !selectedRegion) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      if (!isValidEmail(email)) {
        toast.error('Por favor ingresa un email válido y real');
        return;
      }

      if (!isValidName(name)) {
        toast.error(getValidationErrorMessage('name', containsSQLInjection(name) ? 'sql' : 'format'));
        return;
      }

      if (!isValidRut(rut)) {
        toast.error(getValidationErrorMessage('rut', containsSQLInjection(rut) ? 'sql' : 'format'));
        return;
      }

      if (!isValidPhone(phone)) {
        const phoneError = validatePhone(phone);
        toast.error(getValidationErrorMessage('phone', phoneError === 'format' ? 'format' : 'length'));
        return;
      }

      if (!acceptTerms) {
        toast.error('Debes aceptar los Términos y Condiciones');
        return;
      }

      // Guardar datos temporalmente
      localStorage.setItem('reg_name', name);
      localStorage.setItem('reg_rut', rut);
      localStorage.setItem('reg_email', email);
      localStorage.setItem('reg_phone', phone);
      localStorage.setItem('reg_comuna', comuna);

      setStep(2); // Go to role selection
    }
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

  const handleSubmit = async (roleOverride?: UserRole) => {
    const finalRole = roleOverride || selectedRole;

    if (!finalRole) {
      toast.error('Selecciona un rol');
      return;
    }

    const isGoogleCompletion = !!searchParams.get('token') || (isGoogleVerified && user);

    // Validar email real (solo if no es Google completion o si el email está vacío y no es Google)
    if (!isGoogleCompletion && !isValidEmail(email)) {
      toast.error('Por favor ingresa un email válido y real');
      return;
    }

    // Validaciones de seguridad y campos obligatorios
    if (isGoogleCompletion) {
      if (!rut || !isValidRut(rut)) {
        toast.error('Por favor ingresa un RUT válido');
        return;
      }
      if (!phone || !isValidPhone(phone)) {
        const phoneError = validatePhone(phone || '');
        toast.error(getValidationErrorMessage('phone', phoneError === 'format' ? 'format' : 'length'));
        return;
      }
      if (!comuna || !selectedRegion) {
        toast.error('Por favor selecciona tu región y comuna');
        return;
      }
    } else {
      // Registro normal
      if (name && !isValidName(name)) {
        toast.error(getValidationErrorMessage('name', containsSQLInjection(name) ? 'sql' : 'format'));
        return;
      }

      if (rut && !isValidRut(rut)) {
        toast.error(getValidationErrorMessage('rut', containsSQLInjection(rut) ? 'sql' : 'format'));
        return;
      }

      if (phone && !isValidPhone(phone)) {
        const phoneError = validatePhone(phone);
        toast.error(getValidationErrorMessage('phone', phoneError === 'format' ? 'format' : 'length'));
        return;
      }

      if (comuna && !isValidComuna(comuna)) {
        toast.error(getValidationErrorMessage('comuna', containsSQLInjection(comuna) ? 'sql' : 'format'));
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const urlToken = searchParams.get('token');
      const isRegistrationPending = searchParams.get('google_registration_pending') === 'true';
      const isGoogleCompletion = !!urlToken || isGoogleVerified || !!localStorage.getItem('token');

      // Sanitizar inputs antes de enviar
      const data: any = {
        name: sanitizeInput(name, 100),
        rut: rut ? sanitizeInput(rut.replace(/[^0-9kK]/g, ''), 12) : undefined,
        phone: sanitizeInput(phone, 20),
        comuna: sanitizeInput(comuna, 50),
        region_id: selectedRegion,
        rol: roleToNumber(finalRole),
        // Campos adicionales para emprendedores
        rubro: finalRole === 'entrepreneur' ? sanitizeInput(rubro || '', 100) : undefined,
        experience: finalRole === 'entrepreneur' ? sanitizeInput(experience || '', 2000) : undefined,
        service: finalRole === 'entrepreneur' ? sanitizeInput(service || '', 100) : undefined,
        portfolio: finalRole === 'entrepreneur' ? sanitizeInput(portfolio || '', 2000) : undefined,
      };

      if (isRegistrationPending && urlToken) {
        // Nuevo flujo: Registro con Google aún no creado en BD
        data.token = urlToken;
        const response = await authAPI.googleRegister(data);
        // Guardar nuevo token de sesión
        localStorage.setItem('token', response.token);
      } else if (isGoogleCompletion) {
        // Flujo antiguo o actualización de cuenta Google existente
        await authAPI.updateProfile(data);
      } else {
        // Registro normal requiere email y password
        data.email = email.trim().toLowerCase();
        data.password = password;
        await authAPI.register(data);
        await authAPI.login({ email: data.email, password });
      }

      // Cargar usuario
      await loadUser();

      toast.success('¡Registro completado exitosamente!');
      navigate('/');
    } catch (error: any) {
      console.error('Error in registration/completion:', error);
      const msg = error?.status === 400 && error?.message?.toLowerCase().includes('rut')
        ? 'El RUT ya se encuentra registrado con otra cuenta'
        : (error instanceof Error ? error.message : 'Error al procesar solicitud');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center py-8 sm:py-12 px-4 mt-6">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 px-4 sm:px-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
              Únete a la Comunidad
            </CardTitle>
            <CardDescription className="text-base sm:text-lg">Paso {step === 4 ? 2 : 1} de 2</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
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
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={rut}
                    onChange={(e) => setRut(formatRut(e.target.value))}
                    placeholder="12.345.678-9"
                    className={rut && !isValidRut(rut) ? 'border-red-500' : ''}
                    maxLength={12}
                  />
                  {rut && !isValidRut(rut) && (
                    <p className="text-sm text-red-500 mt-1">
                      {getValidationErrorMessage('rut', containsSQLInjection(rut) ? 'sql' : 'format')}
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
                    className={phone && validatePhone(phone) === 'format' ? 'border-red-500' : ''}
                  />
                  {phone && validatePhone(phone) === 'format' && (
                    <p className="text-sm text-red-500 mt-1">
                      {getValidationErrorMessage('phone', 'format')}
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
                          <p className="font-bold text-sm mb-4">TÉRMINOS Y CONDICIONES DE USO – DAMELDATO</p>
                          <p className="mb-2"><strong>1. Aceptación de los Términos</strong><br />Al acceder, registrarse o utilizar Dameldato, el usuario declara haber leído, entendido y aceptado íntegramente los presentes Términos y Condiciones. Si no está de acuerdo, deberá abstenerse de utilizar la plataforma.</p>
                          <p className="mb-2"><strong>2. ¿Qué es Dameldato?</strong><br />Dameldato es una plataforma digital de contacto que permite a personas que ofrecen servicios (“Proveedores”) publicar información básica sobre dichos servicios y a personas interesadas (“Usuarios”) contactarlos directamente, principalmente mediante WhatsApp u otros medios externos. Dameldato NO presta servicios, NO contrata, NO valida, NO certifica ni NO supervisa a los Proveedores.</p>
                          <p className="mb-2"><strong>3. Rol de la Plataforma (Cláusula Crítica)</strong><br />Dameldato actúa únicamente como un medio de publicación y contacto. La plataforma NO es parte de ninguna relación contractual, acuerdo verbal, pago, prestación de servicio, garantía, reclamo, conflicto, daño o perjuicio que pudiera surgir entre Usuarios y Proveedores. Cualquier acuerdo celebrado es exclusiva responsabilidad de las partes involucradas.</p>
                          <p className="mb-2"><strong>4. Registro y Uso</strong><br />El registro es voluntario y gratuito (salvo que se indique lo contrario). El usuario es responsable de la veracidad de la información que publica. Dameldato no se hace responsable por información falsa, incompleta o engañosa proporcionada por los usuarios.</p>
                          <p className="mb-2"><strong>5. Contacto entre Usuarios</strong><br />El contacto entre Usuarios y Proveedores se realiza fuera de la plataforma, principalmente mediante WhatsApp u otros medios externos. Dameldato no controla, registra ni interviene en dichas comunicaciones.</p>
                          <p className="mb-2"><strong>6. Responsabilidad y Exención</strong><br />Dameldato NO será responsable, bajo ninguna circunstancia, por: Incumplimiento de servicios; Daños materiales, personales o morales; Fraudes, estafas o engaños; Pagos, cobros, reembolsos o disputas económicas; Accidentes, lesiones o pérdidas; Calidad, legalidad o resultado de los servicios ofrecidos. El uso de la plataforma se realiza bajo exclusiva responsabilidad del usuario.</p>
                          <p className="mb-2"><strong>7. Contenido Publicado</strong><br />Dameldato se reserva el derecho de modificar, ocultar o eliminar publicaciones que: Sean falsas, ilegales o engañosas; Infrinjan derechos de terceros; Atenten contra la ley, la moral o el orden público. Esto no implica obligación de supervisión permanente.</p>
                          <p className="mb-2"><strong>8. Suspensión o Eliminación de Cuentas</strong><br />Dameldato podrá suspender o eliminar cuentas sin previo aviso si detecta uso indebido, fraude, abuso o incumplimiento de estos términos.</p>
                          <p className="mb-2"><strong>9. Modificaciones</strong><br />Dameldato podrá actualizar estos Términos y Condiciones en cualquier momento. El uso continuado de la plataforma implica aceptación de los cambios.</p>
                          <p className="mb-2"><strong>10. Legislación Aplicable</strong><br />Estos Términos se rigen por las leyes vigentes de la República de Chile. Cualquier controversia deberá resolverse conforme a dicha legislación.</p>
                          <p className="mb-2"><strong>11. Contacto</strong><br />Para consultas generales sobre la plataforma: 🌐 dameldato.com</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button onClick={handleNext} className="w-full font-bold text-lg h-12">
                      Siguiente
                      <ArrowRight className="ml-2" size={18} />
                    </Button>
                  </div>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground font-semibold">O regístrate con</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    onClick={() => authAPI.googleLogin()}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Google
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold font-heading">¿Cómo quieres usar Dameldato?</h3>
                  <p className="text-muted-foreground">Completa tus datos y selecciona tu perfil para continuar</p>
                </div>

                {/* Campos requeridos para Google Completion */}
                {(searchParams.get('token') || (isGoogleVerified && user)) && (
                  <div className="space-y-4 p-4 border rounded-xl bg-white/50 backdrop-blur-sm border-white/20 shadow-inner">
                    <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">i</span>
                      Información Requerida
                    </p>

                    <div>
                      <Label htmlFor="rut_step2">RUT <span className="text-destructive">*</span></Label>
                      <Input
                        id="rut_step2"
                        value={rut}
                        onChange={(e) => setRut(formatRut(e.target.value))}
                        placeholder="12.345.678-9"
                        className={rut && !isValidRut(rut) ? 'border-red-500' : ''}
                        maxLength={12}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone_step2">Teléfono <span className="text-destructive">*</span></Label>
                      <Input
                        id="phone_step2"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+56 9 1234 5678"
                        className={phone && validatePhone(phone) === 'format' ? 'border-red-500' : ''}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="region_step2">Región <span className="text-destructive">*</span></Label>
                        <Select value={selectedRegion} onValueChange={(val) => {
                          setSelectedRegion(val);
                          setComuna('');
                        }}>
                          <SelectTrigger id="region_step2">
                            <SelectValue placeholder="Región" />
                          </SelectTrigger>
                          <SelectContent>
                            {chileData.map((reg) => (
                              <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="comuna_step2">Comuna <span className="text-destructive">*</span></Label>
                        <Select value={comuna} onValueChange={setComuna} disabled={!selectedRegion}>
                          <SelectTrigger id="comuna_step2">
                            <SelectValue placeholder="Comuna" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedRegion && chileData.find(r => String(r.id) === String(selectedRegion))?.communes.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center gap-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedRole('job-seeker');
                      // Enviamos el rol directamente para evitar problemas de estado asíncrono
                      handleSubmit('job-seeker');
                    }}
                    className="w-full max-w-md h-20 text-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-between px-8"
                  >
                    <span className="flex flex-col items-start">
                      <span>🏠 Soy Vecino</span>
                      <span className="text-xs font-normal opacity-80">Busco datos y servicios</span>
                    </span>
                    <ArrowRight size={24} />
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedRole('entrepreneur');
                      setStep(3);
                    }}
                    className="w-full max-w-md h-20 text-xl font-bold bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 flex items-center justify-between px-8"
                  >
                    <span className="flex flex-col items-start">
                      <span>🛠️ Soy Emprendedor</span>
                      <span className="text-xs font-normal opacity-80">Ofrezco mis servicios</span>
                    </span>
                    <ArrowRight size={24} />
                  </Button>
                </div>

                <Button variant="ghost" onClick={() => setStep(1)} className="w-full">
                  <ArrowLeft className="mr-2" size={18} />
                  Volver al formulario
                </Button>
              </div>
            )}

            {step === 3 && selectedRole === 'entrepreneur' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4 p-5 border-2 border-secondary/30 rounded-2xl bg-secondary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white">3</div>
                    <h3 className="font-heading font-bold text-xl">Tu Perfil de Emprendedor</h3>
                  </div>

                  <div>
                    <Label htmlFor="service" className="text-sm font-semibold">¿Qué servicio ofreces? *</Label>
                    <Input
                      id="service"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      placeholder="Ej: Gasfitería, Peluquería, Clases Particulares"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="rubro" className="text-sm font-semibold">Rubro / Categoría</Label>
                    <Input
                      id="rubro"
                      value={rubro}
                      onChange={(e) => setRubro(e.target.value)}
                      placeholder="Ej: Construcción, Estética, Educación"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="portfolio" className="text-sm font-semibold">Descripción de tu trabajo</Label>
                    <Textarea
                      id="portfolio"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="Cuéntanos un poco sobre lo que haces y tu experiencia"
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                    <ArrowLeft className="mr-2" size={18} />
                    Atrás
                  </Button>
                  <Button onClick={() => handleSubmit()} className="flex-[2] font-bold text-lg h-12 bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrando...' : 'Finalizar Registro'}
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
