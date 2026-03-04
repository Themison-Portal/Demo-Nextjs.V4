// /**
//  * Supabase Admin Client
//  * Use ONLY for privileged operations that bypass RLS
//  * Examples: creating organizations, audit logs, system operations
//  *
//  * WARNING: This client has superuser access. Use with caution.
//  */

// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// if (!supabaseUrl || !supabaseServiceRoleKey) {
//   throw new Error('Missing Supabase environment variables for admin client');
// }

// export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
//   auth: {
//     autoRefreshToken: false,
//     persistSession: false,
//   },
// });
