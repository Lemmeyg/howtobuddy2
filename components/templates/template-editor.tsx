import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { Template } from "@/lib/template";
import { renderTemplate } from "@/lib/template";

interface TemplateEditorProps {
  templateId?: string;
  userId: string;
}

export function TemplateEditor({ templateId, userId }: TemplateEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "CUSTOM",
    content: "",
    variables: [] as string[],
    isPublic: false,
  });

  // Fetch template if editing
  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      return response.json();
    },
    enabled: !!templateId,
  });

  // Initialize form data from template
  useState(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        type: template.type,
        content: template.content,
        variables: template.variables,
        isPublic: template.isPublic,
      });
    }
  }, [template]);

  // Create/Update template mutation
  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = templateId
        ? `/api/templates/${templateId}`
        : "/api/templates";
      const method = templateId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      router.push("/templates");
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  // Handle variable addition
  const handleAddVariable = () => {
    const newVariable = `variable${formData.variables.length + 1}`;
    setFormData((prev) => ({
      ...prev,
      variables: [...prev.variables, newVariable],
    }));
  };

  // Handle variable removal
  const handleRemoveVariable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  };

  // Handle variable value change
  const handleVariableChange = (variable: string, value: string) => {
    setVariables((prev) => ({ ...prev, [variable]: value }));
  };

  // Generate preview content
  const previewContent = renderTemplate(formData.content, variables);

  if (isLoadingTemplate) {
    return <div>Loading template...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {templateId ? "Edit Template" : "Create Template"}
          </CardTitle>
          <CardDescription>
            Create or edit a template for your documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUMMARY">Summary</SelectItem>
                <SelectItem value="TRANSCRIPT">Transcript</SelectItem>
                <SelectItem value="NOTES">Notes</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              required
              className="min-h-[200px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variables</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariable}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Variable
              </Button>
            </div>
            <div className="space-y-2">
              {formData.variables.map((variable, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={variable}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        variables: prev.variables.map((v, i) =>
                          i === index ? e.target.value : v
                        ),
                      }))
                    }
                    placeholder="Variable name"
                  />
                  <Input
                    value={variables[variable] || ""}
                    onChange={(e) =>
                      handleVariableChange(variable, e.target.value)
                    }
                    placeholder="Test value"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVariable(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isPublic: checked }))
              }
            />
            <Label htmlFor="isPublic">Make template public</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/templates")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Template"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your template will look.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {previewContent || "No preview available"}
          </div>
        </CardContent>
      </Card>
    </form>
  );
} 