import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Send, MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { supportAPI } from '@/lib/api';

const Support = () => {
  const { isLoggedIn, user } = useUser();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    {
      question: '¿Cómo puedo crear una cuenta?',
      answer: 'Para crear una cuenta, haz clic en "Registrarse" en la parte superior de la página. Completa el formulario con tu información personal y selecciona el tipo de cuenta que deseas (Buscador de Empleo, Emprendedor o Empresa).',
    },
    {
      question: '¿Cómo publico un empleo?',
      answer: 'Si eres una empresa, ve a "Empleos" y haz clic en "Publicar Empleo". Completa el formulario con los detalles del puesto, requisitos, salario y ubicación. Los empleos son revisados antes de ser publicados.',
    },
    {
      question: '¿Cómo puedo postular a un empleo?',
      answer: 'Busca empleos en la sección "Empleos", lee los detalles y haz clic en "Postular Ahora". Asegúrate de tener tu CV actualizado en tu perfil. Las empresas recibirán tu postulación y te contactarán si estás interesado.',
    },
    {
      question: '¿Cómo actualizo mi CV?',
      answer: 'Ve a tu perfil, en la sección "Curriculum Vitae (CV)" puedes subir, reemplazar o eliminar tu CV. Solo se aceptan archivos PDF con un tamaño máximo de 10MB.',
    },
    {
      question: '¿Qué hago si olvidé mi contraseña?',
      answer: 'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" y sigue las instrucciones para restablecerla. Recibirás un correo con un enlace para crear una nueva contraseña.',
    },
    {
      question: '¿Cómo contacto con una empresa?',
      answer: 'Puedes contactar con empresas a través de sus publicaciones de empleo. Si postulas a un empleo, la empresa podrá ver tu perfil y CV, y te contactará si están interesados.',
    },
    {
      question: '¿Puedo cambiar mi tipo de cuenta?',
      answer: 'Para cambiar tu tipo de cuenta (por ejemplo, de Buscador de Empleo a Emprendedor), contacta con el soporte. Los cambios de rol importantes requieren verificación.',
    },
    {
      question: '¿Cómo reporto un problema o contenido inapropiado?',
      answer: 'Puedes reportar problemas o contenido inapropiado usando el formulario de tickets en esta página. Nuestro equipo revisará tu reporte y tomará las medidas necesarias.',
    },
  ];

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para enviar un ticket');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      await supportAPI.createTicket({
        subject: subject.trim(),
        message: message.trim(),
        category,
      });
      toast.success('Ticket enviado exitosamente. Te contactaremos pronto.');
      setSubject('');
      setMessage('');
      setCategory('general');
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error(error.message || 'Error al enviar el ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HelpCircle className="text-primary" size={48} />
          <h1 className="text-4xl font-heading font-bold">Centro de Ayuda</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Estamos aquí para ayudarte. Encuentra respuestas rápidas o contáctanos directamente.
        </p>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <MessageSquare size={16} />
            Preguntas Frecuentes
          </TabsTrigger>
          <TabsTrigger value="ticket" className="flex items-center gap-2">
            <Send size={16} />
            Enviar Ticket
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Preguntas Frecuentes (FAQ)</CardTitle>
              <CardDescription>
                Encuentra respuestas a las preguntas más comunes sobre Dameldato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ticket">
          <Card>
            <CardHeader>
              <CardTitle>Enviar un Ticket de Soporte</CardTitle>
              <CardDescription>
                ¿No encontraste la respuesta que buscabas? Envíanos un ticket y te ayudaremos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isLoggedIn ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Debes iniciar sesión para enviar un ticket de soporte.
                  </p>
                  <Button onClick={() => window.location.href = '/login'}>
                    Iniciar Sesión
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="general">General</option>
                      <option value="technical">Problema Técnico</option>
                      <option value="account">Cuenta</option>
                      <option value="payment">Pago</option>
                      <option value="report">Reportar Contenido</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Asunto</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej: Problema al subir mi CV"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe tu problema o consulta en detalle..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Send size={16} className="mr-2 animate-pulse" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Enviar Ticket
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Support;

