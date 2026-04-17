-- Enable RLS on all tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS syllabus_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentor_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assessment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS simulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mentor_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS summary_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS syllabus_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certification_attempts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is an admin/staff
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'buddy', 'trainer buddy', 'tech', 'bd', 'cs')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-------------------------------------------------------
-- PROFILES POLICIES
-------------------------------------------------------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles." ON profiles;

CREATE POLICY "Users can view their own profile." ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles." ON profiles 
FOR SELECT USING (is_admin());

CREATE POLICY "Users can update own profile." ON profiles 
FOR UPDATE USING (auth.uid() = id);

-------------------------------------------------------
-- SYLLABUS CONTENT & FOLDERS
-------------------------------------------------------
CREATE POLICY "Anyone authenticated can view syllabus content" ON syllabus_content
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins have full access to syllabus content" ON syllabus_content
FOR ALL USING (is_admin());

CREATE POLICY "Anyone authenticated can view syllabus folders" ON syllabus_folders
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins have full access to syllabus folders" ON syllabus_folders
FOR ALL USING (is_admin());

-------------------------------------------------------
-- MENTOR PROGRESS
-------------------------------------------------------
CREATE POLICY "Users can view own progress" ON mentor_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON mentor_progress
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON mentor_progress
FOR SELECT USING (is_admin());

-------------------------------------------------------
-- LOGS (Activity, Assessment, Simulation)
-------------------------------------------------------
CREATE POLICY "Users can view own activity logs" ON mentor_activity_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON mentor_activity_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" ON mentor_activity_logs
FOR SELECT USING (is_admin());

-- Similar for assessment_logs
CREATE POLICY "Users can view own assessment logs" ON assessment_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment logs" ON assessment_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessment logs" ON assessment_logs
FOR SELECT USING (is_admin());

-- Similar for simulation_logs
CREATE POLICY "Users can view own simulation logs" ON simulation_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulation logs" ON simulation_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all simulation logs" ON simulation_logs
FOR SELECT USING (is_admin());

-------------------------------------------------------
-- SUMMARY AUDITS
-------------------------------------------------------
CREATE POLICY "Users can view own audits" ON summary_audits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audits" ON summary_audits
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to audits" ON summary_audits
FOR ALL USING (is_admin());

-------------------------------------------------------
-- CERTIFICATION ATTEMPTS
-------------------------------------------------------
CREATE POLICY "Users can view own cert attempts" ON certification_attempts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cert attempts" ON certification_attempts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all cert attempts" ON certification_attempts
FOR SELECT USING (is_admin());
