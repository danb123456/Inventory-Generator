import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lqckmlexslwrdfotsbxx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxY2ttbGV4c2x3cmRmb3RzYnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDI5ODIsImV4cCI6MjA4ODAxODk4Mn0.wsrqknhCHjmp_GpXalAIDy9q18fA-c8MWz3QRnyk3_g';

if (!import.meta.env.VITE_SUPABASE_URL || (!import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)) {
  console.warn('Supabase credentials missing in environment variables. Using hardcoded fallbacks for development.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
