// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coueycspktdclpeoyzlq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvdWV5Y3Nwa3RkY2xwZW95emxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTI3NDcsImV4cCI6MjA2NTk4ODc0N30.ToMWhK8kivptn5jPzMKX3DAmkIJB-S6AdHndEXFqINI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
