import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logError } from '@/lib/sentry'

type SchemaType = z.ZodType<any, any>

export async function validateRequest(
  request: NextRequest,
  schema: SchemaType
): Promise<{ data: any; error: null } | { data: null; error: string }> {
  try {
    let body

    // Try to parse JSON body
    try {
      body = await request.json()
    } catch (e) {
      return {
        data: null,
        error: 'Invalid JSON body',
      }
    }

    // Validate against schema
    const result = schema.safeParse(body)

    if (!result.success) {
      // Format validation errors
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      // Log validation error
      await logError(new Error('Validation failed'), {
        errors,
        path: request.nextUrl.pathname,
        method: request.method,
      })

      return {
        data: null,
        error: JSON.stringify(errors),
      }
    }

    return {
      data: result.data,
      error: null,
    }
  } catch (error) {
    // Log unexpected errors
    await logError(error as Error, {
      path: request.nextUrl.pathname,
      method: request.method,
    })

    return {
      data: null,
      error: 'Internal server error',
    }
  }
}

// Helper function to create a validation handler
export function createValidationHandler(schema: SchemaType) {
  return async function handler(
    request: NextRequest,
    handler: (data: any) => Promise<NextResponse>
  ) {
    const { data, error } = await validateRequest(request, schema)

    if (error) {
      return NextResponse.json(
        { error: JSON.parse(error) },
        { status: 400 }
      )
    }

    return handler(data)
  }
} 