import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ComingSoon from '@/pages/ComingSoon';

export const CountryGate = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if we already have a block status to avoid re-fetching
    const storedStatus = localStorage.getItem('dameldato_block_status');
    if (storedStatus === 'blocked') {
      setIsBlocked(true);
      setIsLoading(false);
      return;
    } else if (storedStatus === 'allowed') {
      setIsBlocked(false);
      setIsLoading(false);
      return;
    }

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
            const isCL = data.countryCode === 'CL';
            setIsBlocked(!isCL);
            setDetectedCountry(data.country);
            localStorage.setItem('dameldato_block_status', isCL ? 'allowed' : 'blocked');
          }
        } else {
          const isCL = data.country_code === 'CL';
          setIsBlocked(!isCL);
          setDetectedCountry(data.country_name);
          localStorage.setItem('dameldato_block_status', isCL ? 'allowed' : 'blocked');
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        // Default to not blocking if detection fails to avoid locking out legitimate users
        setIsBlocked(false);
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  // For manual testing/override via console
  useEffect(() => {
    (window as any).forceBlock = (block: boolean) => {
      setIsBlocked(block);
      localStorage.setItem('dameldato_block_status', block ? 'blocked' : 'allowed');
    };
  }, []);

  if (isLoading) return null;

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
        <ComingSoon />
      </div>
    );
  }

  return null;
};
