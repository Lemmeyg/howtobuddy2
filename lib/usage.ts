import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

export interface UsageStats {
  documentsThisMonth: number;
  totalVideoDuration: number;
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get documents created in the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: documents, error } = await supabase
      .from('documents')
      .select('video_duration')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      // If it's not a table existence error, log it
      if (!error.message?.includes('does not exist')) {
        logError(new Error('Failed to fetch documents'), { userId, error });
      }
      return {
        documentsThisMonth: 0,
        totalVideoDuration: 0,
      };
    }

    const totalVideoDuration = (documents || []).reduce((total, doc) => total + (doc.video_duration || 0), 0);

    return {
      documentsThisMonth: documents?.length || 0,
      totalVideoDuration,
    };
  } catch (error) {
    logError(new Error('Error getting usage stats'), { userId, error });
    return {
      documentsThisMonth: 0,
      totalVideoDuration: 0,
    };
  }
}

export async function trackDocumentCreation(userId: string) {
  const supabase = getSupabaseServerClient();

  try {
    await supabase.from("usage_stats").upsert({
      user_id: userId,
      documents_created: 1,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    logError(new Error('Error tracking document creation'), { userId, error });
  }
}

export async function trackVideoProcessing(userId: string, duration: number) {
  const supabase = getSupabaseServerClient();

  try {
    await supabase.from("usage_stats").upsert({
      user_id: userId,
      video_minutes_processed: Math.ceil(duration / 60),
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    logError(new Error('Error tracking video processing'), { userId, error });
  }
} 