import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageCircle, Loader2, Star, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { communitiesAPI, type Recommendation, type RecommendationComment } from '@/lib/api';

const initials = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

export default function CommunityRecommendationCard({
  communityId,
  rec,
}: {
  communityId: string;
  rec: Recommendation;
}) {
  const [upvoted, setUpvoted] = useState(!!rec.has_upvoted);
  const [upvotes, setUpvotes] = useState(rec.upvotes_count ?? 0);
  const [upvoting, setUpvoting] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<RecommendationComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(rec.comments_count ?? 0);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  const handleUpvote = async () => {
    if (upvoting) return;
    // Optimista
    const prev = { upvoted, upvotes };
    setUpvoted(!upvoted);
    setUpvotes(upvotes + (upvoted ? -1 : 1));
    setUpvoting(true);
    try {
      const res = await communitiesAPI.toggleUpvote(communityId, rec.id);
      setUpvoted(res.upvoted);
      setUpvotes(res.upvotes_count);
    } catch (e) {
      setUpvoted(prev.upvoted);
      setUpvotes(prev.upvotes);
      toast.error(e instanceof Error ? e.message : 'No pudimos registrar tu voto.');
    } finally {
      setUpvoting(false);
    }
  };

  const toggleComments = async () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && !commentsLoaded) {
      setLoadingComments(true);
      try {
        const res = await communitiesAPI.getComments(communityId, rec.id);
        setComments(res.comments ?? []);
        setCommentsCount(res.comments?.length ?? commentsCount);
        setCommentsLoaded(true);
      } catch {
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      const res = await communitiesAPI.addComment(communityId, rec.id, text);
      setComments((c) => [...c, res.comment]);
      setCommentsCount((n) => n + 1);
      setCommentText('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos publicar tu comentario.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-black shrink-0">
            {initials(rec.author_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {rec.title && <span className="font-bold text-sm">{rec.title}</span>}
              {rec.author_name && (
                <span className="text-xs text-muted-foreground">{rec.title ? '· ' : ''}por {rec.author_name}</span>
              )}
            </div>
            {rec.text && <p className="text-sm mt-1 leading-relaxed">{rec.text}</p>}

            {rec.service && (
              <Link to={`/servicios?servicio=${rec.service.id}`} className="mt-2 flex items-center gap-3 rounded-xl border border-border hover:border-primary/40 bg-muted/30 p-2.5 transition-colors">
                {rec.service.cover_image_url
                  ? <img src={rec.service.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  : <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Star size={18} /></div>}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{rec.service.service_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{[rec.service.comuna, rec.service.price_range].filter(Boolean).join(' · ')}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary shrink-0">Ver</span>
              </Link>
            )}

            {(rec.contact_name || rec.contact_phone) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {rec.contact_name && <span className="text-xs text-muted-foreground">Contacto: <b className="text-foreground">{rec.contact_name}</b></span>}
                {rec.contact_phone && (
                  <a href={waLink(rec.contact_phone)} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="h-8 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs">
                      <MessageCircle size={14} className="mr-1.5" /> WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            )}

            {/* Foro: upvote + comentarios */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
              <button
                type="button"
                onClick={handleUpvote}
                disabled={upvoting}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${upvoted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ThumbsUp size={15} className={upvoted ? 'fill-primary' : ''} />
                Lo recomiendo{upvotes > 0 ? ` · ${upvotes}` : ''}
              </button>
              <button
                type="button"
                onClick={toggleComments}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <MessageCircle size={15} />
                {commentsCount > 0 ? `${commentsCount} comentario${commentsCount === 1 ? '' : 's'}` : 'Comentar'}
              </button>
            </div>

            {commentsOpen && (
              <div className="mt-3 space-y-3">
                {loadingComments ? (
                  <div className="flex items-center text-xs text-muted-foreground"><Loader2 size={14} className="animate-spin mr-1.5" /> Cargando...</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                        {initials(c.author_name)}
                      </div>
                      <div className="min-w-0 flex-1 bg-muted/40 rounded-xl px-3 py-2">
                        {c.author_name && <span className="text-xs font-bold">{c.author_name}</span>}
                        <p className="text-sm leading-snug">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    placeholder="Escribe un comentario..."
                    className="h-9 text-sm"
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddComment} disabled={!commentText.trim() || posting}>
                    {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
