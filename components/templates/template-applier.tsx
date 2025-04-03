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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { renderTemplate } from "@/lib/template";

interface TemplateApplierProps {
  templateId: string;
  documentId: string;
  userId: string;
  onApply: (content: string) => void;
}

export function TemplateApplier({
  templateId,
  documentId,
  userId,
  onApply,
}: TemplateApplierProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Fetch template
  const { data: template, isLoading } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      return response.json();
    },
  });

  // Handle variable value change
  const handleVariableChange = (variable: string, value: string) => {
    setVariables((prev) => ({ ...prev, [variable]: value }));
  };

  // Generate preview content
  const previewContent = template
    ? renderTemplate(template.content, variables)
    : null;

  if (isLoading) {
    return <div>Loading template...</div>;
  }

  if (!template) {
    return <div>Template not found</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apply Template</CardTitle>
          <CardDescription>
            Apply this template to your document.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Template Variables</Label>
            <div className="grid gap-4 md:grid-cols-2">
              {template.variables.map((variable) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={variable}>{variable}</Label>
                  <Input
                    id={variable}
                    value={variables[variable] || ""}
                    onChange={(e) =>
                      handleVariableChange(variable, e.target.value)
                    }
                    placeholder={`Enter value for ${variable}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="rounded-md border p-4">
              <div className="prose max-w-none">
                {previewContent || "No preview available"}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={async () => {
              try {
                const response = await fetch(`/api/templates/${templateId}/apply`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    documentId,
                    variables,
                  }),
                });

                if (!response.ok) throw new Error("Failed to apply template");

                const result = await response.json();
                onApply(result.content);
              } catch (error) {
                console.error("Error applying template:", error);
              }
            }}
          >
            Apply Template
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 