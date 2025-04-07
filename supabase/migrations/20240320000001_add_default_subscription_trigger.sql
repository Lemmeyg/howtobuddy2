-- Function to create default subscription
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    tier,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'FREE',
    'active',
    NOW(),
    NOW() + INTERVAL '1 month'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default subscription on user creation
DROP TRIGGER IF EXISTS create_default_subscription_trigger ON auth.users;
CREATE TRIGGER create_default_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Create default subscriptions for existing users who don't have one
INSERT INTO public.subscriptions (
  user_id,
  tier,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  au.id,
  'FREE',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
FROM auth.users au
LEFT JOIN public.subscriptions s ON s.user_id = au.id
WHERE s.id IS NULL; 