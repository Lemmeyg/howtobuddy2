'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>();
  }
  return clientInstance;
} 