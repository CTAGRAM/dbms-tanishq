import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";

export const OccupancyMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    // In a real implementation, you would use Mapbox API key from secrets
    // For now, showing a placeholder message
    return () => {
      map.current?.remove();
    };
  }, [apiKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Property Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Mapbox integration available
            </p>
            <p className="text-xs text-muted-foreground">
              Add MAPBOX_API_KEY to enable interactive property map
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
