/**
 * PlaceAutocomplete Component
 * ARIA-compliant address/place autocomplete with keyboard navigation
 */

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getProvider, type ProviderId, type Suggestion } from '../lib/geocode';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

type PlaceAutocompleteProps = {
  placeholder?: string;
  provider?: ProviderId;
  defaultBias?: { lat: number; lng: number; radius?: number };
  useGeolocationBias?: boolean;
  onSelect: (suggestion: Suggestion) => void;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export default function PlaceAutocomplete({
  placeholder = 'Enter address...',
  provider = 'geoapify',
  defaultBias,
  useGeolocationBias = false,
  onSelect,
  className = '',
  value: controlledValue,
  onChange: controlledOnChange,
}: PlaceAutocompleteProps) {
  const [internalValue, setInternalValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [bias, setBias] = useState(defaultBias);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledOnChange || setInternalValue;

  const debouncedQuery = useDebouncedValue(value, 300);

  // Get geolocation bias on mount if requested
  useEffect(() => {
    if (useGeolocationBias && !bias && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBias({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            radius: 10000, // 10km
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, [useGeolocationBias, bias]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset if query is too short
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);

    const geocodeProvider = getProvider(provider);

    geocodeProvider
      .autocomplete(debouncedQuery, {
        limit: 7,
        bias,
        signal: abortController.signal,
      })
      .then((results) => {
        if (!abortController.signal.aborted) {
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setActiveIndex(-1);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Autocomplete error:', error);
          setSuggestions([]);
          setIsOpen(false);
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [debouncedQuery, provider, bias]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleSelect = (suggestion: Suggestion) => {
    setValue(suggestion.label);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(suggestion);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click events to fire
    setTimeout(() => {
      setIsOpen(false);
      setActiveIndex(-1);
    }, 200);
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <strong key={i} className="font-bold text-orange-600">
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input with ARIA combobox */}
      <div className="relative">
        <MapPin
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="place-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300
                     focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20
                     bg-white/60 backdrop-blur-xl
                     transition-all duration-200
                     placeholder:text-gray-400"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="place-suggestions"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-2
                     bg-white/95 backdrop-blur-xl
                     rounded-xl shadow-2xl border border-gray-200
                     max-h-80 overflow-y-auto
                     py-2"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150
                         flex items-start gap-3
                         ${index === activeIndex
                           ? 'bg-orange-50 border-l-4 border-orange-500'
                           : 'hover:bg-gray-50 border-l-4 border-transparent'
                         }`}
              onMouseDown={(e) => {
                // Prevent input blur
                e.preventDefault();
                handleSelect(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <MapPin
                className={`flex-shrink-0 mt-0.5 ${
                  index === activeIndex ? 'text-orange-500' : 'text-gray-400'
                }`}
                size={18}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {highlightMatch(suggestion.label, debouncedQuery)}
                </div>
                {suggestion.secondary && (
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {suggestion.secondary}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {isOpen && !isLoading && suggestions.length === 0 && debouncedQuery.length >= 3 && (
        <div className="absolute z-50 w-full mt-2
                       bg-white/95 backdrop-blur-xl
                       rounded-xl shadow-2xl border border-gray-200
                       py-4 px-4 text-center text-gray-500 text-sm">
          No addresses found. Try a different search.
        </div>
      )}
    </div>
  );
}
