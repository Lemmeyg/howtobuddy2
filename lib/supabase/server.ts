'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
}

export async function getSession() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getUser() {
  try {
    const session = await getSession();
    return session?.user ?? null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Remove deprecated function
// export const createSupabaseClient = () => {
//   console.log('⚠️ Using deprecated createSupabaseClient, please migrate to createSupabaseServer');
//   return getSupabaseServerClient();
// }; 