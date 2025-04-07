-- First, drop existing foreign key constraints
ALTER TABLE documents
DROP CONSTRAINT IF EXISTS documents_user_id_fkey;

-- Ensure public.users table has correct reference to auth.users
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_id_fkey,
ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Update documents table to reference public.users
ALTER TABLE documents
ADD CONSTRAINT documents_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

-- Create trigger to ensure user exists in public.users when creating from auth.users
CREATE OR REPLACE FUNCTION ensure_user_in_public_users()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS ensure_user_in_public_users_trigger ON auth.users;
CREATE TRIGGER ensure_user_in_public_users_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_in_public_users();

-- Sync existing users
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM auth.users
ON CONFLICT (id) DO NOTHING; 