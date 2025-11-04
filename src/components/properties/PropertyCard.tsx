import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MapPin, Home } from "lucide-react";

interface PropertyCardProps {
  property: {
    property_id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    type: string;
    status: string;
    image_url?: string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export const PropertyCard = ({ property, onEdit, onDelete }: PropertyCardProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "maintenance":
        return "destructive";
      default:
        return "outline";
    }
  };

  const defaultImage = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop";

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.image_url || defaultImage}
          alt={property.address}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 right-3">
          <Badge variant={getStatusVariant(property.status)} className="capitalize">
            {property.status}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-lg line-clamp-1">
            {property.address}
          </h3>
          <p className="text-white/90 text-sm flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {property.city}, {property.state} {property.zip_code}
          </p>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="h-4 w-4" />
            <span className="capitalize">{property.type}</span>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
