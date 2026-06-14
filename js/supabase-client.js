const SUPABASE_URL = 'https://iqiplouocwzkjfohrykm.supabase.co';
const ANON_KEY = 'sb_publishable_JpS1PXdu__YwGYpiLKVRNg_3L_ac-uH';
const USER_ID = '11111111-1111-1111-1111-111111111111';

// We assume Supabase JS is loaded via CDN before this script
const supabaseClient = supabase.createClient(SUPABASE_URL, ANON_KEY);
