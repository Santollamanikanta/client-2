import React, { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Navigation } from 'lucide-react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  iconClassName?: string;
}

const AddressAutocomplete = ({ 
  onAddressSelect, 
  defaultValue = '', 
  placeholder = 'Start typing your address...',
  className = '',
  iconClassName = 'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted'
}: AddressAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const placesLib = useMapsLibrary('places');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setInputValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const options: google.maps.places.AutocompleteOptions = {
      fields: ['formatted_address', 'geometry', 'name'],
      componentRestrictions: { country: 'IN' } // Restrict to India as per app context
    };

    const newAutocomplete = new placesLib.Autocomplete(inputRef.current, options);
    setAutocomplete(newAutocomplete);
  }, [placesLib]);

  useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const address = place.formatted_address || place.name || '';
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        setInputValue(address);
        onAddressSelect(address, lat, lng);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [autocomplete, onAddressSelect]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Reverse Geocode
        const geocoder = new google.maps.Geocoder();
        try {
          const { results } = await geocoder.geocode({ location: { lat, lng } });
          if (results[0]) {
            const address = results[0].formatted_address;
            setInputValue(address);
            onAddressSelect(address, lat, lng);
          }
        } catch (err) {
          console.error("Geocoding failed:", err);
          alert("Couldn't find address for your location. Please type manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        alert("Location access denied. Please type your address.");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full">
      <MapPin className={iconClassName} />
      <input 
        ref={inputRef}
        type="text" 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className={`w-full pl-12 pr-24 py-4 bg-natural-surface border border-natural-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium ${className}`}
        placeholder={placeholder}
      />
      <button
        tabIndex={-1}
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 hover:bg-primary hover:text-white transition-all disabled:opacity-50 cursor-pointer"
      >
        {isLocating ? (
          <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <Navigation className="w-3 h-3" />
        )}
        Locate Me
      </button>
    </div>
  );
};

export default AddressAutocomplete;
