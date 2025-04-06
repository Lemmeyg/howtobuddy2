"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { TranscriptionOptions } from "@/lib/assemblyai/service";

// Form schema
const formSchema = z.object({
  videoUrl: z.string().url('Invalid URL').refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    'Only YouTube URLs are supported'
  ),
  languageCode: z.string().optional(),
  speakerDiarization: z.boolean().optional(),
  punctuate: z.boolean().optional(),
  formatText: z.boolean().optional(),
  redactPII: z.boolean().optional(),
  filterProfanity: z.boolean().optional(),
  customVocabulary: z.array(z.string()).optional(),
  customSpelling: z.record(z.string(), z.string()).optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  outputType: z.enum(['tutorial', 'guide', 'reference']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function VideoSubmissionForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customVocabulary, setCustomVocabulary] = useState<string[]>([]);
  const [newVocabulary, setNewVocabulary] = useState("");
  const [customSpelling, setCustomSpelling] = useState<Record<string, string>>({});
  const [newSpelling, setNewSpelling] = useState({ original: "", corrected: "" });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: "",
      languageCode: "en",
      speakerDiarization: false,
      punctuate: true,
      formatText: true,
      redactPII: false,
      filterProfanity: false,
      customVocabulary: [],
      customSpelling: {},
      skillLevel: 'intermediate',
      outputType: 'tutorial',
    },
  });

  const addVocabulary = () => {
    if (newVocabulary.trim()) {
      setCustomVocabulary([...customVocabulary, newVocabulary.trim()]);
      form.setValue("customVocabulary", [...customVocabulary, newVocabulary.trim()]);
      setNewVocabulary("");
    }
  };

  const removeVocabulary = (index: number) => {
    const updated = customVocabulary.filter((_, i) => i !== index);
    setCustomVocabulary(updated);
    form.setValue("customVocabulary", updated);
  };

  const addSpelling = () => {
    if (newSpelling.original.trim() && newSpelling.corrected.trim()) {
      const updated = {
        ...customSpelling,
        [newSpelling.original.trim()]: newSpelling.corrected.trim(),
      };
      setCustomSpelling(updated);
      form.setValue("customSpelling", updated);
      setNewSpelling({ original: "", corrected: "" });
    }
  };

  const removeSpelling = (original: string) => {
    const { [original]: _, ...rest } = customSpelling;
    setCustomSpelling(rest);
    form.setValue("customSpelling", rest);
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/videos/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      toast({
        title: "Success",
        description: "Video processing started. You can track progress in the dashboard.",
      });

      // Reset form
      form.reset();
      setCustomVocabulary([]);
      setCustomSpelling({});
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process video",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube Video URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="languageCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="nl">Dutch</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="pl">Polish</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="tr">Turkish</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="speakerDiarization"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Speaker Diarization</FormLabel>
                    <FormDescription>
                      Identify and label different speakers in the video
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="punctuate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Punctuation</FormLabel>
                    <FormDescription>
                      Add punctuation to the transcription
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="formatText"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Format Text</FormLabel>
                    <FormDescription>
                      Format the transcription with proper capitalization and spacing
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="redactPII"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Redact PII</FormLabel>
                    <FormDescription>
                      Remove personally identifiable information from the transcription
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="filterProfanity"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Filter Profanity</FormLabel>
                    <FormDescription>
                      Remove profanity from the transcription
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="rounded-lg border p-4">
              <FormLabel className="text-base">Custom Vocabulary</FormLabel>
              <FormDescription>
                Add specific terms that should be recognized in the transcription
              </FormDescription>
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a term"
                    value={newVocabulary}
                    onChange={(e) => setNewVocabulary(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addVocabulary}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {customVocabulary.map((term, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md border p-2">
                      <span>{term}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVocabulary(index)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <FormLabel className="text-base">Custom Spelling</FormLabel>
              <FormDescription>
                Add custom spellings for specific words
              </FormDescription>
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Original word"
                    value={newSpelling.original}
                    onChange={(e) => setNewSpelling({ ...newSpelling, original: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Corrected spelling"
                    value={newSpelling.corrected}
                    onChange={(e) => setNewSpelling({ ...newSpelling, corrected: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addSpelling}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(customSpelling).map(([original, corrected]) => (
                    <div key={original} className="flex items-center justify-between rounded-md border p-2">
                      <span>{original} → {corrected}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpelling(original)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="skillLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="outputType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select output type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="reference">Reference</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Process Video"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
} 