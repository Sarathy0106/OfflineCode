import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://leobcfruebikreiuhcvw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb2JjZnJ1ZWJpa3JlaXVoY3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0MjE2MTQsImV4cCI6MjExMDk5NzYxNH0.Qiu82DeU1PNfR7tvCC9riav-oc2mKvCxEarEwqtylz0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
