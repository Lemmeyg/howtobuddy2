'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>({
      options: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    // Set up auth state change listener
    clientInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        // Clear the instance to force a new client on next request
        clientInstance = null;
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
    });
  }
  return clientInstance;
} 