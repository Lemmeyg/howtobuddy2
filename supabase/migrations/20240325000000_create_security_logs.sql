-- Create security_logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS security_logs_user_id_idx ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS security_logs_event_type_idx ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS security_logs_created_at_idx ON security_logs(created_at);

-- Create RLS policies
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all security logs"
  ON security_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE id IN (
        SELECT user_id FROM profiles WHERE is_admin = true
      )
    )
  );

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT,
  details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO security_logs (
    event_type,
    user_id,
    ip_address,
    user_agent,
    status,
    details
  ) VALUES (
    event_type,
    user_id,
    ip_address,
    user_agent,
    status,
    details
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql; 