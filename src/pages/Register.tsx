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
import EmailVerificationModal from '@/components/EmailVerificationModal';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, loadUser } = useUser();
  const [step, setStep] = useState(1);

  // Email verification modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Manejar éxito de Google OAuth en registro
  useEffect(() => {
    const googleSuccess = searchParams.get('google_login');
    if (googleSuccess === 'success') {
      loadUser().then(() => {
        toast.success('Bienvenido a BETA');
        navigate('/');
      });
    }

    const error = searchParams.get('error');
    if (error === 'google_auth_failed') {
      toast.error('Error al registrar con Google. Por favor intenta de nuevo.');
    }
  }, [searchParams, loadUser, navigate]);

  // Step 1: Basic data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [comuna, setComuna] = useState('');

  // Step 2: Roles (solo un rol según backend)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [googleRole, setGoogleRole] = useState<UserRole | null>(null);
  const [showGoogleRoles, setShowGoogleRoles] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 3: Role-specific data
  const [rubro, setRubro] = useState('');
  const [experience, setExperience] = useState('');
  const [service, setService] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [companyRut, setCompanyRut] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyRubro, setCompanyRubro] = useState('');
  const [hrContact, setHrContact] = useState('');

  const selectRole = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleGoogleSignup = () => {
    if (!acceptTerms) {
      toast.error('Debes aceptar los Términos y Condiciones');
      return;
    }
    if (!googleRole) {
      toast.error('Selecciona un rol para continuar con Google');
      return;
    }
    authAPI.googleLogin(googleRole);
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
      if (!name || !email || !password || !phone || !comuna) {
        toast.error('Por favor completa todos los campos');
        return;
      }
      if (!acceptTerms) {
        toast.error('Debes aceptar los Términos y Condiciones');
        return;
      }
    }
    if (step === 2 && !selectedRole) {
      toast.error('Selecciona un rol');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Selecciona un rol');
      return;
    }

    setIsSubmitting(true);
    try {
      // Enviar código de verificación
      await authAPI.register({
        name,
        email,
        password,
        phone,
        comuna,
        rol: roleToNumber(selectedRole),
      });

      toast.success('Código de verificación enviado a tu email');
      setShowVerificationModal(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (code: string) => {
    setIsVerifying(true);
    try {
      // Verificar código y completar registro
      await authAPI.verifyEmail({ email, code });

      // El backend hace login automático, cargar usuario
      await loadUser();

      toast.success('¡Email verificado! Bienvenido a Beta');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Código inválido o expirado');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await authAPI.resendCode(email);
      toast.success('Nuevo código enviado a tu email');
    } catch (error) {
      toast.error('Error al reenviar código');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-3xl font-heading">Crear Cuenta</CardTitle>
          <CardDescription>Paso {step} de 3</CardDescription>
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
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
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
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <Label htmlFor="comuna">Comuna</Label>
                <Input
                  id="comuna"
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  placeholder="Tu comuna"
                />
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
                        <p><strong>Bienvenido/a a Beta</strong>, una plataforma que conecta a personas que buscan oportunidades laborales, empresas que contratan y emprendedores que ofrecen servicios.</p>
                        <p className="mt-2">Al registrarse y utilizar Beta, usted acepta estos Términos y Condiciones. Si no está de acuerdo, no debe usar la plataforma.</p>
                        <p className="mt-2"><strong>1. Aceptación de los Términos</strong><br />Al crear una cuenta en Beta, el usuario declara haber leído, entendido y aceptado íntegramente estos Términos y Condiciones, así como la Política de Privacidad asociada.</p>
                        <p className="mt-2"><strong>2. Naturaleza del Servicio</strong><br />Beta es una plataforma que facilita la conexión entre usuarios, empresas y proveedores de servicios. Beta no garantiza empleos, ni se responsabiliza por acuerdos, pagos, compromisos o relaciones laborales generadas entre los usuarios fuera de la plataforma. El usuario entiende que Beta no participa en negociaciones laborales, no valida la veracidad total de las ofertas publicadas por terceros y no se hace responsable de conflictos, pérdidas o daños derivados de interacciones entre usuarios.</p>
                        <p className="mt-2"><strong>3. Registro y Responsabilidad del Usuario</strong><br />El usuario debe proporcionar datos verdaderos, completos y actualizados; no crear cuentas falsas o duplicadas; no suplantar identidad; no publicar contenido ofensivo, ilegal o que viole derechos; y mantener segura su información de inicio de sesión. Beta puede suspender o eliminar cuentas que incumplan estos términos sin previo aviso.</p>
                        <p className="mt-2"><strong>4. Contenido Publicado por Usuarios</strong><br />Los usuarios son responsables del contenido que publiquen y declaran tener derechos para hacerlo. Otorgan a Beta una licencia no exclusiva para mostrarlo en la plataforma. Beta puede eliminar contenido que infrinja leyes o buenas prácticas.</p>
                        <p className="mt-2"><strong>5. Uso Aceptable</strong><br />Prohibido publicar ofertas engañosas, estafas o actividades ilícitas; promover discriminación o violencia; hostigar o amenazar; hacer spam; o manipular el funcionamiento de la plataforma.</p>
                        <p className="mt-2"><strong>6. Limitación de Responsabilidad</strong><br />Beta no garantiza encontrar empleo, que empleadores o trabajadores cumplan, ni que la plataforma sea ininterrumpida o totalmente segura. No es responsable por daños, pérdidas de datos, ingresos u oportunidades, ni por conflictos entre usuarios. El uso es bajo responsabilidad del usuario.</p>
                        <p className="mt-2"><strong>7. Datos Personales</strong><br />Beta trata datos según su Política de Privacidad, no vende datos a terceros y usa la información para operar y mejorar el servicio.</p>
                        <p className="mt-2"><strong>8. Modificaciones de los Términos</strong><br />Beta puede actualizar estos Términos; el uso continuado implica aceptación.</p>
                        <p className="mt-2"><strong>9. Suspensión o Eliminación de Cuenta</strong><br />Beta puede suspender o eliminar cuentas que infrinjan términos, cometan fraude o pongan en riesgo la plataforma o a otros usuarios.</p>
                        <p className="mt-2"><strong>10. Ley Aplicable</strong><br />Estos Términos se rigen por las leyes de Chile (o el país que se elija).</p>
                        <p className="mt-2"><strong>11. Aceptación</strong><br />Al continuar, confirmas que aceptas estos Términos.</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full">
                  Siguiente
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>

              {/* Botón dorado para registro con Google */}
              <div className="pt-2 space-y-3">
                <Button
                  type="button"
                  className="w-full bg-amber-500 text-white hover:bg-amber-600"
                  onClick={() => setShowGoogleRoles(!showGoogleRoles)}
                  disabled={isSubmitting}
                >
                  Registrarse con Google
                </Button>

                {showGoogleRoles && (
                  <div className="space-y-2 rounded-lg border border-muted p-3">
                    <p className="text-sm font-medium text-muted-foreground">¿Cómo quieres ingresar?</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Button
                        type="button"
                        variant={googleRole === 'job-seeker' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => setGoogleRole('job-seeker')}
                      >
                        Trabajador
                      </Button>
                      <Button
                        type="button"
                        variant={googleRole === 'entrepreneur' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => setGoogleRole('entrepreneur')}
                      >
                        Emprendedor
                      </Button>
                      <Button
                        type="button"
                        variant={googleRole === 'company' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => setGoogleRole('company')}
                      >
                        Empresa
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleSignup}
                      disabled={isSubmitting}
                    >
                      Continuar con Google
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg mb-4 block">Selecciona tu rol:</Label>
                <div className="space-y-4">
                  <div
                    className={`flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedRole === 'job-seeker'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                      }`}
                    onClick={() => selectRole('job-seeker')}
                  >
                    <Checkbox
                      id="job-seeker"
                      checked={selectedRole === 'job-seeker'}
                      onCheckedChange={() => selectRole('job-seeker')}
                    />
                    <div className="flex-1">
                      <Label htmlFor="job-seeker" className="text-base font-semibold cursor-pointer">
                        👤 Buscar Empleo
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Estoy buscando oportunidades laborales
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedRole === 'entrepreneur'
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border hover:border-secondary'
                      }`}
                    onClick={() => selectRole('entrepreneur')}
                  >
                    <Checkbox
                      id="entrepreneur"
                      checked={selectedRole === 'entrepreneur'}
                      onCheckedChange={() => selectRole('entrepreneur')}
                    />
                    <div className="flex-1">
                      <Label htmlFor="entrepreneur" className="text-base font-semibold cursor-pointer">
                        🛠️ Ofrecer Servicios
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Soy emprendedor/a y ofrezco servicios
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedRole === 'company'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                      }`}
                    onClick={() => selectRole('company')}
                  >
                    <Checkbox
                      id="company"
                      checked={selectedRole === 'company'}
                      onCheckedChange={() => selectRole('company')}
                    />
                    <div className="flex-1">
                      <Label htmlFor="company" className="text-base font-semibold cursor-pointer">
                        🏢 Empresa
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Represento una empresa que ofrece empleos
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2" size={18} />
                  Atrás
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Siguiente
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {selectedRole === 'job-seeker' && (
                <div className="space-y-4 p-4 border-2 border-primary/30 rounded-xl">
                  <h3 className="font-heading font-semibold text-lg">Datos como Buscador de Empleo</h3>
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
                  <div>
                    <Label htmlFor="priceRange">Rango de Precio (opcional)</Label>
                    <Input
                      id="priceRange"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      placeholder="Ej: $15.000 - $30.000"
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'company' && (
                <div className="space-y-4 p-4 border-2 border-primary/30 rounded-xl">
                  <h3 className="font-heading font-semibold text-lg">Datos de la Empresa</h3>
                  <div>
                    <Label htmlFor="companyRut">RUT Empresa</Label>
                    <Input
                      id="companyRut"
                      value={companyRut}
                      onChange={(e) => setCompanyRut(e.target.value)}
                      placeholder="12.345.678-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyAddress">Dirección</Label>
                    <Input
                      id="companyAddress"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Dirección de la empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyRubro">Rubro</Label>
                    <Input
                      id="companyRubro"
                      value={companyRubro}
                      onChange={(e) => setCompanyRubro(e.target.value)}
                      placeholder="Sector o industria"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hrContact">Contacto RRHH</Label>
                    <Input
                      id="hrContact"
                      value={hrContact}
                      onChange={(e) => setHrContact(e.target.value)}
                      placeholder="Persona de contacto"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2" size={18} />
                  Atrás
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando...' : 'Completar Registro'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EmailVerificationModal
        open={showVerificationModal}
        email={email}
        onVerify={handleVerifyEmail}
        onResend={handleResendCode}
        onClose={() => setShowVerificationModal(false)}
        isVerifying={isVerifying}
      />
    </div>
  );
};

export default Register;
