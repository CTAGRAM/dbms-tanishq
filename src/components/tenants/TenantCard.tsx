import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Briefcase, Edit } from "lucide-react";

interface TenantCardProps {
  tenant: {
    tenant_id: string;
    occupation: string | null;
    annual_income: number | null;
    profiles: {
      full_name: string;
      email: string;
      phone: string | null;
      avatar_url: string | null;
    } | null;
  };
  onEdit: () => void;
}

export const TenantCard = ({ tenant, onEdit }: TenantCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const profile = tenant.profiles;
  if (!profile) return null;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-lg">{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                {tenant.occupation && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Briefcase className="h-3 w-3" />
                    {tenant.occupation}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.phone}</span>
                </div>
              )}
            </div>
            {tenant.annual_income && (
              <div className="mt-3">
                <Badge variant="secondary">
                  ${(tenant.annual_income / 1000).toFixed(0)}k annual income
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
