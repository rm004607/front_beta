import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Globe, Loader2, ChevronRight, MapPin } from 'lucide-react';
import { locationsAPI } from '@/lib/api';
import { useLocation } from '@/contexts/LocationContext';
import { useTranslation } from 'react-i18next';

const LocationModal: React.FC = () => {
    const { showLocationModal, setCountry } = useLocation();
    const [countries, setCountries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (showLocationModal) {
            loadCountries();
        }
    }, [showLocationModal]);

    const loadCountries = async () => {
        setLoading(true);
        try {
            const response = await locationsAPI.getCountries();
            setCountries(response.countries);
        } catch (error) {
            console.error('Error loading countries:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={showLocationModal} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md bg-background/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden p-0 rounded-3xl">
                <div className="relative p-6">
                    {/* Decorative background */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

                    <DialogHeader className="relative z-10 text-center space-y-4 pt-4">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transform rotate-6 mb-2">
                            <Globe className="w-10 h-10 text-white animate-pulse" />
                        </div>
                        <DialogTitle className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            {t('location.select_country')}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-lg">
                            Personaliza tu experiencia seleccionando tu ubicación.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative z-10 mt-8 space-y-4 pb-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground italic">
                                    Cargando opciones premium...
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {countries.map((country) => (
                                    <Button
                                        key={country.id}
                                        variant="outline"
                                        className="h-16 justify-between px-6 border-white/5 hover:border-primary/50 hover:bg-primary/5 group transition-all duration-300 rounded-2xl"
                                        onClick={() => setCountry(country)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-lg font-medium">{country.name}</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LocationModal;
