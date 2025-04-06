-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(document_id, version_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS document_versions_document_id_idx ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS document_versions_created_at_idx ON document_versions(created_at);

-- Create RLS policies
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their documents"
  ON document_versions FOR SELECT
  USING (
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT user_id FROM documents WHERE id = document_id
    )
  );

CREATE POLICY "Users can create versions of their documents"
  ON document_versions FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    auth.uid() IN (
      SELECT user_id FROM documents WHERE id = document_id
    )
  );

-- Create function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(document_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version_number) + 1 FROM document_versions WHERE document_id = $1),
    1
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to create new version
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO document_versions (
    document_id,
    version_number,
    content,
    metadata,
    created_by
  ) VALUES (
    NEW.id,
    get_next_version_number(NEW.id),
    NEW.content,
    NEW.metadata,
    NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version creation
CREATE TRIGGER create_document_version_trigger
  AFTER UPDATE OF content, metadata ON documents
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.metadata IS DISTINCT FROM NEW.metadata)
  EXECUTE FUNCTION create_document_version(); 