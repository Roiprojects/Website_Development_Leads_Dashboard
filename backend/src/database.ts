import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjqbssbilioanqndsuyo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWJzc2JpbGlvYW5xbmRzdXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODc2NjYsImV4cCI6MjA4ODg2MzY2Nn0.MFCLd5F15EzKx2b2wUKlCIcS5nyd8k81uAulIZl3_yo';

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connected to Supabase cloud database.');

// Helper migration: These functions are intentionally deprecated as we migrate to Supabase ORM.
export const query = async (sql: string, params: any[] = []): Promise<any[]> => {
  throw new Error('Raw queries are not supported with Supabase. Please use Supabase query builder.');
};

export const run = async (sql: string, params: any[] = []): Promise<any> => {
  throw new Error('Raw queries are not supported with Supabase. Please use Supabase query builder.');
};
