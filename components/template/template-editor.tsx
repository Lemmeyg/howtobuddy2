"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Template, TemplateType, parseTemplateVariables } from "@/lib/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum([TemplateType.SUMMARY, TemplateType.TUTORIAL, TemplateType.CHEATSHEET, TemplateType.TRANSCRIPT]),
  content: z.string().min(1, "Content is required"),
  is_public: z.boolean().default(false),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateEditorProps {
  template?: Template;
  onSubmit: (values: TemplateFormValues) => Promise<void>;
}

export function TemplateEditor({ template, onSubmit }: TemplateEditorProps) {
  const [variables, setVariables] = useState<Array<{ name: string; type: string }>>([]);
  const { toast } = useToast();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      type: template?.type || TemplateType.SUMMARY,
      content: template?.content || "",
      is_public: template?.is_public || false,
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "content") {
        const parsedVariables = parseTemplateVariables(value.content || "");
        setVariables(parsedVariables);
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  const handleSubmit = async (values: TemplateFormValues) => {
    try {
      await onSubmit(values);
      toast({
        title: "Success",
        description: template ? "Template updated" : "Template created",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Template name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TemplateType.SUMMARY}>Summary</SelectItem>
                  <SelectItem value={TemplateType.TUTORIAL}>Tutorial</SelectItem>
                  <SelectItem value={TemplateType.CHEATSHEET}>Cheatsheet</SelectItem>
                  <SelectItem value={TemplateType.TRANSCRIPT}>Transcript</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Template content with variables in {{variable:type:required}} format"
                  className="min-h-[200px] font-mono"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Use variables in the format: {"{{variable:type:required}}"}
                <br />
                Types: text, number, boolean, select
                <br />
                Example: {"{{title:text:true}} {{difficulty:select:easy,medium,hard}}"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Template</FormLabel>
                <FormDescription>
                  Make this template available to all users
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {variables.length > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">Detected Variables</h3>
            <div className="space-y-2">
              {variables.map((variable) => (
                <div
                  key={variable.name}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                >
                  <span className="font-mono">{variable.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {variable.type}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button type="submit">
          {template ? "Update Template" : "Create Template"}
        </Button>
      </form>
    </Form>
  );
} 