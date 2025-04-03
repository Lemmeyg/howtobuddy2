import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Template } from "@/lib/template";

interface TemplateListProps {
  userId: string;
}

export function TemplateList({ userId }: TemplateListProps) {
  const router = useRouter();
  const [type, setType] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean | undefined>(undefined);

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates", userId, type, isPublic],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (isPublic !== undefined) params.append("isPublic", isPublic.toString());

      const response = await fetch(`/api/templates?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  // Handle template deletion
  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      // Invalidate templates query
      router.refresh();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template");
    }
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="SUMMARY">Summary</SelectItem>
              <SelectItem value="TRANSCRIPT">Transcript</SelectItem>
              <SelectItem value="NOTES">Notes</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={isPublic?.toString()}
            onValueChange={(value) =>
              setIsPublic(value === "" ? undefined : value === "true")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All visibility</SelectItem>
              <SelectItem value="true">Public</SelectItem>
              <SelectItem value="false">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => router.push("/templates/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template: Template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{template.name}</CardTitle>
                <Badge variant={template.isPublic ? "default" : "secondary"}>
                  {template.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Type: {template.type}
                </div>
                <div className="text-sm text-muted-foreground">
                  Variables: {template.variables.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Version: {template.version}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/templates/${template.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(template.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 