import { createSupabaseServer } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

export interface UsageStats {
  documentsThisMonth: number;
  totalVideoDuration: number;
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
  const supabase = createSupabaseServer();

  try {
    // Get current month's usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, created_at, video_duration')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (docError) {
      logError(new Error('Failed to fetch documents'), { userId, error: docError });
      return {
        documentsThisMonth: 0,
        totalVideoDuration: 0,
      };
    }

    const totalVideoDuration = documents.reduce((total, doc) => total + (doc.video_duration || 0), 0);

    return {
      documentsThisMonth: documents.length,
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
  const supabase = createSupabaseServer();

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
  const supabase = createSupabaseServer();

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