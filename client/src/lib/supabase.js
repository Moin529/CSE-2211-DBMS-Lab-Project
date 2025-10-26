import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;
try {
	if (typeof supabaseUrl === 'string' && supabaseUrl && typeof supabaseAnonKey === 'string' && supabaseAnonKey) {
		client = createClient(supabaseUrl, supabaseAnonKey);
	} else {
		console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Pages will render without data.');
	}
} catch (err) {
	console.error('[Supabase] Failed to initialize client:', err);
}

export const supabase = client;