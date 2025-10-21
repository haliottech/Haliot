-- Add document_url column to research_posts table
ALTER TABLE research_posts ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Create storage bucket for research documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('research-documents', 'research-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for research documents
CREATE POLICY "Anyone can view research documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'research-documents');

CREATE POLICY "Authenticated users can upload research documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'research-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own research documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'research-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own research documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'research-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);