import { createClient } from './supabase/client';

/**
 * Browser Supabase client for use in Client Components.
 * For Server Components and Server Actions, use createClient from '@/lib/supabase/server'.
 */
export const supabase = createClient();
export { createClient } from './supabase/client';
