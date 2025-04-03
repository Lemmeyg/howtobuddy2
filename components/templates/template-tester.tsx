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
import { Badge } from "@/components/ui/badge";
import { renderTemplate } from "@/lib/template";

interface TemplateTesterProps {
  templateId: string;
  userId: string;
}

export function TemplateTester({ templateId, userId }: TemplateTesterProps) {
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
          <CardTitle>Test Template</CardTitle>
          <CardDescription>
            Test your template with different variable values.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Variables</Label>
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
                const response = await fetch(`/api/templates/${templateId}/test`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ variables }),
                });

                if (!response.ok) throw new Error("Failed to test template");

                const result = await response.json();
                console.log("Test result:", result);
              } catch (error) {
                console.error("Error testing template:", error);
              }
            }}
          >
            Test Template
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 