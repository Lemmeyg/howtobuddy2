-- Create templates table
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('summary', 'tutorial', 'cheatsheet', 'transcript')),
  content TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_versions table
CREATE TABLE template_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_usage table
CREATE TABLE template_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  variables JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX templates_user_id_idx ON templates(user_id);
CREATE INDEX templates_type_idx ON templates(type);
CREATE INDEX templates_is_public_idx ON templates(is_public);
CREATE INDEX template_versions_template_id_idx ON template_versions(template_id);
CREATE INDEX template_usage_template_id_idx ON template_usage(template_id);
CREATE INDEX template_usage_user_id_idx ON template_usage(user_id);
CREATE INDEX template_usage_document_id_idx ON template_usage(document_id);

-- Create RLS policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Users can view their own templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates"
  ON templates FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- Template versions policies
CREATE POLICY "Users can view template versions"
  ON template_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_versions.template_id
      AND (templates.user_id = auth.uid() OR templates.is_public = true)
    )
  );

CREATE POLICY "Users can create template versions"
  ON template_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = template_versions.template_id
      AND templates.user_id = auth.uid()
    )
  );

-- Template usage policies
CREATE POLICY "Users can view their own template usage"
  ON template_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create template usage"
  ON template_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle template versioning
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO template_versions (
    template_id,
    version,
    content,
    variables
  ) VALUES (
    NEW.id,
    NEW.version,
    NEW.content,
    NEW.variables
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for template versioning
CREATE TRIGGER create_template_version_trigger
  AFTER UPDATE ON templates
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.variables IS DISTINCT FROM NEW.variables)
  EXECUTE FUNCTION create_template_version(); 