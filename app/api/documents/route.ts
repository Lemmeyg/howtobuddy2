import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { logError, logInfo } from "@/lib/logger";
import { createDocumentSchema } from '@/lib/schemas';
import { trackDocumentCreation } from "@/lib/usage";
import { createValidationHandler } from '@/lib/middleware/validate-request';
import { schemas } from '@/lib/validations/schemas';
import { cache, invalidateCache } from '@/lib/cache';

const querySchema = z.object({
  status: z.enum(["all", "processing", "completed", "error"]).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "title", "video_title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const GET = async (request: Request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: documents, error, count } = await query;

    if (error) {
      await logError(error, {
        userId: session.user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    await logError(error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const POST = createValidationHandler(schemas.document.create)(
  async (request, data) => {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          user_id: session.user.id,
          title: data.title,
          content: data.content,
          video_url: data.video_url,
          template_id: data.template_id,
          template_variables: data.template_variables,
        })
        .select()
        .single();

      if (error) {
        await logError(error, {
          userId: session.user.id,
          documentData: data,
        });
        return NextResponse.json(
          { error: 'Failed to create document' },
          { status: 500 }
        );
      }

      // Track document creation
      await trackDocumentCreation(session.user.id);

      // Track template usage if template was used
      if (data.template_id) {
        await supabase.rpc('track_template_usage', {
          template_id: data.template_id,
          document_id: document.id,
          user_id: session.user.id,
        });
      }

      // Invalidate user's document cache
      await invalidateCache(`user:${session.user.id}`);

      return NextResponse.json(document);
    } catch (error) {
      await logError(error as Error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
); 