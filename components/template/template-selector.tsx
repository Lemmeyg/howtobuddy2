"use client";

import { useState, useEffect } from "react";
import { Template, TemplateType, parseTemplateVariables } from "@/lib/template";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template, variables: Record<string, any>) => void;
  type?: TemplateType;
}

export function TemplateSelector({ onTemplateSelect, type }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Not authenticated");
        }

        let query = supabase
          .from("templates")
          .select("*")
          .or(`user_id.eq.${session.user.id},is_public.eq.true`);

        if (type) {
          query = query.eq("type", type);
        }

        const { data, error } = await query;

        if (error) throw error;

        setTemplates(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch templates",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [type]);

  useEffect(() => {
    if (selectedTemplate) {
      const parsedVariables = parseTemplateVariables(selectedTemplate.content);
      const initialValues: Record<string, any> = {};
      
      parsedVariables.forEach(({ name, type, required }) => {
        switch (type) {
          case "text":
            initialValues[name] = required ? "" : "";
            break;
          case "number":
            initialValues[name] = required ? 0 : 0;
            break;
          case "boolean":
            initialValues[name] = required ? false : false;
            break;
          case "select":
            const options = required.split(",");
            initialValues[name] = options[0];
            break;
        }
      });

      setVariables(initialValues);
    }
  }, [selectedTemplate]);

  const handleVariableChange = (name: string, value: any) => {
    setVariables((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderVariableInput = (name: string, type: string, required: string) => {
    switch (type) {
      case "text":
        return (
          <Input
            value={variables[name] || ""}
            onChange={(e) => handleVariableChange(name, e.target.value)}
            placeholder={required ? "Required" : "Optional"}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={variables[name] || 0}
            onChange={(e) => handleVariableChange(name, Number(e.target.value))}
            placeholder={required ? "Required" : "Optional"}
          />
        );
      case "boolean":
        return (
          <Switch
            checked={variables[name] || false}
            onCheckedChange={(checked) => handleVariableChange(name, checked)}
          />
        );
      case "select":
        const options = required.split(",");
        return (
          <Select
            value={variables[name] || options[0]}
            onValueChange={(value) => handleVariableChange(name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Select Template</Label>
        <Select
          onValueChange={(value) => {
            const template = templates.find((t) => t.id === value);
            setSelectedTemplate(template || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Template Variables</h3>
          <div className="space-y-4">
            {parseTemplateVariables(selectedTemplate.content).map(
              ({ name, type, required }) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>
                    {name} ({type})
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderVariableInput(name, type, required)}
                </div>
              )
            )}
          </div>

          <div className="mt-6">
            <Button
              onClick={() => onTemplateSelect(selectedTemplate, variables)}
              disabled={Object.values(variables).some((value) => value === "")}
            >
              Apply Template
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
} 