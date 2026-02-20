import React, { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { locationsAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface SelectionLevel {
    id: string;
    name: string;
    type: string;
    language_code?: string;
}

interface HierarchicalLocationSelectorProps {
    onLocationSelect: (location: SelectionLevel | null) => void;
    initialLocationId?: string;
    className?: string;
    placeholder?: string;
}

const HierarchicalLocationSelector: React.FC<HierarchicalLocationSelectorProps> = ({
    onLocationSelect,
    initialLocationId,
    className,
    placeholder = "Selecciona ubicación"
}) => {
    const [levels, setLevels] = useState<{ items: SelectionLevel[]; selectedId: string | null; type: string }[]>([]);
    const [loadingLevelIdx, setLoadingLevelIdx] = useState<number | null>(null);

    // Initialize with countries
    useEffect(() => {
        loadCountries();
    }, []);

    const loadCountries = async () => {
        setLoadingLevelIdx(0);
        try {
            const response = await locationsAPI.getCountries();
            setLevels([{ items: response.countries, selectedId: null, type: 'country' }]);
        } catch (error) {
            console.error('Error loading countries:', error);
        } finally {
            setLoadingLevelIdx(null);
        }
    };

    const handleSelect = async (levelIdx: number, value: string) => {
        const updatedLevels = [...levels.slice(0, levelIdx + 1)];
        updatedLevels[levelIdx].selectedId = value;
        setLevels(updatedLevels);

        // If "all" or equivalent is selected at the first level, we might want to reset
        if (value === 'all') {
            onLocationSelect(null);
            return;
        }

        const selectedItem = updatedLevels[levelIdx].items.find(item => item.id === value);
        if (selectedItem) {
            onLocationSelect(selectedItem);
        }

        // Fetch children
        setLoadingLevelIdx(levelIdx + 1);
        try {
            const response = await locationsAPI.getChildren(value);
            if (response.children && response.children.length > 0) {
                setLevels([...updatedLevels, {
                    items: response.children,
                    selectedId: null,
                    type: response.children[0].type
                }]);
            }
        } catch (error) {
            console.error('Error loading children:', error);
        } finally {
            setLoadingLevelIdx(null);
        }
    };

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {levels.map((level, idx) => (
                <div key={`${level.type}-${idx}`} className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <Select
                        value={level.selectedId || ''}
                        onValueChange={(val) => handleSelect(idx, val)}
                        disabled={loadingLevelIdx === idx}
                    >
                        <SelectTrigger className="glass-card border-white/10 h-11 capitalize">
                            <div className="flex items-center gap-2">
                                {level.selectedId ? (
                                    <SelectValue />
                                ) : (
                                    <span className="text-muted-foreground">
                                        {placeholder} ({level.type})
                                    </span>
                                )}
                            </div>
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/10 backdrop-blur-xl max-h-[300px]">
                            {level.items.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {level.items.length === 0 && !loadingLevelIdx && (
                        <p className="text-xs text-destructive mt-1 px-1">No se encontraron resultados para {level.type}</p>
                    )}
                </div>
            ))}
            {loadingLevelIdx !== null && loadingLevelIdx >= levels.length && (
                <div className="flex items-center justify-center p-2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
            )}
        </div>
    );
};

export default HierarchicalLocationSelector;
