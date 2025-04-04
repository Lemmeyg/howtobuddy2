import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, PersonStanding, Calendar } from "lucide-react";

interface Entity {
  text: string;
  entity_type: string;
  confidence: number;
}

interface EntityListProps {
  entities: Entity[];
}

export function EntityList({ entities }: EntityListProps) {
  const entityTypes = {
    organization: { icon: Building2, label: "Organization" },
    location: { icon: Globe, label: "Location" },
    person: { icon: PersonStanding, label: "Person" },
    date: { icon: Calendar, label: "Date" },
  };

  const groupedEntities = entities.reduce((acc, entity) => {
    const type = entity.entity_type.toLowerCase();
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(entity);
    return acc;
  }, {} as Record<string, Entity[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(groupedEntities).map(([type, entities]) => {
        const typeInfo = entityTypes[type as keyof typeof entityTypes] || {
          icon: null,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        };

        return (
          <Card key={type} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {typeInfo.icon && <typeInfo.icon className="h-4 w-4" />}
              <h3 className="font-medium">{typeInfo.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {entities.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {entities.map((entity) => (
                <div
                  key={entity.text}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{entity.text}</span>
                  <Badge variant="outline">
                    {Math.round(entity.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
} 