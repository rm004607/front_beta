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
            // Default to enabled if it fails
            setPricingEnabled(true);
        }
    }, []);

    const detectLocation = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await locationsAPI.detect();
            if (response.country) {
                setCurrentCountry(response.country);
                i18n.changeLanguage(response.country.language_code);
                setShowLocationModal(false);
            } else {
                setShowLocationModal(true);
            }
        } catch (error) {
            console.error('Error detecting location:', error);
            setShowLocationModal(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setCountry = (country: Location) => {
        setCurrentCountry(country);
        i18n.changeLanguage(country.language_code);
        setShowLocationModal(false);
        // Persist country selection if needed
        localStorage.setItem('selected_country_id', country.id);
    };

    useEffect(() => {
        detectLocation();
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
