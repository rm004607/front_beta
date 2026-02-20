import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { locationsAPI, pricingAPI } from '@/lib/api';
import i18n from '@/i18n';

interface Location {
    id: string;
    name: string;
    language_code: string;
    type: string;
}

interface LocationContextType {
    currentCountry: Location | null;
    pricingEnabled: boolean;
    isLoading: boolean;
    showLocationModal: boolean;
    setCountry: (country: Location) => void;
    setShowLocationModal: (show: boolean) => void;
    refreshPricingStatus: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentCountry, setCurrentCountry] = useState<Location | null>(null);
    const [pricingEnabled, setPricingEnabled] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

    const refreshPricingStatus = useCallback(async () => {
        try {
            const response = await pricingAPI.getStatus();
            setPricingEnabled(response.pricing_enabled);
        } catch (error) {
            console.error('Error fetching pricing status:', error);
            setPricingEnabled(true);
        }
    }, []);

    const detectLocation = useCallback(async () => {
        setIsLoading(true);
        try {
            // First try browser geolocation
            if ("geolocation" in navigator) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000,
                            enableHighAccuracy: false
                        });
                    });

                    if (position) {
                        // In a real app, we would call a reverse geocoding API here
                        // For now, we still call the detect API but we have the intention to use coordinates
                        const response = await locationsAPI.detect();
                        if (response.country) {
                            console.log('Detected country:', response.country.name, 'Language:', response.country.language_code);
                            setCurrentCountry(response.country);
                            i18n.changeLanguage(response.country.language_code);
                            localStorage.setItem('selected_country_id', response.country.id);
                            setShowLocationModal(false);
                            setIsLoading(false);
                            return;
                        }
                    }
                } catch (geoError) {
                    console.warn('Geolocation error or denied:', geoError);
                }
            }

            // Fallback to IP-based detection
            const response = await locationsAPI.detect();
            if (response.country) {
                console.log('Fallback detected country:', response.country.name);
                setCurrentCountry(response.country);
                i18n.changeLanguage(response.country.language_code);
                localStorage.setItem('selected_country_id', response.country.id);
                setShowLocationModal(false);
            } else {
                // If we have a stored ID, maybe we don't need the modal yet
                const storedId = localStorage.getItem('selected_country_id');
                if (!storedId) {
                    setShowLocationModal(true);
                }
            }
        } catch (error) {
            console.error('Error detecting location:', error);
            // If already has a stored country, don't show modal
            const storedCountryId = localStorage.getItem('selected_country_id');
            if (!storedCountryId) {
                setShowLocationModal(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setCountry = (country: Location) => {
        setCurrentCountry(country);
        i18n.changeLanguage(country.language_code);
        setShowLocationModal(false);
        localStorage.setItem('selected_country_id', country.id);
    };

    useEffect(() => {
        // Check if we already have a selection
        const storedCountryId = localStorage.getItem('selected_country_id');
        if (storedCountryId) {
            // In a full implementation, we would fetch the country details by ID
            // For now, we detect once to ensure fresh state or show modal
            detectLocation();
        } else {
            detectLocation();
        }
        refreshPricingStatus();
    }, [detectLocation, refreshPricingStatus]);

    return (
        <LocationContext.Provider
            value={{
                currentCountry,
                pricingEnabled,
                isLoading,
                showLocationModal,
                setCountry,
                setShowLocationModal,
                refreshPricingStatus,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
