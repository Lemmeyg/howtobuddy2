-- Add new columns for document generation
ALTER TABLE documents
ADD COLUMN generated_content TEXT,
ADD COLUMN document_format TEXT,
ADD COLUMN document_style TEXT,
ADD COLUMN include_summary BOOLEAN DEFAULT true,
ADD COLUMN include_key_points BOOLEAN DEFAULT true,
ADD COLUMN include_action_items BOOLEAN DEFAULT true,
ADD COLUMN include_quotes BOOLEAN DEFAULT true,
ADD COLUMN max_length INTEGER;

-- Update the metadata column type to include new fields
ALTER TABLE documents
ALTER COLUMN metadata TYPE JSONB USING metadata::jsonb;

-- Add indexes for better query performance
CREATE INDEX idx_documents_generated_content ON documents USING gin (to_tsvector('english', generated_content));
CREATE INDEX idx_documents_metadata ON documents USING gin (metadata); 