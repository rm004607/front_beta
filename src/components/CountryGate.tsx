import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

export const CountryGate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('dameldato_location_modal_seen');
    if (hasSeenModal) return;

    const detectLocation = async () => {
      try {
        // Try ipapi.co first
        let response = await fetch('https://ipapi.co/json/');
        let data = await response.json();

        if (data.error || data.reason === 'RateLimited') {
          // Fallback to ip-api.com
          response = await fetch('http://ip-api.com/json');
          data = await response.json();
          
          if (data.status === 'success') {
            console.log('Location detection (fallback):', data.country, data.countryCode);
            if (data.countryCode !== 'CL') {
              setDetectedCountry(data.country);
              setIsOpen(true);
            }
          }
        } else {
          console.log('Location detection (primary):', data.country_name, data.country_code);
          if (data.country_code !== 'CL') {
            setDetectedCountry(data.country_name);
            setIsOpen(true);
          } else {
            console.log('User is in Chile (CL), modal will not show.');
          }
        }
      } catch (error) {
        console.error('Error detecting location:', error);
      }
    };

    detectLocation();
  }, []);

  const handleClose = () => {
    localStorage.setItem('dameldato_location_modal_seen', 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md rounded-[2rem] border-primary/20 bg-white/95 backdrop-blur-xl">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary animate-bounce-subtle">
            <span className="text-3xl">🌎</span>
          </div>
          <DialogTitle className="text-2xl font-black text-center">
            {t('home.coming_soon_title')}
          </DialogTitle>
          <DialogDescription className="text-base text-center font-medium leading-relaxed">
            {t('home.coming_soon_desc', { country: detectedCountry })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleClose}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            {t('home.coming_soon_cta')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
