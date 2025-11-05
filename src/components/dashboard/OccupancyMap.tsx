import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Property {
  property_id: string;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  type: string;
  status: string;
}

export const OccupancyMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const { toast } = useToast();

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const addMarkersToMap = (propertiesData: Property[]) => {
    if (!map.current || !propertiesData) return;

    console.log('Adding markers to map:', propertiesData.length);
    clearMarkers();

    propertiesData.forEach((property) => {
      if (property.latitude && property.longitude && map.current) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2">
            <h3 class="font-semibold">${property.address}</h3>
            <p class="text-sm text-muted-foreground">${property.city}, ${property.state}</p>
            <p class="text-sm"><span class="font-medium">Type:</span> ${property.type}</p>
            <p class="text-sm"><span class="font-medium">Status:</span> ${property.status}</p>
          </div>`
        );

        const marker = new mapboxgl.Marker({
          color: property.status === 'active' ? '#3b82f6' : '#94a3b8'
        })
          .setLngLat([property.longitude, property.latitude])
          .setPopup(popup)
          .addTo(map.current);

        markersRef.current.push(marker);
      }
    });
  };

  useEffect(() => {
    // Prevent re-initialization
    if (initializedRef.current) {
      console.log('Map already initialized, skipping init...');
      return;
    }

    let isMounted = true;

    const initMap = async () => {
      try {
        console.log('Starting map initialization...');
        
        // Fetch Mapbox API key
        const { data: keyData, error: keyError } = await supabase.functions.invoke('get-mapbox-key');
        
        if (keyError) throw keyError;
        if (!keyData?.apiKey) throw new Error('No API key received');

        // Fetch properties with coordinates
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('property')
          .select('property_id, address, city, state, latitude, longitude, type, status')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (propertiesError) throw propertiesError;

        if (!isMounted) return;

        console.log('Properties fetched:', propertiesData?.length, 'properties');
        
        if (!propertiesData || propertiesData.length === 0) {
          console.log('No properties with coordinates');
          setProperties([]);
          setLoading(false);
          return;
        }

        setProperties(propertiesData);

        if (!mapContainer.current) {
          console.log('Map container not available');
          setLoading(false);
          return;
        }

        // Initialize Mapbox
        console.log('Setting Mapbox access token');
        mapboxgl.accessToken = keyData.apiKey;

        // Calculate center point from properties
        const avgLat = propertiesData.reduce((sum, p) => sum + (p.latitude || 0), 0) / propertiesData.length;
        const avgLng = propertiesData.reduce((sum, p) => sum + (p.longitude || 0), 0) / propertiesData.length;

        console.log('Initializing map at:', avgLng, avgLat);

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [avgLng, avgLat],
          zoom: 4,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Wait for map to load before adding markers
        map.current.on('load', () => {
          if (!isMounted) return;
          console.log('✅ Map loaded successfully');
          addMarkersToMap(propertiesData);
          setLoading(false);
          initializedRef.current = true;
        });

        // Handle errors
        map.current.on('error', (e) => {
          console.error('❌ Map error:', e);
        });

      } catch (error) {
        console.error('❌ Map initialization error:', error);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : "Failed to load map";
          toast({
            title: "Map Error",
            description: errorMessage,
            variant: "destructive",
          });
          setLoading(false);
        }
      }
    };

    initMap();

    // Set up real-time subscription - only update markers
    const propertyChannel = supabase
      .channel('map-properties-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'property'
      }, async () => {
        if (!initializedRef.current) {
          console.log('Map not initialized yet, skipping update...');
          return;
        }

        console.log('🔄 Property changed, updating markers...');
        
        try {
          // Fetch updated properties
          const { data: updatedProperties, error } = await supabase
            .from('property')
            .select('property_id, address, city, state, latitude, longitude, type, status')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

          if (error) throw error;

          if (updatedProperties && isMounted && map.current) {
            console.log('Updating markers with', updatedProperties.length, 'properties');
            setProperties(updatedProperties);
            addMarkersToMap(updatedProperties);
          }
        } catch (error) {
          console.error('Error updating properties:', error);
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      console.log('🔌 Cleaning up map subscriptions...');
      supabase.removeChannel(propertyChannel);
    };
  }, [toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Property Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : properties.length === 0 ? (
          <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No properties with coordinates found
              </p>
              <p className="text-xs text-muted-foreground">
                Add latitude and longitude to your properties to see them on the map
              </p>
            </div>
          </div>
        ) : (
          <div ref={mapContainer} className="h-[400px] rounded-lg" />
        )}
      </CardContent>
    </Card>
  );
};
