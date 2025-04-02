import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

type OpenAIType = "summary" | "keyPoints" | "questions" | "sentiment" | "topics";

interface UseOpenAIOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function useOpenAI(options: UseOpenAIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyze = async (text: string, type: OpenAIType, requestOptions?: any) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          type,
          options: requestOptions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process request");
      }

      const data = await response.json();
      options.onSuccess?.(data.result);
      return data.result;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyze,
    isLoading,
  };
} 