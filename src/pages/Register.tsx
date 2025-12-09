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
        toast.success('¡Registro exitoso con Google!');
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
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O regístrate con</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => authAPI.googleLogin('job-seeker')}
                disabled={isSubmitting}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuar con Google
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O completa el formulario</span>
                </div>
              </div>

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
              <Button onClick={handleNext} className="w-full">
                Siguiente
                <ArrowRight className="ml-2" size={18} />
              </Button>
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

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">O regístrate con Google</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (selectedRole) {
                        authAPI.googleLogin(selectedRole);
                      } else {
                        toast.error('Por favor selecciona un rol primero');
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continuar con Google ({selectedRole ? selectedRole === 'job-seeker' ? 'Buscador' : selectedRole === 'entrepreneur' ? 'Emprendedor' : 'Empresa' : 'Selecciona rol'})
                  </Button>
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
