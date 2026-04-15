const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixRLS() {
  const query = `
    -- Allow admins to see all mentor_progress
    DROP POLICY IF EXISTS "Admins have full access to mentor_progress" ON mentor_progress;
    CREATE POLICY "Admins have full access to mentor_progress" ON mentor_progress FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'moderator' OR profiles.role = 'trainer buddy'))
    );

    -- Allow users to see their own mentor_progress
    DROP POLICY IF EXISTS "Users can read their own mentor_progress" ON mentor_progress;
    CREATE POLICY "Users can read their own mentor_progress" ON mentor_progress FOR SELECT USING (auth.uid() = user_id);
    
    -- Allow admins to see all assessment_logs
    DROP POLICY IF EXISTS "Admins have full access to assessment_logs" ON assessment_logs;
    CREATE POLICY "Admins have full access to assessment_logs" ON assessment_logs FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'moderator' OR profiles.role = 'trainer buddy'))
    );

    -- Allow users to see their own assessment_logs
    DROP POLICY IF EXISTS "Users can read their own assessment_logs" ON assessment_logs;
    CREATE POLICY "Users can read their own assessment_logs" ON assessment_logs FOR SELECT USING (auth.uid() = user_id);
  `;

  // We can't execute raw SQL via standard client unless we use rpc.
  // BUT we don't have a run_sql rpc.
  console.log("We need to use postgres connection or REST API to create policies.");
}

fixRLS();
