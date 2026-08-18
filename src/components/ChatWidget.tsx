import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { aiAPI } from '@/lib/api';
import faviconDameldato from '/logoico.webp';

type Card = { type: 'job' | 'service'; id: string | number; title: string; subtitle: string; details: string; url: string };
type Msg = { role: 'user' | 'assistant'; text: string; cards?: Card[] };

const WELCOME = '¡Hola! Soy el asistente de Dameldato.com 👋 ¿Qué necesitas? Te busco el dato al toque.';
const EXAMPLES = ['Un gásfiter en Ñuñoa', 'Clases de matemáticas', 'Electricista de confianza'];

export default function ChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending, open]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150); }, [open]);

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
      setMessages((m) => [...m, { role: 'assistant', text: e instanceof Error ? e.message : 'Uy, algo falló. Intenta de nuevo en un momento.' }]);
    } finally {
      setSending(false);
    }
  };

  const goCard = (c: Card) => {
    setOpen(false);
    const href = c.url && c.url.startsWith('/') ? c.url : `/servicios?servicio=${c.id}`;
    navigate(href);
  };

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente de Dameldato.com"
          className="fixed z-40 right-4 md:right-6 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 h-14 w-14 rounded-full bg-card border border-primary/15 shadow-xl shadow-primary/10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <img src={faviconDameldato} alt="" className="h-9 w-9 object-contain" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-card" />
        </button>
      )}

      {/* Panel del chat */}
      {open && (
        <div
          className="fixed z-50 flex flex-col bg-card shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200
            inset-x-2 bottom-2 top-16 rounded-3xl
            sm:inset-auto sm:top-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[600px] sm:max-h-[82vh]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/[0.06] shrink-0">
            <div className="h-9 w-9 rounded-xl bg-card border border-primary/15 flex items-center justify-center shrink-0">
              <img src={faviconDameldato} alt="" className="h-6 w-6 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">Asistente Dameldato.com</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> En línea</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-muted/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={msg.role === 'user' ? 'max-w-[85%]' : 'w-full max-w-[92%]'}>
                  <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                      : 'bg-card border border-border/70 text-foreground rounded-2xl rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.cards.map((c) => (
                        <button
                          key={`${c.type}-${c.id}`}
                          onClick={() => goCard(c)}
                          className="flex items-center gap-3 w-full text-left rounded-2xl border border-border bg-card hover:border-primary/40 p-2.5 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Sparkles size={16} /></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate">{c.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{c.subtitle || c.details}</p>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/70 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
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
            className="flex items-center gap-2 p-3 border-t border-border bg-card shrink-0"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe qué necesitas..."
              className="h-11 rounded-2xl bg-muted/40 border-transparent focus-visible:bg-background"
              disabled={sending}
            />
            <Button type="submit" size="icon" className="h-11 w-11 rounded-2xl shrink-0" disabled={sending || !input.trim()}>
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
