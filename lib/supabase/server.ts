import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './types';

export function getSupabaseServerClient() {
  return createServerComponentClient<Database>({ cookies });
}

// Keep the old client for backwards compatibility during migration
export const createSupabaseClient = () => {
  console.log('⚠️ Using deprecated createSupabaseClient, please migrate to createSupabaseServer');
  return getSupabaseServerClient();
}; 