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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const addMarkersToMap = (propertiesData: Property[]) => {
    if (!map.current || !propertiesData) return;

    console.log('📍 Adding markers to map:', propertiesData.length);
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
    // Prevent re-initialization in strict mode
    if (initializedRef.current) {
      console.log('⏭️ Map already initialized, skipping...');
      return;
    }

    let isMounted = true;
    let channelSubscribed = false;

    const initMap = async () => {
      try {
        console.log('🗺️ Starting map initialization...');
        
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

        if (!isMounted) {
          console.log('⚠️ Component unmounted, aborting...');
          return;
        }

        console.log(`📊 Properties fetched: ${propertiesData?.length || 0} properties`);
        
        if (!propertiesData || propertiesData.length === 0) {
          console.log('⚠️ No properties with coordinates');
          setProperties([]);
          setLoading(false);
          return;
        }

        setProperties(propertiesData);

        // Wait for container to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!mapContainer.current) {
          console.error('❌ Map container still not available after wait');
          setError('Map container not available');
          setLoading(false);
          return;
        }

        // Initialize Mapbox
        console.log('🔑 Setting Mapbox access token');
        mapboxgl.accessToken = keyData.apiKey;

        // Calculate center point from properties
        const avgLat = propertiesData.reduce((sum, p) => sum + (p.latitude || 0), 0) / propertiesData.length;
        const avgLng = propertiesData.reduce((sum, p) => sum + (p.longitude || 0), 0) / propertiesData.length;

        console.log(`📍 Map center: [${avgLng}, ${avgLat}]`);

        // Create the map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [avgLng, avgLat],
          zoom: 4,
          preserveDrawingBuffer: true,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Wait for map to load before adding markers
        map.current.on('load', () => {
          if (!isMounted) {
            console.log('⚠️ Component unmounted during map load');
            return;
          }
          console.log('✅ Map loaded successfully!');
          addMarkersToMap(propertiesData);
          setLoading(false);
          initializedRef.current = true;
        });

        // Handle errors
        map.current.on('error', (e) => {
          console.error('❌ Map error:', e);
          setError('Map failed to load');
        });

      } catch (error) {
        console.error('❌ Map initialization error:', error);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : "Failed to load map";
          setError(errorMessage);
          toast({
            title: "Map Error",
            description: errorMessage,
            variant: "destructive",
          });
          setLoading(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initMap();
    }, 100);

    // Set up real-time subscription - only update markers
    const propertyChannel = supabase
      .channel('map-properties-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'property'
      }, async () => {
        if (!initializedRef.current || !map.current) {
          console.log('⏭️ Map not ready, skipping update...');
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
            console.log(`📊 Updating markers: ${updatedProperties.length} properties`);
            setProperties(updatedProperties);
            addMarkersToMap(updatedProperties);
          }
        } catch (error) {
          console.error('❌ Error updating properties:', error);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelSubscribed = true;
          console.log('✅ Real-time subscription active');
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      console.log('🔌 Cleaning up map component...');
      
      if (channelSubscribed) {
        supabase.removeChannel(propertyChannel);
      }
      
      // Don't remove the map on cleanup - let it persist
      clearMarkers();
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
        {/* Always render the container to avoid recreation */}
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="h-[400px] rounded-lg"
            style={{ 
              visibility: loading || error || properties.length === 0 ? 'hidden' : 'visible',
              position: loading || error || properties.length === 0 ? 'absolute' : 'relative'
            }}
          />
          
          {loading && (
            <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
          
          {!loading && error && (
            <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <MapPin className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-sm text-destructive font-medium">Map Error</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          )}
          
          {!loading && !error && properties.length === 0 && (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
