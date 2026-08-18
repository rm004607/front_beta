import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Send, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiAPI } from '@/lib/api';

type Card = { type: 'job' | 'service'; id: string | number; title: string; subtitle: string; details: string; url: string };
type Msg = { role: 'user' | 'assistant'; text: string; cards?: Card[] };

const WELCOME =
  '¡Hola! Soy el asistente de Dameldato.com. Cuéntame qué necesitas y te busco el dato. Por ejemplo: "necesito un gásfiter en Ñuñoa" o "busco clases de matemáticas".';

const EXAMPLES = [
  'Necesito un gásfiter en Ñuñoa',
  'Busco electricista de confianza',
  'Alguien que enseñe guitarra',
];

const Asistente = () => {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setSending(true);
    try {
      const res = await aiAPI.askAIAboutJobs(q);
      setMessages((m) => [...m, { role: 'assistant', text: res.answer, cards: (res.cards as Card[]) || [] }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: e instanceof Error ? e.message : 'No pude procesar eso ahora. Intenta de nuevo.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-black leading-tight">Asistente Dameldato.com</h1>
          <p className="text-xs text-muted-foreground">Dime qué necesitas y te busco el dato al toque.</p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>

              {msg.cards && msg.cards.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.cards.map((c) => {
                    const href = c.url && c.url.startsWith('/') ? c.url : `/servicios?servicio=${c.id}`;
                    return (
                      <Link
                        key={`${c.type}-${c.id}`}
                        to={href}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card hover:border-primary/40 p-3 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Sparkles size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{c.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{c.subtitle}</p>
                          {c.details && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.details}</p>}
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 size={15} className="animate-spin" /> Buscando...
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => send(ex)}
                className="text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-full px-3 py-1.5 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="sticky bottom-0 bg-background pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe qué necesitas..."
            className="h-12 rounded-2xl"
            disabled={sending}
          />
          <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl shrink-0" disabled={sending || !input.trim()}>
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Asistente;
