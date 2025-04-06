"use client";

import { useState, useEffect } from "react";
import { Template, parseTemplateVariables, renderTemplate } from "@/lib/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface TemplatePreviewProps {
  template: Template;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [preview, setPreview] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const parsedVariables = parseTemplateVariables(template.content);
    const initialValues: Record<string, any> = {};
    
    parsedVariables.forEach(({ name, type, required }) => {
      switch (type) {
        case "text":
          initialValues[name] = required ? "Sample text" : "";
          break;
        case "number":
          initialValues[name] = required ? 42 : 0;
          break;
        case "boolean":
          initialValues[name] = required ? true : false;
          break;
        case "select":
          const options = required.split(",");
          initialValues[name] = options[0];
          break;
      }
    });

    setVariables(initialValues);
  }, [template.content]);

  useEffect(() => {
    try {
      const rendered = renderTemplate(template.content, variables);
      setPreview(rendered);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to render template preview",
        variant: "destructive",
      });
    }
  }, [template.content, variables]);

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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Template Variables</h3>
        <div className="space-y-4">
          {parseTemplateVariables(template.content).map(({ name, type, required }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>
                {name} ({type})
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderVariableInput(name, type, required)}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap">{preview}</pre>
        </div>
      </Card>
    </div>
  );
} 