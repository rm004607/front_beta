import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import HierarchicalLocationSelector from './HierarchicalLocationSelector';
import { useLocation } from '@/contexts/LocationContext';
import { MapPin } from 'lucide-react';

const LocationModal: React.FC = () => {
    const { showLocationModal, setShowLocationModal, setCountry } = useLocation();

    return (
        <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
            <DialogContent className="sm:max-w-md glass-card border-white/10 backdrop-blur-xl rounded-3xl">
                <DialogHeader className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        Selecciona tu ubicación
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground whitespace-pre-line">
                        No pudimos detectar tu ubicación automáticamente.
                        Por favor, selecciona tu país, región y comuna para una mejor experiencia.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                    <HierarchicalLocationSelector
                        onLocationSelect={(location) => {
                            if (location) {
                                // En un contexto global, si selecciona algo (país, región o comuna)
                                // lo establecemos como la ubicación actual
                                setCountry({
                                    id: location.id,
                                    name: location.name,
                                    type: location.type,
                                    language_code: location.language_code || 'es'
                                });
                            }
                        }}
                        placeholder="Buscar lugar..."
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LocationModal;
