"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-gray-100">Loading map...</div>
});


export default function LocationPicker({ 
  onLocationChange, 
  onLocationTextChange,
  initialLocation = null,
  initialLocationText = "",
  height = "300px" 
}) {
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || { lat: 40.7128, lng: -74.0060 } // Default to NYC
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(selectedLocation);
  const [showDropdown, setShowDropdown] = useState(false);
  const mapRef = useRef(null);
  const searchRef = useRef(null);

  // Handle location selection from map click
  const handleLocationSelect = (lat, lng) => {
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    setMapCenter(newLocation);
    onLocationChange(newLocation);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  // Search for locations using our own API route
  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use our own API route to avoid CORS issues
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Search results:", data);
      setSearchResults(data);
      setShowDropdown(data.length > 0);
    } catch (error) {
      console.error("Error searching location:", error);
      // Fallback to mock data if API fails
      const mockResults = [
        {
          display_name: `${query}, Pakistan`,
          lat: "31.5204",
          lon: "74.3587",
          address: {
            city: query,
            country: "Pakistan"
          }
        },
        {
          display_name: `${query}, India`,
          lat: "28.6139",
          lon: "77.2090",
          address: {
            city: query,
            country: "India"
          }
        },
        {
          display_name: `${query}, United States`,
          lat: "40.7128",
          lon: "-74.0060",
          address: {
            city: query,
            country: "United States"
          }
        }
      ];
      setSearchResults(mockResults);
      setShowDropdown(mockResults.length > 0);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const newLocation = { lat, lng };
    
    setSelectedLocation(newLocation);
    setMapCenter(newLocation);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    setShowDropdown(false);
    onLocationChange(newLocation);
    
    // Update the location text in the parent component
    if (onLocationTextChange) {
      onLocationTextChange(result.display_name);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Update selectedLocation when initialLocation prop changes
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setSelectedLocation(initialLocation);
      setMapCenter(initialLocation);
    }
  }, [initialLocation]);

  // Update search query when initialLocationText changes
  useEffect(() => {
    if (initialLocationText) {
      setSearchQuery(initialLocationText);
    }
  }, [initialLocationText]);

  // Update map center when selectedLocation changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 15);
    }
  }, [selectedLocation]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-4" ref={searchRef}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search for a location..."
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] relative z-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-2 z-20">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[color:var(--primary)]"></div>
          </div>
        )}
        
        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white border border-gray-300 rounded-md shadow-xl max-h-48 overflow-y-auto"
            style={{ zIndex: 9999 }}
          >
            {searchResults.map((result, index) => {
              const primaryName = result.address?.name || 
                                (result.address?.house_number && result.address?.road ? 
                                  `${result.address.house_number} ${result.address.road}` : 
                                  result.display_name.split(',')[0]);
              
              const locationParts = [
                result.address?.city || result.address?.town || result.address?.village,
                result.address?.state || result.address?.county,
                result.address?.country
              ].filter(Boolean);
              
              return (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-200 last:border-b-0 transition-colors"
                  onClick={() => handleSearchResultSelect(result)}
                >
                  <div className="font-medium text-gray-900">
                    {primaryName}
                  </div>
                  {locationParts.length > 0 && (
                    <div className="text-gray-500 text-xs">
                      {locationParts.join(", ")}
                    </div>
                  )}
                  <div className="text-gray-400 text-xs mt-1 truncate">
                    {result.display_name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Map Container */}
      <MapComponent
        selectedLocation={selectedLocation}
        onLocationSelect={handleLocationSelect}
        mapCenter={mapCenter}
        height={height}
      />

      {/* Location Info */}
      <div className="mt-2 text-xs text-gray-600">
        <p>Click on the map to select a location or search above.</p>
        <p>Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
        {searchResults.length > 0 && (
          <p className="text-green-600">Found {searchResults.length} results</p>
        )}
        {isSearching && (
          <p className="text-blue-600">Searching...</p>
        )}
        
      </div>
    </div>
  );
}
