-- Add template_id column to documents table
ALTER TABLE documents
ADD COLUMN template_id UUID REFERENCES templates(id) ON DELETE SET NULL;

-- Add template_variables column to store the variables used when applying the template
ALTER TABLE documents
ADD COLUMN template_variables JSONB DEFAULT '{}';

-- Create index for template_id
CREATE INDEX documents_template_id_idx ON documents(template_id);

-- Update RLS policies to allow template access
CREATE POLICY "Users can view documents with template access"
  ON documents FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = documents.template_id
      AND templates.is_public = true
    )
  );

-- Add function to track template usage
CREATE OR REPLACE FUNCTION track_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    INSERT INTO template_usage (
      template_id,
      user_id,
      document_id,
      variables
    ) VALUES (
      NEW.template_id,
      NEW.user_id,
      NEW.id,
      NEW.template_variables
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for template usage tracking
CREATE TRIGGER track_template_usage_trigger
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION track_template_usage(); 