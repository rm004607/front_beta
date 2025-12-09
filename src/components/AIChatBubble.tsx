import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/contexts/UserContext';
import { aiAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ChatCard, { ChatCardProps } from './ChatCards';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: ChatCardProps[];
  timestamp: Date;
}

const AIChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy Beta, tu asistente de IA. ¿Buscas trabajo o servicio?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoggedIn } = useUser();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!isLoggedIn) {
      toast.error('Debes iniciar sesión para usar el chat de IA');
      navigate('/login');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiAPI.askAIAboutJobs(currentInput);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        cards: response.cards, // Capturar tarjetas si existen
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error(error.message || 'Error al enviar mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    'Busco trabajo',
    'Busco servicio'
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      aiAPI.askAIAboutJobs(question)
        .then(response => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.answer,
            cards: response.cards,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        })
        .catch(error => {
          console.error('Error:', error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          toast.error(error.message || 'Error al enviar mensaje');
        })
        .finally(() => {
          setIsLoading(false);
          setInputMessage('');
        });
    }, 100);
  };



  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-[9999] w-16 h-16 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
          } flex items-center justify-center text-white border-2 border-white`}
        aria-label="Abrir chat de Beta"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageCircle size={24} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>

      {/* Panel de chat */}
      {isOpen && (
        <Card
          className="fixed bottom-24 left-6 z-[9998] w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] shadow-2xl flex flex-col border-2 md:w-96 bg-background"
        >
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src="/src/assets/beta-logo.png"
                    alt="Beta"
                    className="w-8 h-8 rounded-full bg-white p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-yellow-500" />
                </div>
                <CardTitle className="text-lg">Beta IA</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-black hover:bg-black/20 h-8 w-8"
              >
                <X size={16} />
              </Button>
            </div>
            <p className="text-xs text-black/80 mt-1">Asistente inteligente para encontrar trabajo</p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Área de mensajes */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
                            <Bot size={16} />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-2 ${message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          {user?.profile_image ? (
                            <AvatarImage src={user.profile_image} alt={user.name} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <UserIcon size={16} />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      )}
                    </div>

                    {/* Renderizar tarjetas si existen */}
                    {message.cards && message.cards.length > 0 && (
                      <div className="pl-11 w-full space-y-2">
                        {message.cards.map((card, idx) => (
                          <ChatCard key={idx} {...card} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Bot size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="animate-spin text-primary" size={16} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Preguntas sugeridas */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-4 pb-2 border-t pt-2">
                <p className="text-xs text-muted-foreground mb-2">Preguntas sugeridas:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1 px-2"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input de mensaje */}
            <div className="p-4 border-t bg-card">

              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Escribe tu respuesta..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
              {!isLoggedIn && (
                <p className="text-xs text-muted-foreground mt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/login');
                    }}
                    className="text-primary hover:underline"
                  >
                    Inicia sesión
                  </button>
                  {' '}para usar el chat de IA
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AIChatBubble;
