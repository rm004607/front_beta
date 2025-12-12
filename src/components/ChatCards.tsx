import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Wrench, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ChatCardProps {
    type: 'job' | 'service';
    id: string | number;
    title: string;
    subtitle: string;
    details: string;
    url: string;
}

const ChatCard: React.FC<ChatCardProps> = ({ type, id, title, subtitle, details, url }) => {
    const navigate = useNavigate();

    return (
        <Card className="w-full max-w-[280px] bg-card border shadow-sm hover:shadow-md transition-shadow mb-2">
            <CardContent className="p-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/15 text-foreground dark:bg-accent/20 dark:text-foreground">
                        {type === 'job' ? <Briefcase size={18} /> : <Wrench size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate" title={title}>{title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                    </div>
                </div>

                <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={12} />
                        <span className="truncate">{details.split('•')[0]?.trim()}</span>
                    </div>
                    {details.includes('•') && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign size={12} />
                            <span className="truncate">{details.split('•')[1]?.trim()}</span>
                        </div>
                    )}
                </div>

                <Button
                    size="sm"
                    className="w-full mt-3 text-xs h-8 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground"
                    onClick={() => navigate(`${url}?highlight=${id}`)}
                >
                    Ir a {type === 'job' ? 'Trabajo' : 'Servicio'} <ArrowRight size={12} className="ml-1" />
                </Button>
            </CardContent>
        </Card>
    );
};

export default ChatCard;
