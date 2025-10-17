-- Create research_areas table
CREATE TABLE IF NOT EXISTS public.research_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create follows table for tracking which users follow which research areas
CREATE TABLE IF NOT EXISTS public.research_area_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  research_area_id uuid REFERENCES research_areas(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, research_area_id)
);

-- Enable RLS
ALTER TABLE public.research_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_area_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for research_areas
CREATE POLICY "Research areas are viewable by everyone"
ON public.research_areas FOR SELECT
USING (true);

-- RLS policies for research_area_follows
CREATE POLICY "Users can view all follows"
ON public.research_area_follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow research areas"
ON public.research_area_follows FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow research areas"
ON public.research_area_follows FOR DELETE
USING (auth.uid() = user_id);

-- Insert some default research areas
INSERT INTO public.research_areas (title, description) VALUES
('Artificial Intelligence & Ethics', 'Exploring the intersection of AI development and ethical considerations, including bias, privacy, and societal impact.'),
('Climate Change & Sustainability', 'Research on climate science, renewable energy, carbon capture, and sustainable development strategies.'),
('Healthcare Innovation', 'Advances in medical technology, drug development, telemedicine, and healthcare delivery systems.'),
('Quantum Technologies', 'Quantum computing, cryptography, and sensing technologies that leverage quantum mechanical principles.')
ON CONFLICT DO NOTHING;